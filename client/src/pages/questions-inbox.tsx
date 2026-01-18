/**
 * Apologetics Questions Inbox
 * For apologists to view and answer submitted questions from the PRIVATE user_questions table
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { Inbox, Send, Plus, X, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";

type UserQuestion = {
  id: number;
  askerUserId: number;
  domain: "apologetics" | "polemics";
  areaId: number;
  tagId: number;
  questionText: string;
  status: string;
  publishedPostId: number | null;
  createdAt: string;
  updatedAt: string;
  asker?: {
    username: string;
    displayName: string | null;
  };
  area?: {
    id: number;
    name: string;
  };
  tag?: {
    id: number;
    name: string;
  };
};

type QaArea = {
  id: number;
  name: string;
  slug: string;
  domain: "apologetics" | "polemics";
};

type QaTag = {
  id: number;
  name: string;
  slug: string;
  areaId: number;
};

export default function QuestionsInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedQuestion, setSelectedQuestion] = useState<UserQuestion | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    domain: "apologetics" as "apologetics" | "polemics",
    areaId: null as number | null,
    tagId: null as number | null,
    tldr: "",
    keyPoints: ["", "", ""],
    scriptureRefs: [""],
    bodyMarkdown: "",
    perspectives: [""],
    sources: [{ title: "", author: "", url: "" }],
  });

  // Fetch inbox questions from PRIVATE user_questions table
  const { data: questions = [], isLoading } = useQuery<UserQuestion[]>({
    queryKey: ["/api/questions/inbox"],
    queryFn: async () => {
      const res = await fetch("/api/questions/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox questions");
      return res.json();
    },
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

  // Fetch tags
  const { data: tags = [] } = useQuery<QaTag[]>({
    queryKey: ["qa-tags", formData.areaId],
    queryFn: async () => {
      if (!formData.areaId) return [];
      const res = await fetch(`/api/qa-tags?areaId=${formData.areaId}`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    enabled: !!formData.areaId,
  });

  // Publish to library mutation - uses new endpoint
  const publishMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number; data: any }) => {
      const res = await fetch(`/api/library/questions/${questionId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to publish article");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Article Published!",
        description: "The question has been published to the Apologetics Library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/inbox"] });
      setSelectedQuestion(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish article",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      domain: "apologetics",
      areaId: null,
      tagId: null,
      tldr: "",
      keyPoints: ["", "", ""],
      scriptureRefs: [""],
      bodyMarkdown: "",
      perspectives: [""],
      sources: [{ title: "", author: "", url: "" }],
    });
  };

  const handleSelectQuestion = (question: UserQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      ...formData,
      title: question.questionText,
      domain: question.domain,
      areaId: question.areaId,
      tagId: question.tagId,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestion) {
      toast({ title: "No question selected", variant: "destructive" });
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.tldr.trim()) {
      toast({ title: "TL;DR is required", variant: "destructive" });
      return;
    }
    const validKeyPoints = formData.keyPoints.filter(kp => kp.trim());
    if (validKeyPoints.length < 3) {
      toast({ title: "At least 3 key points are required", variant: "destructive" });
      return;
    }
    if (!formData.bodyMarkdown.trim()) {
      toast({ title: "Detailed answer is required", variant: "destructive" });
      return;
    }

    // Prepare submission data
    const submitData = {
      title: formData.title.trim(),
      domain: formData.domain,
      areaId: formData.areaId,
      tagId: formData.tagId,
      tldr: formData.tldr.trim(),
      keyPoints: validKeyPoints,
      scriptureRefs: formData.scriptureRefs.filter(ref => ref.trim()),
      bodyMarkdown: formData.bodyMarkdown.trim(),
      perspectives: formData.perspectives.filter(p => p.trim()),
      sources: formData.sources.filter(s => s.title && s.url),
    };

    publishMutation.mutate({ questionId: selectedQuestion.id, data: submitData });
  };

  const addKeyPoint = () => setFormData({ ...formData, keyPoints: [...formData.keyPoints, ""] });
  const removeKeyPoint = (idx: number) => {
    const updated = formData.keyPoints.filter((_, i) => i !== idx);
    setFormData({ ...formData, keyPoints: updated });
  };

  const addScriptureRef = () => setFormData({ ...formData, scriptureRefs: [...formData.scriptureRefs, ""] });
  const removeScriptureRef = (idx: number) => {
    const updated = formData.scriptureRefs.filter((_, i) => i !== idx);
    setFormData({ ...formData, scriptureRefs: updated });
  };

  const addPerspective = () => setFormData({ ...formData, perspectives: [...formData.perspectives, ""] });
  const removePerspective = (idx: number) => {
    const updated = formData.perspectives.filter((_, i) => i !== idx);
    setFormData({ ...formData, perspectives: updated });
  };

  const addSource = () => setFormData({ ...formData, sources: [...formData.sources, { title: "", author: "", url: "" }] });
  const removeSource = (idx: number) => {
    const updated = formData.sources.filter((_, i) => i !== idx);
    setFormData({ ...formData, sources: updated });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Inbox className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Apologetics Inbox</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/apologetics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Library
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading inbox...</p>
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inbox Empty</h3>
              <p className="text-muted-foreground">
                No questions have been assigned to you yet.
              </p>
            </CardContent>
          </Card>
        ) : selectedQuestion ? (
          // ANSWER FORM
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Publish Answer to Library</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Original Question:</p>
                <p className="text-sm">{selectedQuestion.questionText}</p>
                {selectedQuestion.asker && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Asked by {selectedQuestion.asker.displayName || selectedQuestion.asker.username}
                  </p>
                )}
                {selectedQuestion.publishedPostId && (
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Published to Apologetics Library</span>
                    <Link href={`/apologetics/${selectedQuestion.publishedPostId}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Article
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Article Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g., 'How do we know the Bible is reliable?'"
                  />
                </div>

                {/* Domain */}
                <div>
                  <Label htmlFor="domain">Domain *</Label>
                  <Select
                    value={formData.domain}
                    onValueChange={(val) => setFormData({ ...formData, domain: val as "apologetics" | "polemics" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apologetics">Apologetics</SelectItem>
                      <SelectItem value="polemics">Polemics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Area */}
                <div>
                  <Label htmlFor="area">Area *</Label>
                  <Select
                    value={formData.areaId?.toString()}
                    onValueChange={(val) => setFormData({ ...formData, areaId: parseInt(val), tagId: null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tag */}
                {formData.areaId && (
                  <div>
                    <Label htmlFor="tag">Tag *</Label>
                    <Select
                      value={formData.tagId?.toString()}
                      onValueChange={(val) => setFormData({ ...formData, tagId: parseInt(val) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map(tag => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* TL;DR */}
                <div>
                  <Label htmlFor="tldr">TL;DR (Quick Answer) *</Label>
                  <Textarea
                    id="tldr"
                    value={formData.tldr}
                    onChange={(e) => setFormData({ ...formData, tldr: e.target.value })}
                    placeholder="One-sentence summary of the answer..."
                    rows={2}
                  />
                </div>

                {/* Key Points */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Key Points (3-5) *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addKeyPoint}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Point
                    </Button>
                  </div>
                  {formData.keyPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={point}
                        onChange={(e) => {
                          const updated = [...formData.keyPoints];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, keyPoints: updated });
                        }}
                        placeholder={`Key point ${idx + 1}...`}
                      />
                      {formData.keyPoints.length > 3 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeKeyPoint(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Scripture References */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Scripture References</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addScriptureRef}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Reference
                    </Button>
                  </div>
                  {formData.scriptureRefs.map((ref, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Input
                        value={ref}
                        onChange={(e) => {
                          const updated = [...formData.scriptureRefs];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, scriptureRefs: updated });
                        }}
                        placeholder="E.g., John 3:16"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeScriptureRef(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Detailed Answer (Markdown) */}
                <div>
                  <Label htmlFor="bodyMarkdown">Detailed Answer (Markdown) *</Label>
                  <Textarea
                    id="bodyMarkdown"
                    value={formData.bodyMarkdown}
                    onChange={(e) => setFormData({ ...formData, bodyMarkdown: e.target.value })}
                    placeholder="Provide a comprehensive answer using Markdown formatting..."
                    rows={12}
                  />
                </div>

                {/* Perspectives */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Perspectives (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPerspective}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Perspective
                    </Button>
                  </div>
                  {formData.perspectives.map((perspective, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
                      <Textarea
                        value={perspective}
                        onChange={(e) => {
                          const updated = [...formData.perspectives];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, perspectives: updated });
                        }}
                        placeholder="Additional perspective or viewpoint..."
                        rows={2}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePerspective(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Sources */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Sources (Optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSource}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Source
                    </Button>
                  </div>
                  {formData.sources.map((source, idx) => (
                    <Card key={idx} className="p-3 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Source {idx + 1}</Label>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSource(idx)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          value={source.title}
                          onChange={(e) => {
                            const updated = [...formData.sources];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, sources: updated });
                          }}
                          placeholder="Title"
                          className="text-sm"
                        />
                        <Input
                          value={source.author}
                          onChange={(e) => {
                            const updated = [...formData.sources];
                            updated[idx].author = e.target.value;
                            setFormData({ ...formData, sources: updated });
                          }}
                          placeholder="Author"
                          className="text-sm"
                        />
                        <Input
                          value={source.url}
                          onChange={(e) => {
                            const updated = [...formData.sources];
                            updated[idx].url = e.target.value;
                            setFormData({ ...formData, sources: updated });
                          }}
                          placeholder="URL"
                          className="text-sm"
                        />
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={publishMutation.isPending || !!selectedQuestion.publishedPostId}>
                    <Send className="mr-2 h-4 w-4" />
                    {publishMutation.isPending ? "Publishing..." : "Publish as Article"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedQuestion(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          // INBOX LIST
          <div className="grid gap-4">
            {questions.map((question) => (
              <Card key={question.id} className="hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{question.questionText}</h3>
                        {question.publishedPostId && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Published to Library
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {question.asker && (
                          <span>Asked by {question.asker.displayName || question.asker.username}</span>
                        )}
                        {question.area && <span>{question.area.name}</span>}
                        {question.tag && <span>• {question.tag.name}</span>}
                        <span>• {new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {question.publishedPostId ? (
                        <Link href={`/apologetics/${question.publishedPostId}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Article
                          </Button>
                        </Link>
                      ) : (
                        <Button onClick={() => handleSelectQuestion(question)}>
                          Answer Question
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
