import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { insertApologistScholarApplicationSchema } from "@connection/shared/schema";
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
import { Loader2, CheckCircle, AlertTriangle, ChevronRight, BookOpen, GraduationCap } from "lucide-react";

// Extended schema with validation
const formSchema = insertApologistScholarApplicationSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  agreedToGuidelines: z
    .boolean()
    .refine((value) => value === true, {
      message: "You must agree to the community guidelines",
    }),
  weeklyTimeCommitment: z.string().min(1, "Please specify your weekly time commitment"),
  academicCredentials: z.string().min(10, "Please provide more details about your academic credentials"),
  educationalBackground: z.string().min(10, "Please provide more details about your educational background"),
  theologicalPerspective: z.string().min(10, "Please provide more details about your theological perspective"),
  statementOfFaith: z.string().min(50, "Please provide a more detailed statement of faith"),
  areasOfExpertise: z.string().min(10, "Please specify your areas of expertise"),
  writingSample: z.string().min(100, "Please provide a more substantial writing sample"),
  motivation: z.string().min(30, "Please elaborate on your motivation"),
  publishedWorks: z.string().optional(),
  priorApologeticsExperience: z.string().optional(),
  onlineSocialHandles: z.string().optional(),
  referenceName: z.string().optional(),
  referenceContact: z.string().optional(),
  referenceInstitution: z.string().optional(),
});

export default function ApologistScholarApplicationPage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Define the type for the application data
  type ApologistScholarApplication = {
    status: "pending" | "approved" | "rejected";
    reviewNotes?: string;
    // add other fields as needed
  };
  
  // Check if user already has an application
  const { data: existingApplication, isLoading: isCheckingApplication } = useQuery<ApologistScholarApplication | null>({
    queryKey: ["/api/apologist-scholar-application"],
    enabled: isAuthenticated,
  });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      academicCredentials: "",
      educationalBackground: "",
      theologicalPerspective: "",
      statementOfFaith: "",
      areasOfExpertise: "",
      publishedWorks: "",
      priorApologeticsExperience: "",
      writingSample: "",
      onlineSocialHandles: "",
      referenceName: "",
      referenceContact: "",
      referenceInstitution: "",
      motivation: "",
      weeklyTimeCommitment: "",
      agreedToGuidelines: true,
    },
  });
  
  // Submit mutation
  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest(
        "POST",
        "/api/apologist-scholar-application",
        values
      );
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. We'll review it shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apologist-scholar-application"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values);
  }
  
  // Navigation between form tabs
  const goToNextTab = () => {
    if (activeTab === "personal") {
      // Validate fields in the personal tab
      form.trigger(["fullName", "academicCredentials", "educationalBackground", "theologicalPerspective"]);
      const hasErrors = !!form.formState.errors.fullName || 
                        !!form.formState.errors.academicCredentials || 
                        !!form.formState.errors.educationalBackground ||
                        !!form.formState.errors.theologicalPerspective;
      
      if (!hasErrors) setActiveTab("expertise");
    } else if (activeTab === "expertise") {
      form.trigger(["statementOfFaith", "areasOfExpertise", "writingSample", "priorApologeticsExperience"]);
      const hasErrors = !!form.formState.errors.statementOfFaith ||
                        !!form.formState.errors.areasOfExpertise ||
                        !!form.formState.errors.writingSample ||
                        !!form.formState.errors.priorApologeticsExperience;
      
      if (!hasErrors) setActiveTab("reference");
    } else if (activeTab === "reference") {
      form.trigger(["referenceName", "referenceContact", "referenceInstitution"]);
      const hasErrors = !!form.formState.errors.referenceName ||
                        !!form.formState.errors.referenceContact ||
                        !!form.formState.errors.referenceInstitution;
      
      if (!hasErrors) setActiveTab("commitment");
    }
  };
  
  const goToPrevTab = () => {
    if (activeTab === "expertise") setActiveTab("personal");
    else if (activeTab === "reference") setActiveTab("expertise");
    else if (activeTab === "commitment") setActiveTab("reference");
  };
  
  // Redirect if not logged in
  if (!isAuthenticated && !isCheckingApplication) {
    navigate("/login");
    return null;
  }
  
  // Show pending application if exists
  if (existingApplication && existingApplication.status === "pending") {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Application In Review</CardTitle>
              <CardDescription>
                Your application to become an Apologist Scholar contributor is currently being reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Status: Pending</AlertTitle>
                <AlertDescription>
                  We've received your application and our team is reviewing it. You'll be notified by email once a decision has been made.
                </AlertDescription>
              </Alert>
              <div className="mt-6">
                <h3 className="text-lg font-medium">What happens next?</h3>
                <p className="text-muted-foreground mt-2">
                  Our team will review your qualifications, writing sample, and references. This process typically takes 1-2 weeks. 
                  You'll receive an email notification once your application has been reviewed.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Show approved application
  if (existingApplication && existingApplication.status === "approved") {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Approved!</CardTitle>
              <CardDescription>
                Congratulations! You've been approved as an Apologist Scholar contributor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Application Status: Approved</AlertTitle>
                <AlertDescription>
                  You can now contribute content to our apologetics section and answer questions from community members.
                </AlertDescription>
              </Alert>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Get Started</h3>
                <p className="text-muted-foreground mt-2">
                  You can now begin contributing answers to apologetics questions or create new content in the apologetics section.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
              <Button asChild>
                <Link to="/apologetics/questions">Go to Apologetics Questions</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Show rejected application
  if (existingApplication && existingApplication.status === "rejected") {
    return (
      <MainLayout>
        <div className="container max-w-4xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                Thank you for your interest in becoming an Apologist Scholar contributor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Application Status: Not Approved</AlertTitle>
                <AlertDescription>
                  We appreciate your interest, but we are unable to approve your application at this time.
                </AlertDescription>
              </Alert>
              <div className="mt-6">
                <h3 className="text-lg font-medium">Feedback from our team</h3>
                <p className="text-muted-foreground mt-2">
                  {existingApplication.reviewNotes || "No specific feedback was provided."}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  // Show application form
  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              <CardTitle>Apologist Scholar Application</CardTitle>
            </div>
            <CardDescription>
              Apply to become a verified apologetics contributor on The Connection platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">What is an Apologist Scholar?</h3>
              <p className="text-muted-foreground">
                Apologist Scholars are verified contributors with theological education or expertise who answer 
                apologetics questions and create content to help Christians better understand and defend their faith.
              </p>
              <h3 className="text-lg font-medium">Qualifications</h3>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Theological education or equivalent experience</li>
                <li>Demonstrated expertise in Christian apologetics</li>
                <li>Agreement with our statement of faith</li>
                <li>Ability to communicate complex theological concepts clearly</li>
                <li>Strong writing skills and attention to detail</li>
              </ul>
            </div>
            
            <Separator className="my-6" />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="expertise">Expertise</TabsTrigger>
                    <TabsTrigger value="reference">References</TabsTrigger>
                    <TabsTrigger value="commitment">Commitment</TabsTrigger>
                  </TabsList>
                  
                  {/* Personal Information Tab */}
                  <TabsContent value="personal" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="academicCredentials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Credentials</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your degrees, certifications, etc." 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Include any relevant degrees, certifications, or qualifications related to theology or apologetics.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="educationalBackground"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Educational Background</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your educational journey" 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your educational journey, institutions attended, and areas of study.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="theologicalPerspective"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theological Perspective</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your theological background and perspective" 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your theological background, denominational affiliation (if any), and overall perspective.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end mt-6">
                      <Button type="button" onClick={goToNextTab}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Expertise Tab */}
                  <TabsContent value="expertise" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="statementOfFaith"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statement of Faith</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share your personal statement of faith" 
                              {...field} 
                              className="min-h-[150px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a personal statement outlining your core Christian beliefs and theological positions.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="areasOfExpertise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Areas of Expertise</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your areas of apologetics expertise" 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Specify your areas of apologetics expertise (e.g., historical apologetics, philosophical arguments, scientific apologetics).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="publishedWorks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Published Works (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List any books, articles, blog posts you've published" 
                              {...field}
                              value={field.value || ""}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            List any books, articles, blog posts, or other publications you've authored related to theology or apologetics.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priorApologeticsExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prior Apologetics Experience</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your experience in apologetics ministry" 
                              {...field} 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your experience teaching, speaking, or writing in the field of apologetics.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="writingSample"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Writing Sample</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a sample answer to an apologetics question" 
                              {...field} 
                              className="min-h-[200px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a sample answer to this apologetics question: "How can a good God allow evil and suffering in the world?"
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="onlineSocialHandles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Online Social Handles (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your social media accounts, blog, website, etc." 
                              {...field}
                              value={field.value || ""}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Share links to your social media accounts, blog, personal website, or other online presence.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={goToPrevTab}>
                        Back
                      </Button>
                      <Button type="button" onClick={goToNextTab}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* References Tab */}
                  <TabsContent value="reference" className="space-y-4 pt-4">
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
                            Provide the name of a theological teacher, pastor, or other qualified individual who can vouch for your knowledge and character.
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
                          <FormLabel>Reference Contact Information</FormLabel>
                          <FormControl>
                            <Input placeholder="Email or phone number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Provide an email address or phone number for your reference.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="referenceInstitution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Institution/Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="Church, seminary, university, etc." {...field} />
                          </FormControl>
                          <FormDescription>
                            The organization or institution where your reference works or serves.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between mt-6">
                      <Button type="button" variant="outline" onClick={goToPrevTab}>
                        Back
                      </Button>
                      <Button type="button" onClick={goToNextTab}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Commitment Tab */}
                  <TabsContent value="commitment" className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivation</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Why do you want to be an Apologist Scholar?" 
                              {...field} 
                              className="min-h-[150px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Explain why you want to serve as an Apologist Scholar and what you hope to contribute to our community.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weeklyTimeCommitment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Time Commitment</FormLabel>
                          <FormControl>
                            <Input placeholder="Hours per week you can commit" {...field} />
                          </FormControl>
                          <FormDescription>
                            How many hours per week can you commit to answering questions and creating content?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-6 space-y-6">
                      <div className="rounded-md border p-4 bg-muted/50">
                        <h3 className="text-lg font-medium mb-2">Community Guidelines</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          As an Apologist Scholar, you agree to:
                        </p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                          <li>Respond to questions with grace, respect, and theological accuracy</li>
                          <li>Provide biblically-based answers that align with orthodox Christian teaching</li>
                          <li>Cite sources and references when appropriate</li>
                          <li>Maintain a charitable tone when addressing different theological perspectives</li>
                          <li>Respond to assigned questions within one week</li>
                          <li>Create at least one piece of original apologetics content per month</li>
                          <li>Work collaboratively with other Apologist Scholars</li>
                          <li>Participate in occasional team meetings and training sessions</li>
                        </ul>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="agreedToGuidelines"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value === true}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to follow the Apologist Scholar community guidelines
                              </FormLabel>
                              <FormDescription>
                                By checking this box, you agree to adhere to the guidelines above.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-8">
                      <Button type="button" variant="outline" onClick={goToPrevTab}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}