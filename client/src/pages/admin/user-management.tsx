import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Users, ShieldCheck, Filter, Ban } from "lucide-react";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: "member" | "moderator" | "apologist" | "admin";
  status: "active" | "suspended";
  joined: string;
  flaggedContent?: number;
};

const seedUsers: UserRecord[] = [
  {
    id: 1,
    name: "Sarah Martinez",
    email: "sarah@example.com",
    role: "member",
    status: "active",
    joined: "2024-10-02",
    flaggedContent: 0,
  },
  {
    id: 2,
    name: "David Kim",
    email: "david@example.com",
    role: "moderator",
    status: "active",
    joined: "2024-08-14",
    flaggedContent: 1,
  },
  {
    id: 3,
    name: "Leah Thompson",
    email: "leah@example.com",
    role: "apologist",
    status: "active",
    joined: "2024-05-03",
    flaggedContent: 0,
  },
  {
    id: 4,
    name: "Michael Chen",
    email: "michael@example.com",
    role: "member",
    status: "suspended",
    joined: "2023-12-11",
    flaggedContent: 3,
  },
];

export default function UserManagementPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<UserRecord[]>(seedUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = records.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(search.toLowerCase()) ||
      record.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : record.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleSuspension = (id: number) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id
          ? {
              ...record,
              status: record.status === "active" ? "suspended" : "active",
            }
          : record,
      ),
    );
  };

  const promoteToModerator = (id: number) => {
    setRecords((prev) => prev.map((record) => (record.id === id ? { ...record, role: "moderator" } : record)));
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500">Find, review, and act on any user profile.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Signed in as {user?.email}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>All registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.length}</div>
            <div className="text-sm text-muted-foreground">Across roles and statuses</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Currently in good standing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.filter((r) => r.status === "active").length}</div>
            <div className="text-sm text-muted-foreground">Community participants</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suspended</CardTitle>
            <CardDescription>Restricted until reviewed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{records.filter((r) => r.status === "suspended").length}</div>
            <div className="text-sm text-muted-foreground">Pending reinstatement</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Directory</CardTitle>
            <CardDescription>Search users, review flags, and adjust access.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="apologist">Apologist</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <Input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Flags</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((record) => (
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
                      <Badge className={record.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3">{record.flaggedContent ?? 0}</td>
                    <td className="py-3">{record.joined}</td>
                    <td className="py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => promoteToModerator(record.id)}>
                        Promote
                      </Button>
                      <Button
                        variant={record.status === "active" ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => toggleSuspension(record.id)}
                        className="gap-2"
                      >
                        {record.status === "active" ? <Ban className="h-4 w-4" /> : null}
                        {record.status === "active" ? "Suspend" : "Reinstate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="reviews" className="mt-4">
        <TabsList>
          <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
          <TabsTrigger value="flags">Flagged Content</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Pending identity verifications</CardTitle>
              <CardDescription>Approve trusted voices before they go live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded border">
                <div>
                  <div className="font-medium">Jerome Carter</div>
                  <div className="text-sm text-muted-foreground">Requested apologist verification</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View profile
                  </Button>
                  <Button size="sm">Approve</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border">
                <div>
                  <div className="font-medium">Naomi Patel</div>
                  <div className="text-sm text-muted-foreground">Moderator eligibility review</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View profile
                  </Button>
                  <Button size="sm">Approve</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle>Flagged content</CardTitle>
              <CardDescription>Escalate or clear items from the community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded border">
                <div>
                  <div className="font-medium">"Can I post fundraising links here?"</div>
                  <div className="text-sm text-muted-foreground">Reported by 3 users • awaiting review</div>
                </div>
                <div className="flex gap-3 items-center">
                  <Label className="flex items-center gap-2 text-sm">
                    <Switch defaultChecked />
                    Keep hidden
                  </Label>
                  <Button size="sm" variant="outline">
                    Resolve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
