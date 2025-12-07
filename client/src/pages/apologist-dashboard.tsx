import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import MainLayout from "../components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ShieldQuestion, Send, CheckCircle, Clock3, UserCheck } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { apiUrl } from "../lib/env";

type AssignedQuestion = {
  id: number;
  title: string;
  topic: string;
  askedBy: string;
  delegatedBy: string;
  createdAt: string;
  status: "pending" | "answered" | "submitted";
  answer?: string;
};

const fallbackQuestions: AssignedQuestion[] = [
  {
    id: 1,
    title: "How do we reconcile faith and science when reading Genesis?",
    topic: "Science and Faith",
    askedBy: "Maria G.",
    delegatedBy: "Admin team",
    createdAt: "2024-11-18",
    status: "pending",
  },
  {
    id: 2,
    title: "What historical evidence supports the resurrection?",
    topic: "Resurrection",
    askedBy: "Daniel T.",
    delegatedBy: "Admin team",
    createdAt: "2024-11-15",
    status: "pending",
  },
];

export default function ApologistDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cachedQuestions = (queryClient.getQueryData<AssignedQuestion[]>(["/api/apologetics/questions"]) || fallbackQuestions) as AssignedQuestion[];
  const [assignedQuestions, setAssignedQuestions] = useState<AssignedQuestion[]>(cachedQuestions);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const pending = useMemo(() => assignedQuestions.filter((q) => q.status !== "answered"), [assignedQuestions]);
  const completed = useMemo(() => assignedQuestions.filter((q) => q.status === "answered"), [assignedQuestions]);

  const submitAnswer = async (questionId: number) => {
    const draft = drafts[questionId];
    if (!draft) return;

    // Attempt to call the API when available; fall back to instant local update
    try {
      await fetch(apiUrl("/api/apologetics/questions/answer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, answer: draft }),
      });
    } catch (err) {
      // ignore; local optimistic update below keeps UI responsive
    }

    const updated = assignedQuestions.map((q) =>
      q.id === questionId ? { ...q, status: "answered", answer: draft } : q,
    );

    setAssignedQuestions(updated);
    setDrafts((prev) => ({ ...prev, [questionId]: "" }));

    // Keep the public Q&A list in sync so answers show immediately
    queryClient.setQueryData<AssignedQuestion[]>(["/api/apologetics/questions"], (prev) => {
      const existing = prev || [];
      const withoutDuplicate = existing.filter((q) => q.id !== questionId);
      return [
        ...withoutDuplicate,
        {
          ...updated.find((q) => q.id === questionId)!,
          answerCount: 1,
        } as AssignedQuestion & { answerCount?: number },
      ];
    });
  };

  const updateDraft = (questionId: number, text: string) => {
    setDrafts((prev) => ({ ...prev, [questionId]: text }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Apologist Dashboard</h1>
            <p className="text-muted-foreground">Review delegated questions, craft answers, and publish them to Q&A.</p>
          </div>
          <Badge variant="outline" className="capitalize">
            {user?.isVerifiedApologeticsAnswerer ? "Verified apologist" : "Applicant"}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assigned questions</CardTitle>
            <CardDescription>Start with the most recent requests that need a trusted response.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">In progress ({pending.length})</TabsTrigger>
                <TabsTrigger value="completed">Published ({completed.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pending.map((question) => (
                  <Card key={question.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldQuestion className="h-4 w-4 text-primary" />
                          {question.title}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-2 items-center">
                          <Badge variant="outline">{question.topic}</Badge>
                          <span className="text-xs text-muted-foreground">Asked by {question.askedBy}</span>
                          <span className="text-xs text-muted-foreground">Delegated by {question.delegatedBy}</span>
                          <span className="text-xs text-muted-foreground">Received {question.createdAt}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" /> Pending
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        placeholder="Draft your response here..."
                        value={drafts[question.id] ?? question.answer ?? ""}
                        onChange={(e) => updateDraft(question.id, e.target.value)}
                        className="min-h-[140px]"
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">Your answer will appear in the Apologetics Q&A once submitted.</div>
                        <Button className="gap-2" onClick={() => submitAnswer(question.id)}>
                          <Send className="h-4 w-4" />
                          Submit answer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pending.length === 0 && <p className="text-sm text-muted-foreground">No pending questions right now.</p>}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {completed.map((question) => (
                  <Card key={question.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          {question.title}
                        </CardTitle>
                        <CardDescription className="flex gap-2 items-center">
                          <Badge variant="outline">{question.topic}</Badge>
                          <span className="text-xs text-muted-foreground">Published</span>
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1" variant="outline">
                        <CheckCircle className="h-3 w-3" /> Answered
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.answer}</p>
                    </CardContent>
                  </Card>
                ))}
                {completed.length === 0 && <p className="text-sm text-muted-foreground">No published answers yet.</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guidelines</CardTitle>
            <CardDescription>Keep answers pastoral, clear, and sourced.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3 text-sm text-muted-foreground">
            <div className="p-3 border rounded">Cite Scripture and scholars where helpful.</div>
            <div className="p-3 border rounded">Assume the reader is curious, not combative.</div>
            <div className="p-3 border rounded">Mark answers as submitted once you are confident.</div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
