import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function DMsPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Search for users to start conversations - for now just empty array since we need to implement user search
  const searchResults: User[] = [];

  // Get messages for selected conversation
  const { data: messages = [], refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/dms", selectedUserId],
    enabled: !!selectedUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const response = await fetch("/api/dms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["/api/dms", selectedUserId] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUserId) return;

    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Please log in to access messages.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[80vh]">
        {/* Conversations Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh]">
              {searchQuery && searchResults.length > 0 && (
                <div className="p-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Search Results
                  </p>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-lg"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setSearchQuery("");
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>
                          {user.displayName?.[0] || user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!searchQuery && (
                <div className="p-2 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Search for users to start a conversation</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2">
          {selectedUserId ? (
            <>
              <CardHeader className="border-b">
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-full">
                <ScrollArea className="flex-1 p-4" style={{ height: "50vh" }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isCurrentUser = message.senderId === currentUser.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground ml-auto"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isCurrentUser
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {format(new Date(message.createdAt), "HH:mm")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p>Choose a user from the sidebar to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}