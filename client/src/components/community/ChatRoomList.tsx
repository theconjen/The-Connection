import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MessageSquarePlus, Lock, Unlock, MoreVertical, Edit, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChatRoom as ChatRoomComponent } from "./ChatRoom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatRoom {
  id: number;
  name: string;
  description: string | null;
  communityId: number;
  isPrivate: boolean;
  createdAt: Date | null;
  createdBy: number;
}

interface ChatRoomListProps {
  communityId: number;
  isOwner: boolean;
  isModerator: boolean;
  isMember: boolean;
}

export function ChatRoomList({ communityId, isOwner, isModerator, isMember }: ChatRoomListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  
  const { data: chatRooms, isLoading, error } = useQuery({
    queryKey: [`/api/communities/${communityId}/chat-rooms`],
    enabled: !!communityId,
  });
  
  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; isPrivate: boolean }) => {
      const res = await apiRequest(
        "POST",
        `/api/communities/${communityId}/chat-rooms`,
        data
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/chat-rooms`] });
      toast({
        title: "Chat room created",
        description: `"${data.name}" has been created successfully.`,
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create chat room",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, data }: { roomId: number; data: any }) => {
      const res = await apiRequest(
        "PUT",
        `/api/chat-rooms/${roomId}`,
        data
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/chat-rooms`] });
      toast({
        title: "Chat room updated",
        description: `"${data.name}" has been updated successfully.`,
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update chat room",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      await apiRequest(
        "DELETE",
        `/api/chat-rooms/${roomId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/chat-rooms`] });
      toast({
        title: "Chat room deleted",
        description: "The chat room has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setActiveRoom(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete chat room",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoomName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for the chat room.",
        variant: "destructive",
      });
      return;
    }
    
    createRoomMutation.mutate({
      name: newRoomName,
      description: newRoomDescription,
      isPrivate: newRoomIsPrivate,
    });
  };
  
  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeRoom) return;
    
    if (!newRoomName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for the chat room.",
        variant: "destructive",
      });
      return;
    }
    
    updateRoomMutation.mutate({
      roomId: activeRoom.id,
      data: {
        name: newRoomName,
        description: newRoomDescription,
        isPrivate: newRoomIsPrivate,
      },
    });
  };
  
  const handleDeleteRoom = () => {
    if (activeRoom) {
      deleteRoomMutation.mutate(activeRoom.id);
    }
  };
  
  const openEditDialog = (room: ChatRoom) => {
    setActiveRoom(room);
    setNewRoomName(room.name);
    setNewRoomDescription(room.description || "");
    setNewRoomIsPrivate(room.isPrivate);
    setEditDialogOpen(true);
  };
  
  const openDeleteDialog = (room: ChatRoom) => {
    setActiveRoom(room);
    setDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setNewRoomName("");
    setNewRoomDescription("");
    setNewRoomIsPrivate(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading chat rooms...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading chat rooms: {(error as Error).message}
      </div>
    );
  }
  
  // Split rooms into public and private
  const publicRooms = chatRooms?.filter(room => !room.isPrivate) || [];
  const privateRooms = chatRooms?.filter(room => room.isPrivate) || [];
  
  // Function to render room list based on array
  const renderRoomList = (rooms: ChatRoom[]) => {
    if (rooms.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No chat rooms found
        </div>
      );
    }
    
    return rooms.map(room => (
      <Card key={room.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                {room.name}
                {room.isPrivate && <Lock className="h-4 w-4 text-amber-500" />}
              </CardTitle>
              <CardDescription>
                {room.description || "No description provided"}
              </CardDescription>
            </div>
            
            {(isOwner || isModerator || room.createdBy === user?.id) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(room)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Room</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => openDeleteDialog(room)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete Room</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ChatRoomComponent roomId={room.id} roomName={room.name} />
        </CardContent>
      </Card>
    ));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Chat Rooms</h3>
        
        {isMember && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                New Chat Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Chat Room</DialogTitle>
                <DialogDescription>
                  Add a new chat room to this community.
                  {!isOwner && !isModerator && newRoomIsPrivate && (
                    <div className="mt-2 text-amber-500">
                      <Lock className="inline-block h-4 w-4 mr-1" />
                      Only moderators or owners can create private chat rooms.
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateRoom}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="General Discussion"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      value={newRoomDescription}
                      onChange={(e) => setNewRoomDescription(e.target.value)}
                      placeholder="A place for general community discussions"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPrivate"
                      checked={newRoomIsPrivate}
                      onCheckedChange={setNewRoomIsPrivate}
                      disabled={!isOwner && !isModerator && newRoomIsPrivate}
                    />
                    <Label htmlFor="isPrivate">
                      {newRoomIsPrivate ? (
                        <span className="flex items-center">
                          <Lock className="h-4 w-4 mr-1" />
                          Private Room (members only)
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Unlock className="h-4 w-4 mr-1" />
                          Public Room (all visitors)
                        </span>
                      )}
                    </Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit"
                    disabled={createRoomMutation.isPending || (!isOwner && !isModerator && newRoomIsPrivate)}
                  >
                    {createRoomMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Room"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Rooms ({chatRooms?.length || 0})</TabsTrigger>
          <TabsTrigger value="public">Public ({publicRooms.length})</TabsTrigger>
          <TabsTrigger value="private">Private ({privateRooms.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {renderRoomList(chatRooms || [])}
        </TabsContent>
        
        <TabsContent value="public" className="mt-4">
          {renderRoomList(publicRooms)}
        </TabsContent>
        
        <TabsContent value="private" className="mt-4">
          {isMember ? (
            renderRoomList(privateRooms)
          ) : (
            <div className="text-center py-6 border rounded-md">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h4 className="text-lg font-medium">Private Rooms</h4>
              <p className="text-muted-foreground">
                You need to join this community to access private chat rooms.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Room Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Room</DialogTitle>
            <DialogDescription>
              Update the details of this chat room.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateRoom}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Room Name</Label>
                <Input
                  id="edit-name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="General Discussion"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (optional)</Label>
                <Input
                  id="edit-description"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="A place for general community discussions"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isPrivate"
                  checked={newRoomIsPrivate}
                  onCheckedChange={setNewRoomIsPrivate}
                />
                <Label htmlFor="edit-isPrivate">
                  {newRoomIsPrivate ? (
                    <span className="flex items-center">
                      <Lock className="h-4 w-4 mr-1" />
                      Private Room (members only)
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Unlock className="h-4 w-4 mr-1" />
                      Public Room (all visitors)
                    </span>
                  )}
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit"
                disabled={updateRoomMutation.isPending}
              >
                {updateRoomMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Room Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{activeRoom?.name}"? This action cannot be undone and all messages will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRoom}
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Room"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}