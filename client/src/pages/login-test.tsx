import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function LoginTestPage() {
  const { loginMutation, isAuthenticated, user, logoutMutation } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-6">Login Test Page</h1>
      
      {isAuthenticated ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Currently Logged In</CardTitle>
            <CardDescription>You are logged in as {user?.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Admin:</strong> {user?.isAdmin ? "Yes" : "No"}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleLogout} 
              disabled={logoutMutation.isPending}
              className="w-full"
            >
              {logoutMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Logout
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Test</CardTitle>
            <CardDescription>Test the login functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Login
              </Button>
              
              {loginMutation.isError && (
                <p className="text-destructive text-sm mt-2">
                  {(loginMutation.error as Error).message}
                </p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              Test Users:
            </p>
            <p className="text-sm">
              <code>admin / password123</code> or <code>testuser / password123</code>
            </p>
          </CardFooter>
        </Card>
      )}
      
      <div className="text-center mt-4">
        <Link href="/">
          <Button variant="link">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}