import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { useToast } from "./use-toast";

export function usePasswordReset() {
  const { toast } = useToast();
  
  // Request password reset email
  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("/api/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email })
      });
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description: "If your email exists in our system, you will receive a reset link shortly",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Reset password with token
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      return await apiRequest("/api/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password })
      });
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message || "Invalid or expired token",
        variant: "destructive",
      });
    },
  });
  
  return {
    requestResetMutation,
    resetPasswordMutation,
  };
}