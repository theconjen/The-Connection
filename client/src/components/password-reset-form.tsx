import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetFormValues = z.infer<typeof resetSchema>;

interface PasswordResetFormProps {
  onBack: () => void;
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ResetFormValues) => {
      const res = await apiRequest("POST", "/api/request-password-reset", data);
      return res;
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message || "There was a problem sending the reset email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetFormValues) => {
    resetMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="p-6 flex flex-col items-center text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-muted-foreground mb-6">
          We've sent a password reset link to <span className="font-medium">{form.getValues().email}</span>. 
          Please check your inbox and follow the instructions to reset your password.
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          If you don't receive an email within a few minutes, check your spam folder or try again.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your@email.com"
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full btn-gradient"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending reset email...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </Button>
        </form>
      </Form>
    </>
  );
}