import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { Save, ShieldCheck, Bell, Globe2, Loader2 } from "lucide-react";
import { apiUrl } from "../../lib/env";

type PlatformSettings = {
  onboarding: boolean;
  contentModeration: boolean;
  emailFrom: string;
  announcement: string;
  supportLink: string;
  dailyDigest: boolean;
  safetyAlerts: boolean;
  healthUpdates: boolean;
};

const defaultSettings: PlatformSettings = {
  onboarding: true,
  contentModeration: true,
  emailFrom: "support@theconnection.app",
  announcement: "",
  supportLink: "https://theconnection.app/support",
  dailyDigest: true,
  safetyAlerts: true,
  healthUpdates: false,
};

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);

  // Fetch settings from backend
  const { data: savedSettings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/admin/settings"));
      if (!res.ok) {
        // Return defaults if not found
        return defaultSettings;
      }
      return res.json();
    },
    retry: false,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, [savedSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (newSettings: PlatformSettings) => {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Success", description: "Settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-gray-500">Configure global defaults and safety controls.</p>
        </div>
        <Button onClick={handleSave} className="gap-2" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="mt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand & links</CardTitle>
              <CardDescription>Set support channels users will see.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email from address</Label>
                <Input
                  value={settings.emailFrom}
                  onChange={(e) => setSettings((prev) => ({ ...prev, emailFrom: e.target.value }))}
                />
              </div>
              <div>
                <Label>Support center URL</Label>
                <Input
                  value={settings.supportLink}
                  onChange={(e) => setSettings((prev) => ({ ...prev, supportLink: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Global announcement</Label>
                <Textarea
                  value={settings.announcement}
                  onChange={(e) => setSettings((prev) => ({ ...prev, announcement: e.target.value }))}
                  placeholder="Leave empty to hide announcement banner"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature toggles</CardTitle>
              <CardDescription>Turn on/off platform features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Community onboarding</div>
                  <div className="text-sm text-muted-foreground">Show guided tips for brand-new members.</div>
                </div>
                <Switch
                  checked={settings.onboarding}
                  onCheckedChange={(value) => setSettings((prev) => ({ ...prev, onboarding: value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation defaults</CardTitle>
              <CardDescription>Keep the community healthy by default.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Auto-hide flagged items</div>
                  <div className="text-sm text-muted-foreground">Hide content while moderators review reports.</div>
                </div>
                <Switch
                  checked={settings.contentModeration}
                  onCheckedChange={(value) => setSettings((prev) => ({ ...prev, contentModeration: value }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Geography restrictions</div>
                  <div className="text-sm text-muted-foreground">Honor local regulations for data residency.</div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Globe2 className="h-4 w-4" />
                  Coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email notifications</CardTitle>
              <CardDescription>Control what the platform sends automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Daily digest</div>
                  <div className="text-sm text-muted-foreground">Roundup of new content, events, and prayer requests.</div>
                </div>
                <Switch
                  checked={settings.dailyDigest}
                  onCheckedChange={(value) => setSettings((prev) => ({ ...prev, dailyDigest: value }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Safety alerts</div>
                  <div className="text-sm text-muted-foreground">Escalate urgent trust & safety issues to admins.</div>
                </div>
                <Switch
                  checked={settings.safetyAlerts}
                  onCheckedChange={(value) => setSettings((prev) => ({ ...prev, safetyAlerts: value }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Platform health updates</div>
                  <div className="text-sm text-muted-foreground">Weekly summary of uptime, outages, and maintenance.</div>
                </div>
                <Switch
                  checked={settings.healthUpdates}
                  onCheckedChange={(value) => setSettings((prev) => ({ ...prev, healthUpdates: value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Critical alerts</CardTitle>
              <CardDescription>Guarantee delivery for high-priority events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                SMS failover is enabled for outages.
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Bell className="h-4 w-4" />
                Admins will receive push and email for P1 incidents.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
