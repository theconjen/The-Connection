/**
 * Ask a Question Page
 * Allows users to submit questions to the apologetics team
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { Mail, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

type Domain = "apologetics" | "polemics";

type QaArea = {
  id: number;
  name: string;
  slug: string;
  domain: Domain;
};

type QaTag = {
  id: number;
  name: string;
  slug: string;
  areaId: number;
};

export default function QuestionsAskPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    domain: "apologetics" as Domain,
    areaId: null as number | null,
    tagId: null as number | null,
    questionText: "",
  });

  // Fetch areas
  const { data: areas = [] } = useQuery<QaArea[]>({
    queryKey: ["qa-areas", formData.domain],
    queryFn: async () => {
      const res = await fetch(`/api/qa-areas?domain=${formData.domain}`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    },
  });

  // Fetch tags for selected area
  const { data: tags = [] } = useQuery<QaTag[]>({
    queryKey: ["qa-tags", formData.areaId],
    enabled: !!formData.areaId,
    queryFn: async () => {
      const res = await fetch(`/api/qa-tags?areaId=${formData.areaId}`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });

  // Submit question mutation
  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit question");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Question Submitted",
        description: "Our research team will review your question and get back to you.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your question",
        variant: "destructive",
      });
      return;
    }
    if (!formData.areaId) {
      toast({
        title: "Error",
        description: "Please select a topic area",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to ask a question to our research team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (submitted) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Question Submitted!</CardTitle>
              <CardDescription>
                Thank you for your question. Our research team will review it and provide a thoughtful response.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Ask Another Question
              </Button>
              <Link href="/apologetics">
                <Button className="w-full" variant="secondary">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Apologetics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/apologetics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apologetics
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Ask the Research Team</CardTitle>
                <CardDescription>
                  Submit your question and our team of scholars will provide a thoughtful, well-researched answer.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Domain Selection */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.domain}
                  onValueChange={(value: Domain) => {
                    setFormData({ ...formData, domain: value, areaId: null, tagId: null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apologetics">Apologetics (Defending the Faith)</SelectItem>
                    <SelectItem value="polemics">Polemics (Comparing Beliefs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Area Selection */}
              <div className="space-y-2">
                <Label>Topic Area *</Label>
                <Select
                  value={formData.areaId?.toString() || ""}
                  onValueChange={(value) => {
                    setFormData({ ...formData, areaId: parseInt(value), tagId: null });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Selection (optional) */}
              {formData.areaId && tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Specific Topic (Optional)</Label>
                  <Select
                    value={formData.tagId?.toString() || ""}
                    onValueChange={(value) => {
                      setFormData({ ...formData, tagId: value ? parseInt(value) : null });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a specific topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id.toString()}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Question Text */}
              <div className="space-y-2">
                <Label>Your Question *</Label>
                <Textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Type your question here... Be as specific as possible for a better answer."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.questionText.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Question
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
