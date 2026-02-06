/**
 * Organization Activity Log - View admin activity history
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  UserMinus,
  Settings,
  Shield,
  Check,
  X,
  FileText,
  Calendar,
  Activity
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: number;
  actorId: number;
  action: string;
  targetType?: string | null;
  targetId?: number | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

interface OrgActivityLogProps {
  logs: ActivityLog[];
  isLoading?: boolean;
}

const actionConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "settings.updated": {
    label: "Updated settings",
    icon: <Settings className="h-4 w-4" />,
    color: "text-blue-500",
  },
  "member.role_changed": {
    label: "Changed member role",
    icon: <Shield className="h-4 w-4" />,
    color: "text-yellow-500",
  },
  "member.removed": {
    label: "Removed member",
    icon: <UserMinus className="h-4 w-4" />,
    color: "text-red-500",
  },
  "membership.approved": {
    label: "Approved membership",
    icon: <Check className="h-4 w-4" />,
    color: "text-green-500",
  },
  "membership.declined": {
    label: "Declined membership",
    icon: <X className="h-4 w-4" />,
    color: "text-red-500",
  },
  "meeting.new": {
    label: "Meeting request received",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-purple-500",
  },
  "meeting.in_progress": {
    label: "Meeting in progress",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-blue-500",
  },
  "meeting.closed": {
    label: "Meeting closed",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-gray-500",
  },
  "ordination_program.created": {
    label: "Created ordination program",
    icon: <FileText className="h-4 w-4" />,
    color: "text-green-500",
  },
  "ordination.applied": {
    label: "Ordination application submitted",
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-500",
  },
  "ordination.approve": {
    label: "Approved ordination",
    icon: <Check className="h-4 w-4" />,
    color: "text-green-500",
  },
  "ordination.reject": {
    label: "Rejected ordination",
    icon: <X className="h-4 w-4" />,
    color: "text-red-500",
  },
  "ordination.request_info": {
    label: "Requested more info",
    icon: <FileText className="h-4 w-4" />,
    color: "text-yellow-500",
  },
};

function getActionConfig(action: string) {
  return actionConfig[action] || {
    label: action.replace(/[._]/g, " "),
    icon: <Activity className="h-4 w-4" />,
    color: "text-gray-500",
  };
}

function formatMetadata(action: string, metadata?: Record<string, any> | null): string | null {
  if (!metadata) return null;

  switch (action) {
    case "settings.updated":
      if (metadata.fields) {
        return `Fields: ${metadata.fields.join(", ")}`;
      }
      break;
    case "member.role_changed":
      if (metadata.oldRole && metadata.newRole) {
        return `${metadata.oldRole} → ${metadata.newRole}`;
      }
      break;
    case "ordination_program.created":
      if (metadata.title) {
        return `Program: ${metadata.title}`;
      }
      break;
  }

  return null;
}

export function OrgActivityLog({ logs, isLoading }: OrgActivityLogProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Recent administrative activity in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => {
              const config = getActionConfig(log.action);
              const actorName = log.actor?.displayName || log.actor?.username || "Unknown";
              const metadataText = formatMetadata(log.action, log.metadata);

              return (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={log.actor?.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(actorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{actorName}</span>
                      <span className="text-sm text-muted-foreground">{config.label}</span>
                    </div>
                    {metadataText && (
                      <p className="text-sm text-muted-foreground mt-1">{metadataText}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No activity recorded yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
