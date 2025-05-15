import { useState } from "react";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "../assets/tc-logo.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Left Side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="flex items-center gap-2 font-bold text-2xl text-primary">
                <img src={logoImage} alt="The Connection Logo" className="h-10 w-auto" />
                <span className="text-gradient font-semibold ml-2">The Connection</span>
              </div>
            </div>
            <CardTitle className="text-2xl text-center text-gradient">Welcome!</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                className="text-sm" 
                size="sm"
              >
                Continue as Guest
              </Button>
            </div>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login" className="custom-tab-trigger">Login</TabsTrigger>
                <TabsTrigger value="register" className="custom-tab-trigger">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <div className="flex flex-col space-y-6 py-4">
                  <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Sign in to your account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Sign in with your Replit account to access The Connection
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full btn-gradient" 
                    onClick={() => window.location.href = "/api/login"}
                  >
                    Sign in with Replit
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <span className="text-neutral-600">Don't have an account? </span>
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
                <div className="flex flex-col space-y-6 py-4">
                  <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      Create an account
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Register with your Replit account to join The Connection
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full btn-gradient" 
                    onClick={() => window.location.href = "/api/login"}
                  >
                    Sign up with Replit
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  <span className="text-neutral-600">Already have an account? </span>
                  <Button 
                    variant="link" 
                    className="p-0 text-gradient" 
                    onClick={() => setActiveTab("login")}
                  >
                    Sign In
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right Side - Hero */}
      <div className="flex-1 bg-purple-700 p-12 flex flex-col justify-center relative hidden md:flex">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative z-10 text-white max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-6">Join Our Christian Community</h1>
          <p className="text-lg mb-8 text-white">
            The Connection is a community platform for Christians to grow together through discussions, Bible studies, and apologetics resources.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-6 w-6 text-pink-200">
                <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Join Discussion Communities</h3>
                <p className="text-white text-sm">Engage in thoughtful conversations about faith, theology, and Christian living.</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-6 w-6 text-pink-200">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Access Apologetics Resources</h3>
                <p className="text-white text-sm">Learn how to defend your faith with confidence using our curated materials.</p>
              </div>
            </div>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 h-6 w-6 text-pink-200">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1">Create Private Bible Study Groups</h3>
                <p className="text-white text-sm">Form private groups for Bible studies, prayer, and fellowship with friends and family.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
