import { useState, useRef, ChangeEvent } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { InsertMicroblog } from "@connection/shared/schema";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Image, X, Send, Camera } from "lucide-react";
import { getInitials } from "../lib/utils";
import { apiRequest, queryClient } from "../lib/queryClient";
import { apiUrl } from "../lib/env";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

// Local interface to ensure type safety
interface MicroblogData {
  content: string;
  authorId: number;
  parentId?: number;
  communityId?: number;
  groupId?: number;
  imageUrl?: string;
}

interface MobileMicroblogComposerProps {
  parentId?: number;
  communityId?: number;
  groupId?: number;
  onSuccess?: () => void;
  minimized?: boolean;
}

/**
 * MobileMicroblogComposer - A mobile-optimized version of the microblog composer
 * Features:
 * - Collapsible interface with expanded composition in a sheet
 * - Simplified controls
 * - Touch-friendly UI elements
 */
export default function MobileMicroblogComposer({ 
  parentId, 
  communityId, 
  groupId,
  onSuccess,
  minimized = true
}: MobileMicroblogComposerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
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
      setIsComposerOpen(false);
      
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
  
  // Take a photo directly using the device camera (mobile-specific)
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };
  
  if (!user) {
    return (
      <div className="border-b border-secondary/20 p-3 mb-3 bg-background text-center text-sm text-muted-foreground">
        Please sign in to create posts
      </div>
    );
  }
  
  // Minimized version (default for mobile feed)
  if (minimized) {
    return (
      <div className="pb-3 border-b border-secondary/10 mb-4">
        <Sheet open={isComposerOpen} onOpenChange={setIsComposerOpen}>
          <SheetTrigger asChild>
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-secondary/20 active:bg-secondary/5">
              <Avatar className="h-8 w-8">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName || "User"} />
                ) : (
                  <AvatarFallback>{getInitials(user.displayName || "User")}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-muted-foreground text-sm flex-1">
                {parentId ? "Write your reply..." : "What's on your mind?"}
              </span>
              <Camera className="h-5 w-5 text-primary/70" />
            </div>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-[90vh] pt-6 rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>{parentId ? "Reply to post" : "Create a post"}</SheetTitle>
              <SheetDescription>
                Share your thoughts with the community
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-4 flex flex-col h-[calc(100%-150px)]">
              <div className="flex gap-3 mb-3">
                <Avatar>
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName || "User"} />
                  ) : (
                    <AvatarFallback>{getInitials(user.displayName || "User")}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{user.displayName || user.username}</div>
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                </div>
              </div>
              
              <Textarea
                placeholder={parentId ? "Write your reply..." : "What's on your mind?"}
                className="flex-1 min-h-[150px] border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0"
                value={content}
                onChange={handleContentChange}
                autoFocus
              />
              
              {imagePreview && (
                <div className="relative my-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-60 w-auto mx-auto object-contain rounded-lg border" 
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="pt-4 border-t mt-auto flex justify-between items-center">
                <div className="flex gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-10 w-10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-5 w-5 text-primary" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full h-10 w-10"
                    onClick={handleTakePhoto}
                  >
                    <Camera className="h-5 w-5 text-primary" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${characterCount > MAX_CHARS ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {characterCount}/{MAX_CHARS}
                  </span>
                  
                  <Button 
                    disabled={content.trim() === "" || characterCount > MAX_CHARS || createMicroblogMutation.isPending}
                    onClick={handleSubmit}
                    className="rounded-full px-4"
                  >
                    {createMicroblogMutation.isPending ? "Publishing..." : 
                      <div className="flex items-center">
                        {parentId ? "Reply" : "Post"} <Send className="ml-1 h-4 w-4" />
                      </div>
                    }
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
  
  // Expanded version (for replies and dedicated compose pages)
  return (
    <div className="border-b border-secondary/20 p-4 mb-4 bg-white">
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
            className="border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 min-h-[100px]"
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
      
      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <div className="flex gap-2">
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
            className="text-primary p-2 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary p-2 h-9 w-9"
            onClick={handleTakePhoto}
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-sm ${characterCount > MAX_CHARS ? 'text-red-500' : 'text-muted-foreground'}`}>
            {characterCount}/{MAX_CHARS}
          </span>
          
          <Button 
            disabled={content.trim() === "" || characterCount > MAX_CHARS || createMicroblogMutation.isPending}
            onClick={handleSubmit}
            size="sm"
            className="rounded-full"
          >
            {createMicroblogMutation.isPending ? "Publishing..." : parentId ? "Reply" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}