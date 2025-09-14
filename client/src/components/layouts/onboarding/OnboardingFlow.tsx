import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../../../hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '../../../hooks/use-auth';

const STEPS = [
  'welcome',
  'location',
  'interests',
  'mission'
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const INTEREST_OPTIONS = [
  { value: 'bible-study', label: 'Bible Study' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'worship', label: 'Worship' },
  { value: 'family', label: 'Family' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'apologetics', label: 'Apologetics' },
  { value: 'theology', label: 'Theology' },
  { value: 'missions', label: 'Missions' },
  { value: 'evangelism', label: 'Evangelism' },
  { value: 'discipleship', label: 'Discipleship' },
  { value: 'community-service', label: 'Community Service' },
  { value: 'health-fitness', label: 'Health & Fitness' },
  { value: 'arts-creativity', label: 'Arts & Creativity' },
  { value: 'music', label: 'Music' },
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'outdoors', label: 'Outdoors & Recreation' },
  { value: 'sports', label: 'Sports' },
  { value: 'books-reading', label: 'Books & Reading' },
  { value: 'cooking-food', label: 'Cooking & Food' },
];

export function OnboardingFlow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    zipCode: '',
    interests: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStateChange = (value: string) => {
    setFormData({
      ...formData,
      state: value,
    });
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const completeData = {
        ...formData,
        interests: selectedInterests,
        onboardingCompleted: true
      };

      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeData)
      });

      toast({
        title: 'Onboarding Complete',
        description: 'Your profile has been updated successfully!',
      });

      // Navigate to dashboard or home page
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (STEPS[currentStep]) {
      case 'welcome':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to The Connection!</CardTitle>
              <CardDescription>
                We're excited to help you connect with other Christians who share your faith and interests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
                <p>To help Christians connect with each other based on:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold text-primary">Location</h4>
                    <p className="text-sm">Find believers in your city</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold text-primary">Interests</h4>
                    <p className="text-sm">Connect around shared passions</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold text-primary">Faith</h4>
                    <p className="text-sm">Grow together in Christ</p>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Let's get started by setting up your profile to connect with others
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNextStep}>Start Onboarding</Button>
            </CardFooter>
          </Card>
        );

      case 'location':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Where are you located?</CardTitle>
              <CardDescription>
                Finding Christians in your area is a cornerstone of our community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city"
                  placeholder="Enter your city" 
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select onValueChange={handleStateChange} value={formData.state}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="Enter your ZIP code"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="rounded-lg bg-primary/10 p-4 text-center mt-4">
                <h3 className="text-lg font-semibold mb-2">Why This Matters</h3>
                <p className="text-sm">
                  Sharing your location helps us connect you with local Christian communities, 
                  events in your area, and believers who live nearby.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button 
                onClick={handleNextStep}
                disabled={!formData.city || !formData.state}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        );

      case 'interests':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>What are your interests?</CardTitle>
              <CardDescription>
                Select interests to find like-minded Christians who share your passions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {INTEREST_OPTIONS.map((interest) => (
                  <Button
                    key={interest.value}
                    variant={selectedInterests.includes(interest.value) ? "default" : "outline"}
                    onClick={() => toggleInterest(interest.value)}
                    className="m-1"
                  >
                    {interest.label}
                  </Button>
                ))}
              </div>
              <div className="rounded-lg bg-primary/10 p-4 text-center mt-4">
                <h3 className="text-lg font-semibold mb-2">Connect Around Shared Passions</h3>
                <p className="text-sm">
                  The Connection helps you find Christian communities focused on your 
                  specific interests - from sports to music, art to technology.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button 
                onClick={handleNextStep}
                disabled={selectedInterests.length === 0}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        );

      case 'mission':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle>You're Almost Ready!</CardTitle>
              <CardDescription>
                Let's finish setting up your profile to begin connecting with others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/10 p-4">
                  <h3 className="text-xl font-semibold text-center mb-4">Our Platform's Purpose</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">1</span>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold">Start a group in your city</h4>
                        <p className="text-sm">Create local communities that meet in person to build real relationships</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold">Find people who share our faith and your interests</h4>
                        <p className="text-sm">Connect based on shared passions, from sports teams to music to hobbies</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold">3</span>
                      </div>
                      <div className="ml-4">
                        <h4 className="font-semibold">Connect together. Grow together. Witness together.</h4>
                        <p className="text-sm">Build relationships that strengthen your faith and impact your community</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </Button>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight">The Connection</h2>
        <p className="text-muted-foreground">Christians connecting around shared interests</p>
      </div>
      
      <div className="w-full max-w-3xl">
        {renderStep()}
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Step {currentStep + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}