/**
 * Organization Sermons - Sermon management for Steward Console
 * Allows admins to upload, edit, and manage sermon videos via Mux
 */

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Users,
  Link2,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Sermon {
  id: number;
  title: string;
  description?: string | null;
  speaker?: string | null;
  sermonDate?: string | null;
  series?: string | null;
  status: "pending" | "processing" | "ready" | "error";
  privacyLevel: "public" | "members" | "unlisted";
  duration?: number | null;
  thumbnailUrl?: string | null;
  createdAt?: string;
}

interface SermonFormData {
  title: string;
  description: string;
  speaker: string;
  sermonDate: string;
  series: string;
  privacyLevel: "public" | "members" | "unlisted";
}

interface OrgSermonsProps {
  orgId: number;
  sermons: Sermon[];
  isLoading?: boolean;
  canUpload?: boolean;
  uploadLimit?: number;
  onCreate: (data: SermonFormData) => Promise<{ id: number }>;
  onGetUploadUrl: (sermonId: number) => Promise<{ uploadUrl: string }>;
  onUpdate: (id: number, data: Partial<SermonFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRefreshStatus?: (sermonId: number) => Promise<void>;
}

const emptyFormData: SermonFormData = {
  title: "",
  description: "",
  speaker: "",
  sermonDate: "",
  series: "",
  privacyLevel: "public",
};

const statusConfig = {
  pending: { label: "Pending Upload", icon: Clock, color: "bg-yellow-500" },
  processing: { label: "Processing", icon: Loader2, color: "bg-blue-500" },
  ready: { label: "Ready", icon: CheckCircle2, color: "bg-green-500" },
  error: { label: "Error", icon: AlertCircle, color: "bg-red-500" },
};

const privacyConfig = {
  public: { label: "Public", icon: Eye, description: "Anyone can view" },
  members: { label: "Members Only", icon: Users, description: "Only org members can view" },
  unlisted: { label: "Unlisted", icon: Link2, description: "Only accessible via direct link" },
};

export function OrgSermons({
  orgId,
  sermons,
  isLoading,
  canUpload = true,
  uploadLimit = 10,
  onCreate,
  onGetUploadUrl,
  onUpdate,
  onDelete,
  onRefreshStatus,
}: OrgSermonsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null);
  const [deletingSermon, setDeletingSermon] = useState<Sermon | null>(null);
  const [formData, setFormData] = useState<SermonFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload state
  const [uploadingSermonId, setUploadingSermonId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readyCount = sermons.filter(s => s.status === "ready").length;
  const canUploadMore = canUpload && readyCount < uploadLimit;

  const handleOpenCreate = () => {
    setEditingSermon(null);
    setFormData(emptyFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sermon: Sermon) => {
    setEditingSermon(sermon);
    setFormData({
      title: sermon.title,
      description: sermon.description || "",
      speaker: sermon.speaker || "",
      sermonDate: sermon.sermonDate || "",
      series: sermon.series || "",
      privacyLevel: sermon.privacyLevel,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSermon(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSermon) {
        await onUpdate(editingSermon.id, formData);
        toast({ title: "Sermon updated successfully" });
      } else {
        const result = await onCreate(formData);
        toast({ title: "Sermon created. Now upload the video file." });
        // Open file picker for the newly created sermon
        setUploadingSermonId(result.id);
        setTimeout(() => fileInputRef.current?.click(), 100);
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: editingSermon ? "Failed to update sermon" : "Failed to create sermon",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSermon) return;

    setIsSubmitting(true);
    try {
      await onDelete(deletingSermon.id);
      toast({ title: "Sermon deleted successfully" });
      setDeletingSermon(null);
    } catch (error) {
      toast({
        title: "Failed to delete sermon",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadClick = (sermon: Sermon) => {
    setUploadingSermonId(sermon.id);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingSermonId) return;

    // Reset input for next use
    e.target.value = "";

    try {
      // Get upload URL from backend
      const { uploadUrl } = await onGetUploadUrl(uploadingSermonId);

      // Upload file directly to Mux
      setUploadProgress(0);
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({ title: "Upload complete! Video is now processing." });
          setUploadingSermonId(null);
          setUploadProgress(0);
          // Refresh sermon status
          if (onRefreshStatus) {
            onRefreshStatus(uploadingSermonId);
          }
        } else {
          throw new Error("Upload failed");
        }
      });

      xhr.addEventListener("error", () => {
        toast({ title: "Upload failed", variant: "destructive" });
        setUploadingSermonId(null);
        setUploadProgress(0);
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    } catch (error) {
      toast({
        title: "Failed to start upload",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setUploadingSermonId(null);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-28 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sermon Library</CardTitle>
            <CardDescription>
              Manage your sermon videos ({readyCount}/{uploadLimit} videos used)
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate} disabled={!canUploadMore}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sermon
          </Button>
        </CardHeader>
        <CardContent>
          {!canUploadMore && (
            <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
              <p className="text-muted-foreground">
                You've reached your sermon limit ({uploadLimit} videos). Contact support for more capacity.
              </p>
            </div>
          )}

          {sermons.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No sermons uploaded yet
              </p>
              {canUploadMore && (
                <Button variant="outline" onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Sermon
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sermons.map((sermon) => {
                const StatusIcon = statusConfig[sermon.status].icon;
                const isUploading = uploadingSermonId === sermon.id;

                return (
                  <div
                    key={sermon.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {sermon.thumbnailUrl ? (
                        <img
                          src={sermon.thumbnailUrl}
                          alt={sermon.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {sermon.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                          {formatDuration(sermon.duration)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{sermon.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusConfig[sermon.status].color} bg-opacity-10`}
                        >
                          <StatusIcon className={`h-3 w-3 mr-1 ${sermon.status === 'processing' ? 'animate-spin' : ''}`} />
                          {statusConfig[sermon.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {sermon.speaker && <span>{sermon.speaker}</span>}
                        {sermon.speaker && sermon.sermonDate && <span>•</span>}
                        {sermon.sermonDate && <span>{sermon.sermonDate}</span>}
                      </div>
                      {isUploading && uploadProgress > 0 && (
                        <div className="mt-2">
                          <Progress value={uploadProgress} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Uploading: {uploadProgress}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {sermon.status === "pending" && !isUploading && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUploadClick(sermon)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Video
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(sermon)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSermon(sermon)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSermon ? "Edit Sermon" : "Add Sermon"}
            </DialogTitle>
            <DialogDescription>
              {editingSermon
                ? "Update the sermon details"
                : "Enter sermon details, then upload the video file"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Sunday Morning Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speaker">Speaker</Label>
                <Input
                  id="speaker"
                  value={formData.speaker}
                  onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                  placeholder="Pastor John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sermonDate">Date</Label>
                  <Input
                    id="sermonDate"
                    type="date"
                    value={formData.sermonDate}
                    onChange={(e) => setFormData({ ...formData, sermonDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="series">Series</Label>
                  <Input
                    id="series"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    placeholder="Faith Series"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the sermon..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacyLevel">Visibility</Label>
                <Select
                  value={formData.privacyLevel}
                  onValueChange={(value: "public" | "members" | "unlisted") =>
                    setFormData({ ...formData, privacyLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(privacyConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {privacyConfig[formData.privacyLevel].description}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingSermon ? "Save Changes" : "Create & Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSermon} onOpenChange={() => setDeletingSermon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sermon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSermon?.title}"?
              This will permanently remove the video and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
