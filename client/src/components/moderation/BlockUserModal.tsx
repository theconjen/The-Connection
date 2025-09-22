/**
 * Modal for blocking/unblocking users
 * Apple Store requirement: ability to block abusive users
 */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { UserX, UserCheck, Shield } from "lucide-react";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  isBlocked?: boolean;
  onBlockStatusChange?: (userId: number, isBlocked: boolean) => void;
}

const blockReasons = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or unwanted messages' },
  { value: 'inappropriate', label: 'Inappropriate behavior' },
  { value: 'other', label: 'Other reason' }
];

export function BlockUserModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  isBlocked = false,
  onBlockStatusChange
}: BlockUserModalProps) {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isBlocked && !reason) return;

    setIsSubmitting(true);
    try {
      const url = isBlocked ? `/api/moderation/block/${userId}` : '/api/moderation/block';
      const method = isBlocked ? 'DELETE' : 'POST';
      const body = isBlocked ? undefined : JSON.stringify({
        blockedId: userId,
        reason: reason || undefined
      });

      const response = await fetch(url, {
        method,
        headers: body ? {
          'Content-Type': 'application/json',
        } : {},
        body,
        credentials: 'include'
      });

      if (response.ok) {
        const newBlockedStatus = !isBlocked;
        onBlockStatusChange?.(userId, newBlockedStatus);
        onClose();
        setReason('');
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${isBlocked ? 'unblock' : 'block'} user`);
      }
    } catch (error) {
      console.error(`Error ${isBlocked ? 'unblocking' : 'blocking'} user:`, error);
      alert(`Failed to ${isBlocked ? 'unblock' : 'block'} user. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <UserCheck className="h-5 w-5 text-green-500" />
                Unblock User
              </>
            ) : (
              <>
                <UserX className="h-5 w-5 text-red-500" />
                Block User
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocked ? (
              <>
                Unblock <strong>{userName}</strong>? They will be able to interact with your content and see your posts again.
              </>
            ) : (
              <>
                Block <strong>{userName}</strong>? They won't be able to send you messages, see your posts, or interact with your content.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isBlocked && (
            <>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">What happens when you block someone:</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• They can't see your posts or profile</li>
                    <li>• They can't send you messages</li>
                    <li>• Their comments won't appear on your posts</li>
                    <li>• You won't see their content in feeds</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Reason for blocking (optional)
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockReasons.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant={isBlocked ? "default" : "destructive"}
              className="flex-1"
            >
              {isSubmitting ? (
                isBlocked ? 'Unblocking...' : 'Blocking...'
              ) : (
                isBlocked ? 'Unblock User' : 'Block User'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}