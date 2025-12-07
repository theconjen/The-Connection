import { useState } from "react";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { AlertCircle, KeyRound, UserPlus } from "lucide-react";

type AdminRecord = {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "moderator";
  lastActive: string;
  mfaEnabled: boolean;
};

const seedAdmins: AdminRecord[] = [
  {
    id: 1,
    name: "Olivia Brown",
    email: "olivia@theconnection.app",
    role: "superadmin",
    lastActive: "5 minutes ago",
    mfaEnabled: true,
  },
  {
    id: 2,
    name: "James Walker",
    email: "james@theconnection.app",
    role: "admin",
    lastActive: "1 hour ago",
    mfaEnabled: true,
  },
  {
    id: 3,
    name: "Linda Foster",
    email: "linda@theconnection.app",
    role: "moderator",
    lastActive: "Yesterday",
    mfaEnabled: false,
  },
];

export default function AdminUsersPage() {
  const [records, setRecords] = useState<AdminRecord[]>(seedAdmins);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "admin" as AdminRecord["role"],
  });

  const addAdmin = () => {
    if (!newAdmin.name || !newAdmin.email) return;
    setRecords((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        ...newAdmin,
        lastActive: "Just invited",
        mfaEnabled: false,
      },
    ]);
    setNewAdmin({ name: "", email: "", role: "admin" });
  };

  const toggleMfa = (id: number) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, mfaEnabled: !record.mfaEnabled } : record)));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-gray-500">Control privileged accounts and guardrails.</p>
        </div>
        <Button onClick={addAdmin} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite admin
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Superadmins</CardTitle>
            <CardDescription>Full platform control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.filter((r) => r.role === "superadmin").length}</div>
            <div className="text-sm text-muted-foreground">Consider two-person approval for risky actions.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <CardDescription>Most day-to-day controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.filter((r) => r.role === "admin").length}</div>
            <div className="text-sm text-muted-foreground">Access to moderation and settings.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Moderators</CardTitle>
            <CardDescription>Focused on safety</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.filter((r) => r.role === "moderator").length}</div>
            <div className="text-sm text-muted-foreground">Limited administrative rights.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a new admin</CardTitle>
          <CardDescription>Send secure, time-bound invitations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="Name"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin((prev) => ({ ...prev, email: e.target.value }))}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Role</label>
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin((prev) => ({ ...prev, role: e.target.value as AdminRecord["role"] }))}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground items-center">
            <AlertCircle className="h-4 w-4" />
            New invites require MFA on first login.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privileged directory</CardTitle>
          <CardDescription>Review MFA status, recent activity, and roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">MFA</th>
                  <th className="pb-2">Last active</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="py-3">
                      <div className="font-medium">{record.name}</div>
                      <div className="text-muted-foreground">{record.email}</div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">
                        {record.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={record.mfaEnabled} onCheckedChange={() => toggleMfa(record.id)} />
                        <span className="text-xs text-muted-foreground">Required</span>
                      </div>
                    </td>
                    <td className="py-3">{record.lastActive}</td>
                    <td className="py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <KeyRound className="h-4 w-4" />
                        Reset MFA
                      </Button>
                      <Button variant="destructive" size="sm">Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
