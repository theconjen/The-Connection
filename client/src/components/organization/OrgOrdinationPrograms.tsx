/**
 * Organization Ordination Programs - Manage ordination programs (Partner tier)
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Loader2, Lock } from "lucide-react";

const programSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  enabled: z.boolean().default(true),
});

type ProgramForm = z.infer<typeof programSchema>;

interface OrdinationProgram {
  id: number;
  title: string;
  description?: string | null;
  enabled: boolean;
  createdAt: string;
}

interface OrgOrdinationProgramsProps {
  programs: OrdinationProgram[];
  hasFeature: boolean;
  isLoading?: boolean;
  onCreate: (data: ProgramForm) => Promise<void>;
}

export function OrgOrdinationPrograms({
  programs,
  hasFeature,
  isLoading,
  onCreate,
}: OrgOrdinationProgramsProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      title: "",
      description: "",
      enabled: true,
    },
  });

  const handleCreate = async (data: ProgramForm) => {
    setIsCreating(true);
    try {
      await onCreate(data);
      toast({ title: "Program created successfully" });
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Failed to create program",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!hasFeature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Ordination Programs
          </CardTitle>
          <CardDescription>
            Create and manage ordination programs for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Partner Plan Required</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ordination programs are available on the Partner plan. Upgrade to create
              custom ordination programs with application forms.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ordination Programs</CardTitle>
            <CardDescription>
              Create and manage ordination programs for your organization
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Program
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={form.handleSubmit(handleCreate)}>
                <DialogHeader>
                  <DialogTitle>Create Ordination Program</DialogTitle>
                  <DialogDescription>
                    Create a new ordination program. You can add form fields after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Program Title *</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="e.g., Elder Ordination Program"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Describe this ordination program..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new applications to this program
                      </p>
                    </div>
                    <Switch
                      checked={form.watch("enabled")}
                      onCheckedChange={(checked) => form.setValue("enabled", checked)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Program"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {programs.map((program) => (
            <div
              key={program.id}
              className="flex items-start justify-between gap-4 p-4 rounded-lg border"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{program.title}</h4>
                    <Badge variant={program.enabled ? "default" : "secondary"}>
                      {program.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  {program.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {program.description}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No ordination programs yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first program to start accepting applications.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
