/**
 * Blocked Users Management Page
 * Apple Store requirement: ability to manage blocked users
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { UserX, UserCheck, Shield } from 'lucide-react';
import { apiUrl } from '../lib/env';
import { BlockUserModal } from "../components/moderation/BlockUserModal";

interface BlockedUser {
  id: number;
  blockedUser: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  reason?: string;
  createdAt: string;
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<{id: number, name: string} | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch(apiUrl('/api/blocked-users'), {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data);
      } else {
        console.error('Failed to fetch blocked users');
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (userId: number, isBlocked: boolean) => {
    if (!isBlocked) {
      // User was unblocked, remove from list
      setBlockedUsers(prev => prev.filter(block => block.blockedUser.id !== userId));
    }
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blocked Users</h1>
        <p className="text-gray-600">
          Manage users you've blocked. Blocked users can't see your content or interact with you.
        </p>
      </div>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Blocked Users
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You haven't blocked any users yet. When you block someone, they'll appear here and you can manage them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {blockedUsers.length} blocked user{blockedUsers.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-3">
            {blockedUsers.map((block) => (
              <Card key={block.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {block.blockedUser.avatar ? (
                          <img
                            src={block.blockedUser.avatar}
                            alt={block.blockedUser.displayName || block.blockedUser.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {(block.blockedUser.displayName || block.blockedUser.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {block.blockedUser.displayName || block.blockedUser.username}
                          </h3>
                          {block.blockedUser.displayName && (
                            <span className="text-sm text-gray-500">
                              @{block.blockedUser.username}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Blocked {new Date(block.createdAt).toLocaleDateString()}
                          </span>
                          {block.reason && (
                            <Badge variant="outline" className="text-xs">
                              {block.reason}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser({
                        id: block.blockedUser.id,
                        name: block.blockedUser.displayName || block.blockedUser.username
                      })}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Unblock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <BlockUserModal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          userName={selectedUser.name}
          isBlocked={true}
          onBlockStatusChange={handleUnblock}
        />
      )}
    </div>
  );
}