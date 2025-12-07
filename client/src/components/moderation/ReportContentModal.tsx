/**
 * Modal for reporting inappropriate content
 * Apple Store requirement: mechanism to report offensive content
 */
import React, { useState } from 'react';
import { apiUrl } from "../../lib/env";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ReportContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'post' | 'microblog' | 'comment' | 'event' | 'prayer_request' | 'community';
  contentId: number;
  contentPreview?: string;
}

const reportReasons = [
  { value: 'spam', label: 'Spam or misleading content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'hate_speech', label: 'Hate speech or discrimination' },
  { value: 'false_info', label: 'False information' },
  { value: 'other', label: 'Other violation' }
];

export function ReportContentModal({ 
  isOpen, 
  onClose, 
  contentType, 
  contentId, 
  contentPreview 
}: ReportContentModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
          description: description.trim() || undefined
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setReason('');
          setDescription('');
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error reporting content:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReason('');
      setDescription('');
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting content that violates our guidelines.
            Our moderation team will review your report within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="font-semibold text-green-800">Report Submitted</h3>
              <p className="text-sm text-green-600 mt-1">
                Thank you for helping keep our community safe. We'll review this report promptly.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {contentPreview && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Content being reported:</p>
                <p className="text-sm line-clamp-3">{contentPreview}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Reason for reporting *
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Additional details (optional)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context that might help our review..."
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </p>
            </div>

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
                disabled={!reason || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}