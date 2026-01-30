import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import AdminLayout from "../../components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useToast } from "../../hooks/use-toast";
import { Loader2, Users, ShieldCheck, Filter, Ban, UserCog } from "lucide-react";
import { apiUrl } from "../../lib/env";

type UserRecord = {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  isAdmin: boolean;
  isVerifiedApologeticsAnswerer: boolean;
  createdAt: string;
};

export default function UserManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Fetch all users from backend
  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/admin/users"));
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Promote to admin mutation
  const promoteAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}/role`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: true }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to promote user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admin-users"] });
      toast({ title: "Success", description: "User promoted to admin" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter users
  const filtered = users.filter((record) => {
    const name = record.displayName || record.username;
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      record.email.toLowerCase().includes(search.toLowerCase());

    if (roleFilter === "all") return matchesSearch;
    if (roleFilter === "admin") return matchesSearch && record.isAdmin;
    if (roleFilter === "apologist") return matchesSearch && record.isVerifiedApologeticsAnswerer;
    if (roleFilter === "member") return matchesSearch && !record.isAdmin && !record.isVerifiedApologeticsAnswerer;
    return matchesSearch;
  });

  const adminCount = users.filter(u => u.isAdmin).length;
  const apologistCount = users.filter(u => u.isVerifiedApologeticsAnswerer).length;

  const getRole = (record: UserRecord) => {
    if (record.isAdmin) return "admin";
    if (record.isVerifiedApologeticsAnswerer) return "apologist";
    return "member";
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500">Find, review, and manage user accounts.</p>
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
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-sm text-muted-foreground">Platform members</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admins</CardTitle>
            <CardDescription>Administrative users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{adminCount}</div>
            <div className="text-sm text-muted-foreground">With admin privileges</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apologists</CardTitle>
            <CardDescription>Verified answerers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{apologistCount}</div>
            <div className="text-sm text-muted-foreground">Q&A experts</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Search and manage user accounts.</CardDescription>
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
                <SelectItem value="admin">Admin</SelectItem>
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
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Role</th>
                    <th className="pb-2">Joined</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3">
                        <div className="font-medium">{record.displayName || record.username}</div>
                        <div className="text-muted-foreground">{record.email}</div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize">
                          {getRole(record)}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        {!record.isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promoteAdminMutation.mutate(record.id)}
                            disabled={promoteAdminMutation.isPending}
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${record.displayName || record.username}?`)) {
                              deleteUserMutation.mutate(record.id);
                            }
                          }}
                          disabled={deleteUserMutation.isPending || record.id === user?.id}
                          className="gap-1"
                        >
                          <Ban className="h-4 w-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
