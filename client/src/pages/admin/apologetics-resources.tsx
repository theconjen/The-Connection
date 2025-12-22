import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { BookOpen, Video, Headphones, PlusCircle } from "lucide-react";

type ResourceType = "book" | "video" | "podcast";

type ResourceRecord = {
  id: number | string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
};

const fallbackResources: ResourceRecord[] = [
  {
    id: 1,
    title: "The Case for Christ",
    description: "Investigative journalist explores the evidence for Jesus.",
    type: "book",
    url: "https://example.com/case-for-christ",
  },
  {
    id: 2,
    title: "Defending the Faith livestream",
    description: "Weekly Q&A with pastors and apologists.",
    type: "video",
    url: "https://example.com/livestream",
  },
  {
    id: 3,
    title: "Apologetics on the go",
    description: "Short podcast episodes answering tough questions.",
    type: "podcast",
    url: "https://example.com/podcast",
  },
];

export default function ApologeticsResourcesPage() {
  const queryClient = useQueryClient();
  const existingResources = (queryClient.getQueryData(["/api/apologetics"]) || fallbackResources) as ResourceRecord[];
  const [resources, setResources] = useState<ResourceRecord[]>(existingResources);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "book" as ResourceType,
    url: "",
  });

  const categorized = useMemo(() => {
    return {
      book: resources.filter((r) => r.type === "book"),
      video: resources.filter((r) => r.type === "video"),
      podcast: resources.filter((r) => r.type === "podcast"),
    };
  }, [resources]);

  const addResource = () => {
    if (!form.title || !form.description) return;

    const next: ResourceRecord = {
      id: resources.length + 1,
      ...form,
    };

    setResources((prev) => [...prev, next]);
    queryClient.setQueryData(["/api/apologetics"], (prev: any) => [
      ...(prev || []),
      next,
    ]);
    setForm({ title: "", description: "", type: "book", url: "" });
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
        <Button onClick={addResource} className="gap-2">
          <PlusCircle className="h-4 w-4" />
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
              className="border rounded px-3 py-2 text-sm"
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

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="book">Books</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="podcast">Podcasts</TabsTrigger>
        </TabsList>

        {(["all", "book", "video", "podcast"] as ("all" | ResourceType)[]).map((tab) => {
          const list = tab === "all" ? resources : categorized[tab];
          return (
            <TabsContent key={tab} value={tab}>
              <div className="grid md:grid-cols-2 gap-4">
                {list.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{resource.title}</CardTitle>
                        <CardDescription className="capitalize">{resource.type}</CardDescription>
                      </div>
                      <Badge className="flex items-center gap-1 capitalize" variant="outline">
                        {renderIcon(resource.type)}
                        {resource.type}
                      </Badge>
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
            </TabsContent>
          );
        })}
      </Tabs>
    </AdminLayout>
  );
}
