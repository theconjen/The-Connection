/**
 * Content Actions Component
 * Provides report and block functionality for any content item
 */
import React, { useState } from 'react';
import { MoreHorizontal, Flag, UserX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ReportContentModal } from './ReportContentModal';
import { BlockUserModal } from './BlockUserModal';

interface ContentActionsProps {
  contentId: number;
  contentType: 'post' | 'microblog' | 'comment' | 'event' | 'prayer_request';
  authorId: number;
  authorName: string;
  contentPreview?: string;
  currentUserId?: number;
  isAuthorBlocked?: boolean;
  onBlockStatusChange?: (userId: number, isBlocked: boolean) => void;
  className?: string;
}

export function ContentActions({
  contentId,
  contentType,
  authorId,
  authorName,
  contentPreview,
  currentUserId,
  isAuthorBlocked = false,
  onBlockStatusChange,
  className = ""
}: ContentActionsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Don't show actions for own content
  if (currentUserId && currentUserId === authorId) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 hover:bg-gray-100 ${className}`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Content actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setShowReportModal(true)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Flag className="h-4 w-4 mr-2" />
            Report Content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowBlockModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <UserX className="h-4 w-4 mr-2" />
            {isAuthorBlocked ? 'Unblock User' : 'Block User'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportContentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType={contentType}
        contentId={contentId}
        contentPreview={contentPreview}
      />

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={authorId}
        userName={authorName}
        isBlocked={isAuthorBlocked}
        onBlockStatusChange={onBlockStatusChange}
      />
    </>
  );
}