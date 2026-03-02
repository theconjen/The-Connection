/**
 * Question Detail Page
 *
 * Displays a specific apologetics question and its answers.
 */

import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { HelpCircle, Loader2, User, Clock, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import AppShellPage from "../components/app-shell-page";
import { JsonLd } from "../components/seo/json-ld";

interface Question {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  status?: string;
  category?: string;
  user?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  answers?: Answer[];
  answerCount?: number;
}

interface Answer {
  id: number;
  content: string;
  createdAt: string;
  isAccepted?: boolean;
  upvotes?: number;
  user?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    role?: string;
  };
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const response = await fetch(`/api/apologetics/questions/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Question not found");
          } else {
            setError("Failed to load question");
          }
          return;
        }
        const data = await response.json();
        setQuestion(data);
      } catch (err) {
        setError("Failed to load question");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchQuestion();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <AppShellPage
        title="Question"
        description={error || "This question could not be found."}
        deepLinkPath={`questions/${id}`}
        icon={<HelpCircle className="h-8 w-8 text-primary" />}
      />
    );
  }

  const acceptedAnswer = question.answers?.find((a) => a.isAccepted);
  const suggestedAnswers = question.answers?.filter((a) => !a.isAccepted) || [];

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "QAPage",
          mainEntity: {
            "@type": "Question",
            name: question.title,
            text: question.content,
            dateCreated: question.createdAt,
            author: {
              "@type": "Person",
              name: question.user?.displayName || question.user?.username || "Anonymous",
            },
            answerCount: question.answers?.length || 0,
            ...(acceptedAnswer && {
              acceptedAnswer: {
                "@type": "Answer",
                text: acceptedAnswer.content,
                dateCreated: acceptedAnswer.createdAt,
                upvoteCount: acceptedAnswer.upvotes || 0,
                author: {
                  "@type": "Person",
                  name: acceptedAnswer.user?.displayName || acceptedAnswer.user?.username || "Anonymous",
                },
              },
            }),
            ...(suggestedAnswers.length > 0 && {
              suggestedAnswer: suggestedAnswers.map((a) => ({
                "@type": "Answer",
                text: a.content,
                dateCreated: a.createdAt,
                upvoteCount: a.upvotes || 0,
                author: {
                  "@type": "Person",
                  name: a.user?.displayName || a.user?.username || "Anonymous",
                },
              })),
            }),
          },
        }}
      />
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/questions/inbox")}
      >
        &larr; Back to Questions
      </Button>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {question.category && (
                <Badge variant="secondary" className="mb-2">
                  {question.category}
                </Badge>
              )}
              <CardTitle className="text-xl">{question.title}</CardTitle>
            </div>
            {question.status && (
              <Badge
                variant={question.status === "answered" ? "default" : "outline"}
              >
                {question.status}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={question.user?.avatarUrl} />
              <AvatarFallback>
                {question.user?.displayName?.[0] ||
                  question.user?.username?.[0] ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <span className="font-medium">
                {question.user?.displayName || question.user?.username || "Anonymous"}
              </span>
              <span className="text-muted-foreground ml-2">
                {new Date(question.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{question.content}</p>
        </CardContent>
      </Card>

      {/* Answers Section */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {question.answerCount || question.answers?.length || 0} Answers
        </h2>
      </div>

      {question.answers && question.answers.length > 0 ? (
        <div className="space-y-4">
          {question.answers.map((answer) => (
            <Card
              key={answer.id}
              className={answer.isAccepted ? "border-green-500 border-2" : ""}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={answer.user?.avatarUrl} />
                    <AvatarFallback>
                      {answer.user?.displayName?.[0] ||
                        answer.user?.username?.[0] ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {answer.user?.displayName || answer.user?.username}
                      </span>
                      {answer.user?.role === "expert" && (
                        <Badge variant="secondary" className="text-xs">
                          Expert
                        </Badge>
                      )}
                      {answer.isAccepted && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Accepted
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(answer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">
                      {answer.content}
                    </p>
                    {answer.upvotes !== undefined && (
                      <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        {answer.upvotes}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No answers yet. Be the first to answer!
          </CardContent>
        </Card>
      )}

      {/* CTA for mobile app */}
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="py-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want to submit an answer? Get the full experience in the app.
          </p>
          <Button
            onClick={() => {
              window.location.href = `theconnection://questions/${id}`;
            }}
          >
            Open in App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
