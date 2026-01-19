import { useState, useEffect } from "react";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2, ArrowLeft, CheckCircle, AlertTriangle, Mail } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Request password reset schema
const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Reset password schema with stronger validation (must match backend: 12 chars min)
const resetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string()
    .min(12, "Password must be at least 12 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(12, "Password must be at least 12 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RequestFormValues = z.infer<typeof requestSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onBack: () => void;
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [resetToken, setResetToken] = useState<string>("");

  // Form for requesting password reset
  const requestForm = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for resetting password with token
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Check URL for token on mount (when user clicks email link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      resetForm.setValue("token", tokenFromUrl);
      setStep("reset");
    }
  }, [resetForm]);
  
  // Request password reset mutation
  const requestMutation = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      const res = await apiRequest("POST", "/api/password-reset/request", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description: "If your email exists in our system, you will receive a reset link shortly",
      });
      setStep("reset");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Reset password mutation
  const resetMutation = useMutation({
    mutationFn: async (data: ResetFormValues) => {
      // Backend expects 'newPassword', not 'password'
      const res = await apiRequest("POST", "/api/password-reset/reset", {
        token: data.token,
        newPassword: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password",
      });
      setStep("success");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message || "Invalid or expired token",
        variant: "destructive",
      });
    },
  });
  
  // Handle request form submission
  const onRequestSubmit = (data: RequestFormValues) => {
    requestMutation.mutate(data);
  };
  
  // Handle reset form submission
  const onResetSubmit = (data: ResetFormValues) => {
    resetMutation.mutate(data);
  };
  
  // Handle manual token entry
  const handleTokenChange = (token: string) => {
    setResetToken(token);
    resetForm.setValue("token", token);
  };
  
  // Render request password reset form
  if (step === "request") {
    return (
      <div>
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2 hover:bg-transparent" 
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
          <h3 className="text-lg font-medium">Reset Your Password</h3>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <Form {...requestForm}>
          <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
            <FormField
              control={requestForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }
  
  // Render reset password form
  if (step === "reset") {
    return (
      <div>
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2 hover:bg-transparent" 
            onClick={() => setStep("request")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
          </Button>
          <h3 className="text-lg font-medium">Set New Password</h3>
        </div>
        
        <Alert className="mb-4">
          <Mail className="h-4 w-4" />
          <AlertTitle>Check your email</AlertTitle>
          <AlertDescription>
            We've sent a password reset token to your email address. Enter it below to continue.
          </AlertDescription>
        </Alert>
        
        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
            <FormField
              control={resetForm.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter token from email" 
                      value={resetToken}
                      onChange={(e) => handleTokenChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={resetForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground mt-1">
                    Password must contain at least 12 characters including uppercase, lowercase, number, and special character.
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }
  
  // Render success message - mobile-friendly with app redirect
  return (
    <div className="text-center py-8 px-4">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
      <h3 className="text-2xl font-semibold mb-3">Password Updated!</h3>
      <p className="text-muted-foreground mb-8 text-lg">
        Your password has been successfully reset. You can now sign in with your new password.
      </p>

      {/* Mobile app button - primary action */}
      <Button
        onClick={() => {
          // Try to open the app via custom scheme
          window.location.href = 'theconnection://login';
          // Fallback: after a short delay, show the web login
          setTimeout(() => {
            onBack();
          }, 1500);
        }}
        className="w-full mb-3 h-12 text-base"
        size="lg"
      >
        Open The Connection App
      </Button>

      {/* Web login fallback */}
      <Button
        variant="outline"
        onClick={onBack}
        className="w-full h-12 text-base"
        size="lg"
      >
        Sign In on Web
      </Button>

      <p className="text-sm text-muted-foreground mt-6">
        If the app doesn't open automatically, return to The Connection app and sign in.
      </p>
    </div>
  );
}