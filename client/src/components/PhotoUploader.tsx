import { useState } from "react";
import type { ReactNode } from "react";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { Camera, Upload } from "lucide-react";

interface PhotoUploaderProps {
  onUploadSuccess?: (photoUrl: string) => void;
  maxFileSize?: number;
  buttonClassName?: string;
  uploadType?: "avatar" | "community" | "general";
  targetId?: string | number;
  children?: ReactNode;
}

/**
 * A specialized photo upload component for the Christian community platform.
 * Handles user avatars, community images, and general photo uploads with
 * automatic server-side ACL policy management.
 */
export function PhotoUploader({
  onUploadSuccess,
  maxFileSize = 5242880, // 5MB default for photos
  buttonClassName,
  uploadType = "general",
  targetId,
  children,
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGetUploadParameters = async () => {
    try {
      const res = await apiRequest("POST", "/api/objects/upload");
      const data = await res.json().catch(() => ({}));
      return {
        method: "PUT" as const,
        url: (data && (data.uploadURL || data.uploadUrl)) || "",
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    setIsUploading(true);
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const uploadURL = uploadedFile.uploadURL;

        // Handle different upload types
        let endpoint = "";
        let payload: any = {};

        switch (uploadType) {
          case "avatar":
            endpoint = "/api/user/avatar";
            payload = { avatarURL: uploadURL };
            break;
          case "community":
            if (!targetId) throw new Error("Target ID required for community uploads");
            endpoint = `/api/communities/${targetId}/image`;
            payload = { imageURL: uploadURL };
            break;
          case "general":
          default:
            // For general uploads, just return the URL without setting ACL
            onUploadSuccess?.(uploadURL as string);
            toast({
              title: "Photo uploaded successfully!",
              description: "Your photo has been uploaded.",
            });
            setIsUploading(false);
            return;
        }

        // Set ACL policy and update the relevant entity
        const res = await apiRequest("PUT", endpoint, payload);
        const response = await res.json().catch(() => ({}));

        const photoUrl = (response && (response.objectPath || response.objectPath || response.objectPath)) || uploadURL;
        onUploadSuccess?.(photoUrl);

        // Invalidate relevant queries
        if (uploadType === "avatar") {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        } else if (uploadType === "community") {
          queryClient.invalidateQueries({ queryKey: ["/api/communities", targetId] });
          queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
        }

        toast({
          title: "Photo uploaded successfully!",
          description: `Your ${uploadType === "avatar" ? "profile photo" : "photo"} has been updated.`,
        });
      }
    } catch (error) {
      console.error("Error completing upload:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ObjectUploader
      maxNumberOfFiles={1}
      maxFileSize={maxFileSize}
      onGetUploadParameters={handleGetUploadParameters}
      onComplete={handleComplete}
      buttonClassName={buttonClassName}
    >
      {children || (
        <div className="flex items-center gap-2">
          {uploadType === "avatar" ? (
            <Camera className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>
            {isUploading 
              ? "Uploading..." 
              : uploadType === "avatar" 
                ? "Change Photo" 
                : "Upload Photo"
            }
          </span>
        </div>
      )}
    </ObjectUploader>
  );
}