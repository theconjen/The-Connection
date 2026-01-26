import { useState, useRef, ChangeEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { InsertMicroblog } from "@connection/shared/schema";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { apiUrl } from "../lib/env";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Label } from "./ui/label";
import { Image, X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { getInitials } from "../lib/utils";
import { apiRequest, queryClient } from "../lib/queryClient";

// Local interface to ensure type safety
interface MicroblogData {
  content: string;
  authorId: number;
  parentId?: number;
  communityId?: number;
  groupId?: number;
  imageUrl?: string;
  imageUrls?: string[];
}

interface ImagePreview {
  file: File;
  preview: string;
}

interface MicroblogComposerProps {
  parentId?: number;
  communityId?: number;
  groupId?: number;
  onSuccess?: () => void;
}

const MAX_IMAGES = 4;

export function MicroblogComposer({
  parentId,
  communityId,
  groupId,
  onSuccess
}: MicroblogComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 280;

  const createMicroblogMutation = useMutation({
    mutationFn: async (microblogData: MicroblogData) => {
      // If there are images, we need to use FormData
      if (images.length > 0) {
        const formData = new FormData();
        formData.append('content', microblogData.content);
        if (microblogData.parentId !== undefined) formData.append('parentId', microblogData.parentId.toString());
        if (microblogData.communityId !== undefined) formData.append('communityId', microblogData.communityId.toString());
        if (microblogData.groupId !== undefined) formData.append('groupId', microblogData.groupId.toString());
        formData.append('authorId', microblogData.authorId.toString());

        // Append all images
        images.forEach((img, index) => {
          formData.append('images', img.file);
        });

        // Custom fetch for FormData
        const response = await fetch(apiUrl('/api/microblogs'), {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to create microblog');
        }

        return await response.json();
      } else {
        // Regular JSON request if no images
        const response = await apiRequest('POST', '/api/microblogs', microblogData);
        return await response.json();
      }
    },
    onSuccess: () => {
      setContent("");
      setImages([]);
      setCharacterCount(0);

      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/microblogs', parentId, 'replies'] });
      }

      if (communityId) {
        queryClient.invalidateQueries({ queryKey: ['/api/communities', communityId, 'microblogs'] });
      }

      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ['/api/communities', groupId, 'microblogs'] });
      }

      toast({
        title: "Success",
        description: "Your post has been published",
      });

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to publish post: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharacterCount(text.length);
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const remainingSlots = MAX_IMAGES - images.length;

      if (newFiles.length > remainingSlots) {
        toast({
          title: "Limit reached",
          description: `You can only add up to ${MAX_IMAGES} images per post`,
          variant: "default"
        });
      }

      const filesToAdd = newFiles.slice(0, remainingSlots);

      // Create previews for each file
      filesToAdd.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  const moveImageRight = (index: number) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create posts",
        variant: "default"
      });
      return;
    }

    if (content.trim() === "") {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (content.length > MAX_CHARS) {
      toast({
        title: "Error",
        description: `Content exceeds ${MAX_CHARS} character limit`,
        variant: "destructive"
      });
      return;
    }

    const microblogData: MicroblogData = {
      content,
      authorId: user.id,
      ...(parentId && { parentId }),
      ...(communityId && { communityId }),
      ...(groupId && { groupId })
    };

    createMicroblogMutation.mutate(microblogData);
  };

  if (!user) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <p className="text-center text-muted-foreground">
            Please sign in to create posts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar>
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.displayName || "User"} />
            ) : (
              <AvatarFallback>{getInitials(user.displayName || "User")}</AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1">
            <Textarea
              placeholder={parentId ? "Write your reply..." : "What's on your mind?"}
              className="border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 h-24"
              value={content}
              onChange={handleContentChange}
            />

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-3">
                {images.length > 1 && (
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    Use arrows to reorder images
                  </p>
                )}
                <div className={`grid gap-2 ${
                  images.length === 1 ? 'grid-cols-1' :
                  images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`relative group rounded-lg overflow-hidden border border-border ${
                        images.length === 1 ? 'h-52' :
                        images.length === 2 ? 'h-40' :
                        'h-32'
                      }`}
                    >
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Order badge */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {index + 1}
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>

                      {/* Reorder buttons */}
                      {images.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className={`h-6 w-6 rounded-full bg-black/70 hover:bg-black/90 text-white ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            onClick={() => moveImageLeft(index)}
                            disabled={index === 0}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className={`h-6 w-6 rounded-full bg-black/70 hover:bg-black/90 text-white ${index === images.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                            onClick={() => moveImageRight(index)}
                            disabled={index === images.length - 1}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
          >
            <Images className="h-5 w-5 mr-1" />
            {images.length > 0 ? `${images.length}/${MAX_IMAGES}` : 'Photos'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-sm ${characterCount > MAX_CHARS ? 'text-red-500' : 'text-muted-foreground'}`}>
            {characterCount}/{MAX_CHARS}
          </span>

          <Button
            disabled={content.trim() === "" || characterCount > MAX_CHARS || createMicroblogMutation.isPending}
            onClick={handleSubmit}
          >
            {createMicroblogMutation.isPending ? "Publishing..." : parentId ? "Reply" : "Post"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default MicroblogComposer;
