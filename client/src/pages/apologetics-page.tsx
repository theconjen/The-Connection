/**
 * Apologetics Page - GotQuestions UX
 * GOAL: User gets a reliable answer in under 60 seconds
 *
 * Features:
 * - Debounced search
 * - Domain toggle: Apologetics | Polemics
 * - Area/Tag filtering
 * - Suggested searches
 * - Library post cards with TL;DR
 * - Inbox access for apologists
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import MainLayout from "../components/layouts/main-layout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Users,
  Mail,
  Inbox
} from "lucide-react";
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

type LibraryPostListItem = {
  id: number;
  domain: Domain;
  title: string;
  tldr: string | null;
  perspectives: string[];
  authorDisplayName: string;
  publishedAt: string | null;
  area?: { id: number; name: string; slug: string };
  tag?: { id: number; name: string; slug: string };
};

// Suggested searches for GotQuestions UX
const SUGGESTED_SEARCHES = {
  apologetics: [
    "Evidence for the Resurrection",
    "Historical reliability of the Bible",
    "Problem of evil",
    "Is faith rational?",
    "Did Jesus claim to be God?",
    "Trinity explained",
    "Science and Christianity",
    "Prophecies fulfilled by Jesus",
  ],
  polemics: [
    "Problem of evil",
    "Moral relativism",
    "Biblical contradictions",
    "Old Testament genocide",
    "Hell and justice",
    "Exclusivity of Christianity",
    "Evolution and creation",
    "Religious pluralism",
  ],
};

export default function ApologeticsPage() {
  const { user } = useAuth();
  const [domain, setDomain] = useState<Domain>("apologetics");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Fetch /api/me to check capabilities
  const { data: meData } = useQuery<{
    user: any;
    permissions: string[];
    capabilities: {
      inboxAccess: boolean;
      canAuthorApologeticsPosts: boolean;
    };
  }>({
    queryKey: ['/api/me'],
    enabled: !!user,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch areas
  const { data: areas = [], isLoading: areasLoading } = useQuery<QaArea[]>({
    queryKey: ["qa-areas", domain],
    queryFn: async () => {
      const res = await fetch(`/api/qa-areas?domain=${domain}`);
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    },
  });

  // Fetch tags for selected area
  const { data: tags = [], isLoading: tagsLoading } = useQuery<QaTag[]>({
    queryKey: ["qa-tags", selectedAreaId],
    queryFn: async () => {
      if (!selectedAreaId) return [];
      const res = await fetch(`/api/qa-tags?areaId=${selectedAreaId}`);
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    enabled: !!selectedAreaId,
  });

  // Fetch library posts
  const { data: postsData, isLoading: postsLoading } = useQuery<{
    posts: LibraryPostListItem[];
    total: number;
  }>({
    queryKey: ["library-posts", domain, debouncedQuery, selectedAreaId, selectedTagId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("domain", domain);
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (selectedAreaId) params.set("areaId", selectedAreaId.toString());
      if (selectedTagId) params.set("tagId", selectedTagId.toString());
      params.set("status", "published");
      params.set("limit", "50");

      const res = await fetch(`/api/library/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const posts = postsData?.posts || [];
  const hasInboxAccess = meData?.capabilities?.inboxAccess || false;

  function onSelectDomain(next: Domain) {
    setDomain(next);
    setSelectedAreaId(null);
    setSelectedTagId(null);
  }

  function onSelectArea(areaId: number) {
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
    setSelectedTagId(null);
  }

  function onSelectTag(tagId: number) {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }

  const showSuggestedSearches = !query.trim() && posts.length === 0 && !postsLoading;
  const suggestedSearches = SUGGESTED_SEARCHES[domain];

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              Apologetics Library
            </h1>
            <p className="text-lg text-blue-800 dark:text-blue-200 mb-6">
              Reliable answers to your faith questions in under 60 seconds
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 italic border-l-4 border-blue-500 pl-4 py-2">
              "Always be prepared to give an answer to everyone who asks you to give the reason for the hope that you have." — 1 Peter 3:15
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inbox Access Button (for apologists) */}
        {hasInboxAccess && (
          <div className="mb-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/questions/inbox">
                <Inbox className="mr-2 h-4 w-4" />
                Apologetics Inbox
              </Link>
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search questions, topics, or Scripture passages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Domain Toggle */}
        <Tabs value={domain} onValueChange={(v) => onSelectDomain(v as Domain)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="apologetics">Apologetics</TabsTrigger>
            <TabsTrigger value="polemics">Polemics</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Area Chips */}
        {areas.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <Badge
                  key={area.id}
                  variant={selectedAreaId === area.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onSelectArea(area.id)}
                >
                  {area.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tag Chips (conditional on area) */}
        {selectedAreaId && tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTagId === tag.id ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => onSelectTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Searches */}
        {showSuggestedSearches && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Suggested Searches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {suggestedSearches.map((term, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-1/4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/apologetics/${post.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Breadcrumb */}
                    {(post.area || post.tag) && (
                      <div className="text-sm text-muted-foreground mb-4">
                        {post.area?.name}
                        {post.tag && ` • ${post.tag.name}`}
                      </div>
                    )}

                    {/* TL;DR */}
                    {post.tldr && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            Quick Answer
                          </span>
                        </div>
                        <p className="text-base text-foreground mb-4 line-clamp-3">
                          {post.tldr}
                        </p>
                      </>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span>Verified Sources</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {post.authorDisplayName}
                      </div>
                    </div>

                    {/* Perspectives badge */}
                    {post.perspectives.length > 1 && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{post.perspectives.length} perspectives included</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : !showSuggestedSearches ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords, or explore our suggested searches above.
              </p>
              <Button asChild>
                <Link href="/questions/ask">
                  <Mail className="mr-2 h-4 w-4" />
                  Ask the Connection Research Team
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* CTA Footer */}
        {posts.length > 0 && (
          <Card className="mt-8 border-2 border-primary">
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
        )}
      </div>
    </MainLayout>
  );
}
