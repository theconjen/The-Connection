import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import TouchFeedback from "./mobile-touch-feedback";

interface Message {
  id: string;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface MobileChatInterfaceProps {
  messages: Message[];
  currentUserId: number;
  recipientName: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

/**
 * Mobile-optimized chat interface with smooth scrolling and keyboard handling
 */
export default function MobileChatInterface({
  messages,
  currentUserId,
  recipientName,
  onSendMessage,
  isLoading = false
}: MobileChatInterfaceProps) {
  const [messageContent, setMessageContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle keyboard appearance on mobile
  useEffect(() => {
    const handleResize = () => {
      // Delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageContent.trim();
    if (content && !isLoading) {
      onSendMessage(content);
      setMessageContent("");
      setIsTyping(false);
      // Keep focus on input for continuous typing
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-background mobile-keyboard-adjust">
      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar"
        style={{ paddingBottom: 'env(keyboard-inset-height, 0px)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
            <p className="text-muted-foreground text-sm">
              Send a message to {recipientName}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showAvatar = !isOwn && (
              index === 0 || 
              messages[index - 1]?.senderId !== message.senderId
            );

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {showAvatar ? (
                  <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                    <AvatarImage src={message.sender?.avatarUrl || ''} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(message.sender?.displayName || message.sender?.username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8" />
                )}

                {/* Message Bubble */}
                <TouchFeedback pressScale={0.98}>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl mobile-text ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    } shadow-sm`}
                  >
                    <p className="break-words">{message.content}</p>
                    <div 
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </TouchFeedback>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-xs text-muted-foreground">Typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-4 safe-area-bottom">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          {/* Attachment Button */}
          <TouchFeedback>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 touch-target"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
          </TouchFeedback>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={`Message ${recipientName}...`}
              value={messageContent}
              onChange={handleInputChange}
              disabled={isLoading}
              className="mobile-input pr-12 resize-none border-primary/20 focus:border-primary/40"
              maxLength={500}
            />
            
            {/* Emoji Button */}
            <TouchFeedback>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                disabled={isLoading}
              >
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TouchFeedback>
          </div>

          {/* Send Button */}
          <TouchFeedback>
            <Button
              type="submit"
              disabled={!messageContent.trim() || isLoading}
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 w-12 p-0 touch-target mobile-button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </TouchFeedback>
        </form>
      </div>
    </div>
  );
}