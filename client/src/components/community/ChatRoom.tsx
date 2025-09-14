import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useChatWebsocket, ChatMessage } from "../../hooks/use-chat-websocket";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatRoomProps {
  roomId: number;
  roomName: string;
}

export function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const { user } = useAuth();
  const { sendMessage, joinRoom, leaveRoom, sendTyping, messages, usersTyping, isConnected, error } = useChatWebsocket();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Filter messages for this room
  const roomMessages = messages.filter(msg => msg.chatRoomId === roomId);
  
  // Filter typing users for this room
  const roomTypingUsers = usersTyping.filter(u => u.roomId === roomId && u.userId !== user?.id);
  
  // Join the chat room on mount and leave on unmount
  useEffect(() => {
    joinRoom(roomId);
    
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);
  
  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !user || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      sendMessage(message, roomId);
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle typing notification
  const handleTyping = () => {
    sendTyping(roomId);
  };
  
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2">Connecting to chat...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[500px] rounded-md border">
      <div className="p-3 border-b bg-muted/20">
        <h3 className="font-medium">{roomName}</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {roomMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {roomMessages.map((msg) => (
              <ChatMessageItem 
                key={msg.id} 
                message={msg} 
                isOwnMessage={msg.senderId === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {roomTypingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic">
          {roomTypingUsers.length === 1 
            ? `${roomTypingUsers[0].username} is typing...` 
            : `${roomTypingUsers.length} people are typing...`}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleTyping}
          placeholder="Type your message..."
          className="min-h-[60px] resize-none"
        />
        <Button type="submit" size="icon" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

function ChatMessageItem({ message, isOwnMessage }: ChatMessageItemProps) {
  // Format the message timestamp
  const timestamp = message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : '';
  
  // System messages have a special styling
  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center">
        <div className="inline-block bg-muted/30 rounded-md px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.avatarUrl || ''} />
          <AvatarFallback>
            {message.sender?.displayName?.charAt(0) || message.sender?.username?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {message.sender?.displayName || message.sender?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          
          <div className={`rounded-lg px-3 py-2 ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}