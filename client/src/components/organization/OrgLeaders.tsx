/**
 * Organization Leaders - Leadership team management for Steward Console
 * Allows admins to add, edit, and remove leadership/staff profiles
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, User, GripVertical, Eye, EyeOff } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Leader {
  id: number;
  organizationId: number;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  isPublic: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface LeaderFormData {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  isPublic: boolean;
  sortOrder: number;
}

interface OrgLeadersProps {
  leaders: Leader[];
  isLoading?: boolean;
  onCreate: (data: LeaderFormData) => Promise<void>;
  onUpdate: (id: number, data: Partial<LeaderFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const emptyFormData: LeaderFormData = {
  name: "",
  title: "",
  bio: "",
  photoUrl: "",
  isPublic: true,
  sortOrder: 0,
};

export function OrgLeaders({
  leaders,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: OrgLeadersProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [deletingLeader, setDeletingLeader] = useState<Leader | null>(null);
  const [formData, setFormData] = useState<LeaderFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingLeader(null);
    setFormData({
      ...emptyFormData,
      sortOrder: leaders.length, // Set default sort order to end of list
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (leader: Leader) => {
    setEditingLeader(leader);
    setFormData({
      name: leader.name,
      title: leader.title || "",
      bio: leader.bio || "",
      photoUrl: leader.photoUrl || "",
      isPublic: leader.isPublic,
      sortOrder: leader.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLeader(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingLeader) {
        await onUpdate(editingLeader.id, formData);
        toast({ title: "Leader updated successfully" });
      } else {
        await onCreate(formData);
        toast({ title: "Leader added successfully" });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: editingLeader ? "Failed to update leader" : "Failed to add leader",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLeader) return;

    setIsSubmitting(true);
    try {
      await onDelete(deletingLeader.id);
      toast({ title: "Leader removed successfully" });
      setDeletingLeader(null);
    } catch (error) {
      toast({
        title: "Failed to remove leader",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleVisibility = async (leader: Leader) => {
    try {
      await onUpdate(leader.id, { isPublic: !leader.isPublic });
      toast({
        title: leader.isPublic ? "Leader hidden from public" : "Leader now visible",
      });
    } catch (error) {
      toast({
        title: "Failed to update visibility",
        variant: "destructive",
      });
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
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
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
            <CardTitle>Leadership Team</CardTitle>
            <CardDescription>
              Manage the pastors and staff shown on your church profile
            </CardDescription>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Leader
          </Button>
        </CardHeader>
        <CardContent>
          {leaders.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No leadership team members added yet
              </p>
              <Button variant="outline" onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Leader
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {leaders
                .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
                .map((leader) => (
                  <div
                    key={leader.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={leader.photoUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(leader.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{leader.name}</p>
                        {!leader.isPublic && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      {leader.title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {leader.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(leader)}
                        title={leader.isPublic ? "Hide from public" : "Show on public profile"}
                      >
                        {leader.isPublic ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(leader)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingLeader(leader)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLeader ? "Edit Leader" : "Add Leader"}
            </DialogTitle>
            <DialogDescription>
              {editingLeader
                ? "Update the leader's information"
                : "Add a new member to your leadership team"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Pastor John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Senior Pastor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief biography or description..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photoUrl">Photo URL</Label>
                <Input
                  id="photoUrl"
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Display Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Visible on Public Profile</Label>
                  <p className="text-xs text-muted-foreground">
                    Show this leader on your church's public page
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingLeader ? "Save Changes" : "Add Leader"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLeader} onOpenChange={() => setDeletingLeader(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Leader</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingLeader?.name} from your leadership team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
