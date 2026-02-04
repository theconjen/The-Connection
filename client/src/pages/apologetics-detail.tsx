/**
 * Apologetics Library Post Detail Page - GotQuestions UX
 * GOAL: User gets a reliable answer in under 60 seconds
 *
 * Structured content order:
 * 1. TL;DR (quick answer at top)
 * 2. Key Points (3-5 bullets)
 * 3. Scripture References (if any)
 * 4. Detailed Answer (full bodyMarkdown)
 * 5. Perspectives (collapsible)
 * 6. Sources (collapsible)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  ArrowLeft,
  Zap,
  List,
  BookOpen,
  FileText,
  Users,
  Library,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Mail,
  CheckCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../hooks/use-auth";
import { Edit } from "lucide-react";

type LibraryPostSource = {
  author: string;
  title: string;
  publisher?: string;
  year?: number;
  url?: string;
};

type LibraryPost = {
  id: number;
  domain: "apologetics" | "polemics";
  title: string;
  tldr: string | null;
  keyPoints: string[];
  scriptureRefs: string[];
  bodyMarkdown: string;
  perspectives: string[];
  sources: LibraryPostSource[];
  authorUserId: number;
  authorDisplayName: string;
  area?: { id: number; name: string };
  tag?: { id: number; name: string };
};

export default function ApologeticsDetail() {
  const params = useParams();
  const postId = params.id;
  const { user } = useAuth();

  const [perspectivesOpen, setPerspectivesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const { data: post, isLoading, error } = useQuery<LibraryPost>({
    queryKey: ["library-post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/library/posts/${postId}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Article not found</h2>
              <p className="text-muted-foreground mb-6">
                This article may have been removed or doesn't exist.
              </p>
              <Button asChild>
                <Link href="/apologetics">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Apologetics
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button + Edit */}
        <div className="flex items-center justify-between mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/apologetics">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apologetics
            </Link>
          </Button>
          {(user?.role === 'admin' ||
            ((user?.isVerifiedApologeticsAnswerer || user?.id === 19) &&
              post?.authorUserId === user?.id)) && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/library/create?id=${post.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>

        {/* Breadcrumb */}
        {(post.area || post.tag) && (
          <div className="text-sm text-muted-foreground mb-6">
            {post.area?.name}
            {post.tag && ` • ${post.tag.name}`}
          </div>
        )}

        {/* Title Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">{post.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{post.authorDisplayName}</span>
            </div>
          </CardContent>
        </Card>

        {/* 1. TL;DR (Quick Answer) */}
        {post.tldr && (
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Quick Answer</h2>
              </div>
              <p className="text-base leading-relaxed">{post.tldr}</p>
            </CardContent>
          </Card>
        )}

        {/* 2. Key Points */}
        {post.keyPoints && post.keyPoints.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <List className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Key Points</h2>
              </div>
              <div className="space-y-4">
                {post.keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-base leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Scripture References */}
        {post.scriptureRefs && post.scriptureRefs.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Scripture References</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.scriptureRefs.map((ref, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Detailed Answer */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Detailed Answer</h2>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* 5. Perspectives (Collapsible) */}
        {post.perspectives && post.perspectives.length > 0 && (
          <Card className="mb-6">
            <Collapsible open={perspectivesOpen} onOpenChange={setPerspectivesOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <CardContent className="p-6 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-bold">
                        Perspectives ({post.perspectives.length})
                      </h2>
                    </div>
                    {perspectivesOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-3 border-t">
                  {post.perspectives.map((perspective, idx) => (
                    <div key={idx} className="flex items-start gap-3 pt-3">
                      <CheckCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{perspective}</p>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* 6. Sources (Collapsible) */}
        {post.sources && post.sources.length > 0 && (
          <Card className="mb-6">
            <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <CardContent className="p-6 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Library className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-bold">Sources ({post.sources.length})</h2>
                    </div>
                    {sourcesOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardContent>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 pt-0 space-y-4 border-t">
                  {post.sources.map((source, idx) => (
                    <div key={idx} className="flex items-start gap-3 pt-4">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{source.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.author}
                          {source.year && ` (${source.year})`}
                          {source.publisher && ` • ${source.publisher}`}
                        </p>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                          >
                            {source.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* CTA Footer */}
        <Card className="border-2 border-primary">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Have a question?</h3>
            <p className="text-muted-foreground mb-6">
              Submit your apologetics question and get answers from the Connection Research Team.
            </p>
            <Button asChild size="lg">
              <Link href="/questions/ask">
                <Mail className="mr-2 h-5 w-5" />
                Ask the Connection Research Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
