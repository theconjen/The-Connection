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
import { Image, X } from "lucide-react";
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
}

interface MicroblogComposerProps {
  parentId?: number;
  communityId?: number;
  groupId?: number;
  onSuccess?: () => void;
}

export function MicroblogComposer({ 
  parentId, 
  communityId, 
  groupId,
  onSuccess 
}: MicroblogComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const MAX_CHARS = 280;
  
  const createMicroblogMutation = useMutation({
    mutationFn: async (microblogData: MicroblogData) => {
      // If there's an image, we need to use FormData
      if (imageFile) {
        const formData = new FormData();
        formData.append('content', microblogData.content);
        if (microblogData.parentId !== undefined) formData.append('parentId', microblogData.parentId.toString());
        if (microblogData.communityId !== undefined) formData.append('communityId', microblogData.communityId.toString());
        if (microblogData.groupId !== undefined) formData.append('groupId', microblogData.groupId.toString());
        formData.append('authorId', microblogData.authorId.toString());
        formData.append('image', imageFile);
        
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
        // Regular JSON request if no image
        const response = await apiRequest('POST', '/api/microblogs', microblogData);
        return await response.json();
      }
    },
    onSuccess: () => {
      setContent("");
      setImageFile(null);
      setImagePreview(null);
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-52 max-w-full object-contain rounded-md border" 
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 rounded-full"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-3 flex justify-between items-center">
        <div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageSelect}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-5 w-5" />
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