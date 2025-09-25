import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";


const inviteSchema = z.object({
  email: z.string()
    .min(1, "Email address is required")
    .max(254, "Email address is too long (max 254 characters)")
    .email("Please enter a valid email address")
    .transform(val => val.trim().toLowerCase()), // Sanitize email
  message: z.string()
    .max(500, "Message is too long (max 500 characters)")
    .optional()
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  communityId: string;
  communityName: string;
  children: React.ReactNode;
}

export function InviteUserDialog({ communityId, communityName, children }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      message: ""
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const res = await apiRequest(
        "POST",
        `/api/communities/${communityId}/invite`,
        data
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation sent",
        description: `An invitation to join "${communityName}" has been sent to ${form.getValues("email")}`,
      });
      
      // Invalidate invitations list to refresh it
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/invitations`] });
      
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      // Parse backend error for better user feedback
      let title = "Failed to send invitation";
      let description = error.message;
      
      if (error.message.includes("already a member")) {
        title = "User Already Member";
        description = "This person is already a member of the community.";
      } else if (error.message.includes("invitation has already been sent")) {
        title = "Invitation Already Sent";
        description = "A pending invitation has already been sent to this email address.";
      } else if (error.message.includes("valid email address")) {
        title = "Invalid Email";
        description = "Please check the email address and try again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" data-testid="dialog-invite-user">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join "{communityName}" to someone via email.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter email address"
                        className="pl-10"
                        data-testid="input-email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The person will receive an invitation email with a secure link to join the community.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal message to the invitation..."
                      className="min-h-[80px]"
                      data-testid="textarea-message"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be included in the invitation email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteMutation.isPending}
                data-testid="button-send-invite"
              >
                {inviteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}