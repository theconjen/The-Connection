/**
 * Bookmarks Page
 *
 * Displays user's bookmarked posts.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/use-auth";

interface BookmarkedPost {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: {
    username: string;
    displayName?: string;
  };
}

export default function BookmarksPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/bookmarks");
        if (response.ok) {
          const data = await response.json();
          setBookmarks(data.bookmarks || data || []);
        }
      } catch (err) {
        console.error("Failed to fetch bookmarks:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookmarks();
  }, [user]);

  if (!user) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your bookmarks.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Your Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground mb-4">
              Save posts to read later by clicking the bookmark icon.
            </p>
            <Button variant="outline" onClick={() => navigate("/posts")}>
              Browse Posts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/posts/${bookmark.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{bookmark.title}</CardTitle>
                <CardDescription>
                  By {bookmark.author?.displayName || bookmark.author?.username || "Unknown"} &middot;{" "}
                  {new Date(bookmark.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2">
                  {bookmark.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
