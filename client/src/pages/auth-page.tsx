import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Redirect, useLocation } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { insertUserSchema, InsertUser } from "@connection/shared/schema";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import logoImage from "../assets/tc-logo.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Loader2, Eye, EyeOff } from "lucide-react";
import PasswordResetForm from "../components/password-reset-form";

// Extend the schema with stronger validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const auth = useAuth() as AuthContextType;
  const { user } = auth;
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  // Use a looser form typing here to allow optional fields like displayName and bio
  // while we incrementally align the shared schema with the UI fields.
  const registerForm = useForm<any>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      bio: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    auth.loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Omit confirmPassword as it's not in the InsertUser type
    const { confirmPassword, ...userData } = data;
    
    auth.registerMutation.mutate(userData as InsertUser);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Left Side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md auth-card-enter">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm hover:shadow-3xl transition-shadow duration-300">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex justify-center">
                <div className="flex items-center gap-3 font-bold text-2xl text-primary group">
                  <div className="relative">
                    <img 
                      src={logoImage} 
                      alt="The Connection Logo" 
                      className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="text-gradient font-semibold text-2xl">The Connection</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold text-gradient">Welcome!</CardTitle>
                <CardDescription className="text-muted-foreground text-base">
                  Sign in to your account or create a new one to get started
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger 
                    value="login" 
                    className="custom-tab-trigger transition-all duration-200 data-[state=active]:shadow-sm"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="custom-tab-trigger transition-all duration-200 data-[state=active]:shadow-sm"
                  >
                    Register
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reset" 
                    className="custom-tab-trigger transition-all duration-200 data-[state=active]:shadow-sm"
                  >
                    Reset
                  </TabsTrigger>
                </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Username</FormLabel>
                          <FormControl>
                            <div className="form-input-focus">
                              <Input 
                                placeholder="johnsmith" 
                                {...field} 
                                className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                          <FormControl>
                            <div className="relative form-input-focus">
                              <Input 
                                type={showLoginPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                                className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 pr-12"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                tabIndex={-1}
                              >
                                {showLoginPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-gradient h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]" 
                      disabled={auth.loginMutation.isPending}
                    >
                      {auth.loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                  <div className="mb-2">
                    <Button 
                      variant="link" 
                      className="p-0 text-muted-foreground hover:text-primary" 
                      onClick={() => setActiveTab("reset")}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 text-gradient" 
                    onClick={() => setActiveTab("register")}
                  >
                    Register
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johnsmith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showRegisterPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                tabIndex={-1}
                              >
                                {showRegisterPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Tell us a bit about yourself" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-gradient h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                      disabled={auth.registerMutation.isPending}
                    >
                      {auth.registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 text-gradient" 
                    onClick={() => setActiveTab("login")}
                  >
                    Sign In
                  </Button>
                </div>
              </TabsContent>
              
                <TabsContent value="reset">
                  <PasswordResetForm onBack={() => setActiveTab("login")} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary via-primary to-secondary p-12 hidden md:flex md:flex-col md:justify-center relative overflow-hidden">
        {/* Enhanced background pattern */}
        <div className="absolute inset-0 opacity-8">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="white" strokeWidth="0.3" />
              </pattern>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        
        {/* Floating accent elements */}
        <div className="absolute top-20 right-16 w-32 h-32 bg-accent/10 rounded-full blur-2xl pulse-accent"></div>
        <div className="absolute bottom-32 left-12 w-24 h-24 bg-white/5 rounded-full blur-xl floating-bg-element"></div>
        
        <div className="relative z-10 text-white max-w-lg mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Join Our <span className="text-accent">Christian</span> Community
            </h1>
            <p className="text-xl mb-6 text-white/90 leading-relaxed">
              The Connection is a community platform for Christians to grow together through discussions, Bible studies, and apologetics resources.
            </p>
            <div className="w-16 h-1 bg-accent rounded-full"></div>
          </div>
          <div className="space-y-6">
            <div className="flex items-start group hero-feature-hover">
              <div className="mr-4 p-2 bg-accent/20 rounded-lg transition-all duration-300 group-hover:bg-accent/30 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent">
                  <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-lg">Join Discussion Communities</h3>
                <p className="text-white/80 leading-relaxed">Engage in thoughtful conversations about faith, theology, and Christian living with believers worldwide.</p>
              </div>
            </div>
            <div className="flex items-start group hero-feature-hover">
              <div className="mr-4 p-2 bg-accent/20 rounded-lg transition-all duration-300 group-hover:bg-accent/30 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-lg">Access Apologetics Resources</h3>
                <p className="text-white/80 leading-relaxed">Learn how to defend your faith with confidence using our curated materials and expert guidance.</p>
              </div>
            </div>
            <div className="flex items-start group hero-feature-hover">
              <div className="mr-4 p-2 bg-accent/20 rounded-lg transition-all duration-300 group-hover:bg-accent/30 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-lg">Create Private Bible Study Groups</h3>
                <p className="text-white/80 leading-relaxed">Form private groups for Bible studies, prayer, and fellowship with friends and family.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
