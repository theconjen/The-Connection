import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { BookOpen, Video, Headphones, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { apiUrl } from "../../lib/env";

type ResourceType = "book" | "video" | "podcast";

type ResourceRecord = {
  id: number;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
};

export default function ApologeticsResourcesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "book" as ResourceType,
    url: "",
  });

  // Fetch resources from backend
  const { data: resources = [], isLoading } = useQuery<ResourceRecord[]>({
    queryKey: ["/api/admin/apologetics-resources"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/admin/apologetics-resources"));
      if (!res.ok) {
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
      return res.json();
    },
    retry: false,
  });

  // Add resource mutation
  const addMutation = useMutation({
    mutationFn: async (data: Omit<ResourceRecord, "id">) => {
      const res = await fetch(apiUrl("/api/admin/apologetics-resources"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add resource");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apologetics-resources"] });
      toast({ title: "Success", description: "Resource added successfully" });
      setForm({ title: "", description: "", type: "book", url: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete resource mutation
  const deleteMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const res = await fetch(apiUrl(`/api/admin/apologetics-resources/${resourceId}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete resource");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/apologetics-resources"] });
      toast({ title: "Success", description: "Resource deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const categorized = useMemo(() => {
    return {
      book: resources.filter((r) => r.type === "book"),
      video: resources.filter((r) => r.type === "video"),
      podcast: resources.filter((r) => r.type === "podcast"),
    };
  }, [resources]);

  const addResource = () => {
    if (!form.title || !form.description) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    addMutation.mutate({
      title: form.title,
      description: form.description,
      type: form.type,
      url: form.url || undefined,
    });
  };

  const renderIcon = (type: ResourceType) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "podcast":
        return <Headphones className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold">Apologetics Resources</h1>
          <p className="text-gray-500">Add curated books, videos, and podcasts for the public page.</p>
        </div>
        <Button onClick={addResource} className="gap-2" disabled={addMutation.isPending}>
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
          Save resource
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New resource</CardTitle>
          <CardDescription>Publish content that immediately shows up in the Apologetics page.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Link (optional)</label>
            <Input value={form.url} onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ResourceType }))}
              className="w-full border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="book">Book</option>
              <option value="video">Video</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What will visitors learn from this resource?"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({resources.length})</TabsTrigger>
            <TabsTrigger value="book">Books ({categorized.book.length})</TabsTrigger>
            <TabsTrigger value="video">Videos ({categorized.video.length})</TabsTrigger>
            <TabsTrigger value="podcast">Podcasts ({categorized.podcast.length})</TabsTrigger>
          </TabsList>

          {(["all", "book", "video", "podcast"] as ("all" | ResourceType)[]).map((tab) => {
            const list = tab === "all" ? resources : categorized[tab];
            return (
              <TabsContent key={tab} value={tab}>
                {list.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No {tab === "all" ? "resources" : `${tab}s`} yet. Add one above.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {list.map((resource) => (
                      <Card key={resource.id}>
                        <CardHeader className="flex flex-row items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{resource.title}</CardTitle>
                            <CardDescription className="capitalize">{resource.type}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="flex items-center gap-1 capitalize" variant="outline">
                              {renderIcon(resource.type)}
                              {resource.type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this resource?")) {
                                  deleteMutation.mutate(resource.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{resource.description}</p>
                          {resource.url && (
                            <a href={resource.url} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium">
                              View link
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </AdminLayout>
  );
}
