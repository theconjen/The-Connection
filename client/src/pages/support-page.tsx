import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import MainLayout from "../components/layouts/main-layout";
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
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Mail, MessageSquare, User, CheckCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Form validation schema
const supportSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export default function SupportPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  // Mutation for sending support email
  const sendSupportEmail = useMutation({
    mutationFn: async (data: SupportFormValues) => {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Message Sent Successfully",
        description: "We've received your message and will get back to you soon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Sending Message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportFormValues) => {
    sendSupportEmail.mutate(data);
  };

  if (isSubmitted) {
    return (
      <MainLayout>
        <div className="flex-1 max-w-2xl mx-auto py-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">Message Sent Successfully!</h2>
                <p className="text-green-800 mb-6">
                  Thank you for contacting us. We've received your message and will respond within 24-48 hours.
                </p>
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-100"
                >
                  Send Another Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 max-w-2xl mx-auto py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Contact Support</h1>
          <p className="text-muted-foreground text-lg">
            Need help? Have a question? We're here to assist you.
          </p>
        </div>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Get in Touch
            </CardTitle>
            <CardDescription>
              Send us a message and we'll respond as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">hello@theconnection.app</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    For faster support, please include as much detail as possible about your issue or question.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you soon. Only the message field is required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name (optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your full name" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email (optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@example.com" 
                          {...field} 
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Message *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe your question, issue, or feedback in detail..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium"
                  disabled={sendSupportEmail.isPending}
                >
                  {sendSupportEmail.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">How do I reset my password?</h4>
                <p className="text-sm text-muted-foreground">
                  Go to the login page and click "Forgot your password?" to reset your password via email.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">How do I join a community?</h4>
                <p className="text-sm text-muted-foreground">
                  Browse communities on the Communities page and click "Join" on any community that interests you.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Can I create my own community?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! Visit the Communities page and look for the "Create Community" option to start your own.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">How do I report inappropriate content?</h4>
                <p className="text-sm text-muted-foreground">
                  Use the report feature on any post or contact our support team directly with details about the content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
