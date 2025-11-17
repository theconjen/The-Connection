import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { insertLivestreamerApplicationSchema } from "@connection/shared/schema";
import { Button } from "../components/ui/button";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { apiRequest, queryClient } from "../lib/queryClient";
import MainLayout from "../components/layouts/main-layout";
import { Loader2, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

// Extend the schema for client-side validation
const applicationSchema = insertLivestreamerApplicationSchema.extend({
  ministryName: z.string().min(2, "Ministry name is required"),
  ministryDescription: z.string().min(20, "Please provide a more detailed description of your ministry"),
  ministerialExperience: z.string().optional(),
  statementOfFaith: z.string().min(50, "Please provide a detailed statement of faith"),
  socialMediaLinks: z.string().optional(),
  referenceName: z.string().min(2, "Reference name is required"),
  referenceContact: z.string().min(5, "Reference contact information is required"),
  referenceRelationship: z.string().min(5, "Relationship with reference is required"),
  sampleContentUrl: z.string().url("Please provide a valid URL to your sample content"),
  livestreamTopics: z.string().min(10, "Please describe your intended livestream topics"),
  targetAudience: z.string().min(10, "Please describe your target audience"),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  })
});

type ApplicationValues = z.infer<typeof applicationSchema>;

export default function LivestreamerApplicationPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  
  // Get existing application if any
  type ExistingApplication = {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewNotes?: string;
    // add other fields as needed
  };

  const { 
    data: existingApplication,
    isLoading: isExistingApplicationLoading 
  } = useQuery<ExistingApplication | null>({
    queryKey: ['/api/livestreamer-application'],
    enabled: !!user,
    retry: false,
  });
  
  // Define form
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      ministryName: "",
      ministryDescription: "",
      ministerialExperience: "",
      statementOfFaith: "",
      socialMediaLinks: "",
      referenceName: "",
      referenceContact: "",
      referenceRelationship: "",
      sampleContentUrl: "",
      livestreamTopics: "",
      targetAudience: "",
      agreedToTerms: false,
    }
  });
  
  // Handle application submission
  const applicationMutation = useMutation({
    mutationFn: async (data: ApplicationValues) => {
      const response = await apiRequest('POST', '/api/livestreamer-application', {
        ...data,
        userId: user?.id
      });
      
      return await response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/livestreamer-application'] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted for review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: ApplicationValues) => {
    applicationMutation.mutate(data);
  };
  
  // Redirect to auth page if not logged in
  if (!isAuthLoading && !user) {
    setLocation("/auth");
    return null;
  }
  
  // Show loading state while checking user auth
  if (isAuthLoading || isExistingApplicationLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-mutedPurple" />
        </div>
      </MainLayout>
    );
  }
  
  // If user has already submitted an application
  if (existingApplication) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <h1 className="text-3xl font-bold mb-6 text-mutedPurple">Livestreamer Application</h1>
          
          <Card className="mb-8 border-mutedPurple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-mutedPurple" />
                Application Submitted
              </CardTitle>
              <CardDescription>
                Your application is currently being reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-muted-foreground">
                    {existingApplication.status === 'pending' ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Pending Review
                      </span>
                    ) : existingApplication.status === 'approved' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Approved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Rejected
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Submitted On</h3>
                  <p className="text-muted-foreground">
                    {new Date(existingApplication.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                
                {existingApplication.reviewNotes && (
                  <div>
                    <h3 className="font-medium">Review Notes</h3>
                    <p className="text-muted-foreground">{existingApplication.reviewNotes}</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/livestreams">
                  Return to Livestreams
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // If the application was just submitted
  if (submitted) {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <h1 className="text-3xl font-bold mb-6 text-mutedPurple">Livestreamer Application</h1>
          
          <Card className="mb-8 border-mutedPurple/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Application Submitted Successfully
              </CardTitle>
              <CardDescription>
                Thank you for your interest in becoming a livestreamer on The Connection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Your application has been received and will be reviewed by our team. This process typically takes 2-3 business days.</p>
              <p>You'll receive a notification when your application status changes.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/livestreams">
                  Return to Livestreams
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Main application form
  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6 text-mutedPurple">Livestreamer Application</h1>
        
        <div className="mb-8">
          <Tabs defaultValue="information">
            <TabsList className="mb-6">
              <TabsTrigger value="information">Information</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="application">Application</TabsTrigger>
            </TabsList>
            
            <TabsContent value="information">
              <Card>
                <CardHeader>
                  <CardTitle>Become a Livestreamer</CardTitle>
                  <CardDescription>
                    Share your gifts and ministry with our Christian community through livestreaming.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The Connection provides a platform for Christian ministries, teachers, and worship leaders to reach our community through live video content.
                  </p>
                  
                  <h3 className="font-semibold text-lg">Creator Incentives</h3>
                  <p>
                    As you grow your audience and maintain a consistent streaming schedule, you'll progress through our Creator Tiers, unlocking benefits such as:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Enhanced visibility and discoverability</li>
                    <li>Viewer gift support through our virtual gift system</li>
                    <li>Feature placement on our platform</li>
                    <li>Ministry impact metrics and analytics</li>
                    <li>Opportunities to participate in special events</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => form.setFocus("ministryName")}>
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="requirements">
              <Card>
                <CardHeader>
                  <CardTitle>Application Requirements</CardTitle>
                  <CardDescription>
                    Review what you'll need to complete your application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h3 className="font-semibold text-lg">Content Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All content must align with traditional Christian values and teachings</li>
                    <li>Content must be appropriate for our community audience</li>
                    <li>You must have the rights to all content you share</li>
                    <li>Preaching, teaching and prayer must align with historic Christian orthodoxy</li>
                  </ul>
                  
                  <h3 className="font-semibold text-lg">Technical Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Reliable internet connection with at least 5Mbps upload speed</li>
                    <li>Basic audio/video equipment for quality streaming</li>
                    <li>Quiet environment free from excessive background noise</li>
                    <li>Ability to maintain a consistent streaming schedule</li>
                  </ul>
                  
                  <h3 className="font-semibold text-lg">Application Process</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>Complete the application form with your ministry details</li>
                    <li>Provide a link to a sample of your content</li>
                    <li>Include a reference from your church or ministry</li>
                    <li>Our team will review your application (typically 2-3 business days)</li>
                    <li>If approved, you'll gain access to create livestreams</li>
                  </ol>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => form.setFocus("ministryName")}>
                    Apply Now
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="application">
              <Card>
                <CardHeader>
                  <CardTitle>Livestreamer Application Form</CardTitle>
                  <CardDescription>
                    Please complete all fields to submit your application.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Ministry Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="ministryName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ministry Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your ministry or channel name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will be displayed on your livestreams.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ministryDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ministry Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your ministry's purpose and vision" 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a clear description of your ministry's focus and goals.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ministerialExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ministerial Experience (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your background and experience in ministry" 
                                  className="min-h-[100px]"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                Include any relevant education, training, or experience.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="statementOfFaith"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statement of Faith</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Share your core beliefs and doctrinal positions" 
                                  className="min-h-[150px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Outline your core theological beliefs and doctrinal positions.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Reference Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="referenceName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Name of your reference" {...field} />
                              </FormControl>
                              <FormDescription>
                                Provide the name of a pastor, elder, or ministry leader who can vouch for you.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="referenceContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Email or phone number of your reference" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="referenceRelationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship to Reference</FormLabel>
                              <FormControl>
                                <Input placeholder="How do you know this person?" {...field} />
                              </FormControl>
                              <FormDescription>
                                E.g., "My pastor at First Church for 5 years"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Content Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="socialMediaLinks"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Social Media Links (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Links to your existing ministry social media accounts" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                One link per line.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="sampleContentUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sample Content URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="URL to a sample of your preaching, teaching, or worship leading" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Provide a link to YouTube, Vimeo, or another hosting platform where we can view your content.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="livestreamTopics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Livestream Topics</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="What topics do you plan to cover in your livestreams?" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Audience</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Who is your intended audience?" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Describe the demographic you wish to reach with your content.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <Alert className="bg-mutedPurple/5 border-mutedPurple/20">
                        <AlertTitle className="text-mutedPurple">Terms & Conditions</AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="mb-4">By submitting this application, you agree to:</p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Adhere to The Connection's community guidelines</li>
                            <li>Maintain a respectful and inclusive environment</li>
                            <li>Refrain from sharing hateful, divisive, or harmful content</li>
                            <li>Respect the privacy and dignity of all community members</li>
                            <li>Allow The Connection to review your streams for moderation purposes</li>
                          </ul>
                          
                          <FormField
                            control={form.control}
                            name="agreedToTerms"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    I agree to the terms and conditions
                                  </FormLabel>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={applicationMutation.isPending}
                      >
                        {applicationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting
                          </>
                        ) : "Submit Application"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}