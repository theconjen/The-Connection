/**
 * Organization Settings - Edit org profile and visibility
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Church traditions with their denominations - matching mobile app
const CHURCH_TRADITIONS = [
  {
    id: 'protestant',
    label: 'Protestant',
    denominations: [
      'Evangelical', 'Non-Denominational', 'Bible Church',
      'Baptist', 'Southern Baptist', 'American Baptist', 'First Baptist',
      'African Methodist Episcopal',
      'Lutheran',
      'Presbyterian', 'PCA', 'Orthodox Presbyterian',
      'Anglican',
      'Reformed', 'Dutch Reformed',
      'Pentecostal', 'Assembly of God',
      'Church of God', 'Church of God in Christ',
      'Charismatic', 'Vineyard',
      'Nazarene', 'Wesleyan', 'Holiness',
      'Evangelical Free', 'Evangelical Covenant',
      'Christian & Missionary Alliance',
      'Congregational',
      'Mennonite', 'Brethren',
    ],
  },
  {
    id: 'catholic',
    label: 'Catholic',
    denominations: [
      'Roman Catholic', 'Catholic',
      'Byzantine Catholic', 'Ukrainian Catholic',
      'Maronite Catholic', 'Melkite Catholic',
      'Chaldean Catholic', 'Syro-Malabar',
    ],
  },
  {
    id: 'orthodox',
    label: 'Orthodox',
    denominations: [
      'Eastern Orthodox', 'Greek Orthodox', 'Russian Orthodox',
      'Serbian Orthodox', 'Romanian Orthodox', 'Bulgarian Orthodox',
      'Antiochian Orthodox', 'Orthodox Church in America',
      'Coptic Orthodox', 'Ethiopian Orthodox', 'Eritrean Orthodox',
      'Armenian Apostolic', 'Syriac Orthodox',
      'Assyrian Church of the East', 'Ancient Church of the East',
    ],
  },
];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Save, Trash2 } from "lucide-react";

const orgSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  denomination: z.string().max(100).optional(),
  mission: z.string().max(2000).optional(),
  serviceTimes: z.string().max(1000).optional(),
  congregationSize: z.coerce.number().min(0).optional(),
  showPhone: z.boolean().optional(),
  showAddress: z.boolean().optional(),
});

type OrgSettingsForm = z.infer<typeof orgSettingsSchema>;

interface Organization {
  id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  denomination?: string | null;
  mission?: string | null;
  serviceTimes?: string | null;
  congregationSize?: number | null;
  showPhone?: boolean;
  showAddress?: boolean;
}

interface OrgSettingsProps {
  organization: Organization;
  isLoading?: boolean;
  onSave: (data: Partial<OrgSettingsForm>) => Promise<void>;
  onDelete?: () => Promise<void>;
  isOwner?: boolean;
}

export function OrgSettings({ organization, isLoading, onSave, onDelete, isOwner }: OrgSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      toast({
        title: "Failed to delete organization",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const form = useForm<OrgSettingsForm>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      name: organization.name || "",
      description: organization.description || "",
      website: organization.website || "",
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      city: organization.city || "",
      state: organization.state || "",
      zipCode: organization.zipCode || "",
      denomination: organization.denomination || "",
      mission: organization.mission || "",
      serviceTimes: organization.serviceTimes || "",
      congregationSize: organization.congregationSize || undefined,
      showPhone: organization.showPhone || false,
      showAddress: organization.showAddress || false,
    },
  });

  const handleSubmit = async (data: OrgSettingsForm) => {
    setIsSaving(true);
    try {
      // Only send changed fields
      const changedFields: Partial<OrgSettingsForm> = {};
      const formValues = form.getValues();

      for (const key of Object.keys(data) as Array<keyof OrgSettingsForm>) {
        const currentValue = data[key];
        const originalValue = organization[key as keyof Organization];

        // Compare values, treating empty strings and null/undefined as equivalent
        const currentNormalized = currentValue === "" ? null : currentValue;
        const originalNormalized = originalValue === "" ? null : originalValue;

        if (currentNormalized !== originalNormalized) {
          (changedFields as any)[key] = currentValue === "" ? null : currentValue;
        }
      }

      if (Object.keys(changedFields).length === 0) {
        toast({ title: "No changes to save" });
        return;
      }

      await onSave(changedFields);
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your organization's public profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="First Baptist Church"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="A brief description of your organization..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="denomination">Denomination</Label>
            <Select
              value={form.watch("denomination") || ""}
              onValueChange={(value) => form.setValue("denomination", value)}
            >
              <SelectTrigger id="denomination">
                <SelectValue placeholder="Select your denomination" />
              </SelectTrigger>
              <SelectContent>
                {CHURCH_TRADITIONS.map((tradition) => (
                  <div key={tradition.id}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground bg-muted/50">
                      {tradition.label}
                    </div>
                    {tradition.denominations.map((denom) => (
                      <SelectItem key={denom} value={denom}>
                        {denom}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Mission Statement</Label>
            <Textarea
              id="mission"
              {...form.register("mission")}
              placeholder="Your organization's mission..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceTimes">Service Times</Label>
            <Textarea
              id="serviceTimes"
              {...form.register("serviceTimes")}
              placeholder="Sunday: 9am, 11am&#10;Wednesday: 7pm"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="congregationSize">Congregation Size</Label>
            <Input
              id="congregationSize"
              type="number"
              {...form.register("congregationSize")}
              placeholder="Approximate number of members"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How people can reach your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="contact@church.org"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...form.register("website")}
              placeholder="https://www.yourchurch.org"
            />
            {form.formState.errors.website && (
              <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} placeholder="Springfield" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...form.register("state")} placeholder="IL" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input id="zipCode" {...form.register("zipCode")} placeholder="62701" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control what information is visible to the public</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                Display your phone number on your public profile
              </p>
            </div>
            <Switch
              checked={form.watch("showPhone")}
              onCheckedChange={(checked) => form.setValue("showPhone", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Address</Label>
              <p className="text-sm text-muted-foreground">
                Display your address on your public profile
              </p>
            </div>
            <Switch
              checked={form.watch("showAddress")}
              onCheckedChange={(checked) => form.setValue("showAddress", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {isOwner && onDelete && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Delete Organization</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization and all its data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{organization.name}"? This action cannot be undone.
                      All members, leaders, sermons, and other data will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete Organization"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
