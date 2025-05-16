import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Key } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Schema for admin login
const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    try {
      // Use the admin-specific login endpoint
      await apiRequest("POST", "/api/admin-login", data);
      
      toast({
        title: "Admin login successful",
        description: "You are now logged in as an administrator.",
        variant: "default",
      });
      
      // Redirect to admin dashboard
      setLocation("/admin");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid admin credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Login with your administrator credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? (
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Admin Sign In"
                )}
              </Button>
              <div className="text-center mt-4">
                <Button
                  variant="link"
                  onClick={() => setLocation("/")}
                  className="text-sm"
                >
                  Return to homepage
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or use direct access
              </span>
            </div>
          </div>
          <Button 
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={async () => {
              setIsLoading(true);
              try {
                const adminKey = window.prompt("Enter admin key");
                if (!adminKey) {
                  throw new Error("Admin key required");
                }
                
                // Store admin key in localStorage
                localStorage.setItem('adminKey', adminKey);
                
                // Test access
                const response = await fetch(`/api/direct-admin?key=${encodeURIComponent(adminKey)}`);
                if (response.ok) {
                  const userData = await response.json();
                  
                  toast({
                    title: "Admin access granted",
                    description: "You now have direct admin access.",
                    variant: "default",
                  });
                  
                  // Redirect to admin dashboard
                  setLocation("/admin");
                } else {
                  throw new Error("Access denied");
                }
              } catch (error) {
                toast({
                  title: "Access denied",
                  description: "Invalid admin key. Please try again.",
                  variant: "destructive",
                });
                localStorage.removeItem('adminKey');
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <Key className="h-4 w-4" />
            Direct Admin Access
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}