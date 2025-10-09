import { useState, useEffect, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useMediaQuery } from '../hooks/use-media-query';
import io, { Socket } from 'socket.io-client';
import MobileChatInterface from '../components/mobile-chat-interface';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '@shared/mobile-web/types';

interface Message {
  id: string;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  // Optional sender meta used only for mobile interface rendering
  sender?: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export default function DMs() {
  const params = useParams<{ userId: string }>();
  const userIdFromUrl = params.userId;
  const [, navigate] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recipient, setRecipient] = useState<User | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Get current user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false
  });

  // Get recipient user data
  const { data: recipientData } = useQuery<User>({
    queryKey: [`/api/users/${userIdFromUrl}`],
    enabled: !!userIdFromUrl,
    retry: false
  });

  useEffect(() => {
    if (recipientData) {
      setRecipient(recipientData);
    }
  }, [recipientData]);

  // Fetch DMs when component mounts or userId changes
  useEffect(() => {
    if (!userIdFromUrl) return;
    
    setIsLoading(true);
    fetch(`/api/dms/${userIdFromUrl}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setMessages([]);
        setIsLoading(false);
      });
  }, [userIdFromUrl]);

  // Socket.IO connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = io({
      path: '/socket.io/'
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO');
      socket.emit('join', user.id);
    });

    socket.on('new_message', (message: Message) => {
      // Only add message if it's from the current conversation
      if (userIdFromUrl && (message.senderId.toString() === userIdFromUrl || message.receiverId.toString() === userIdFromUrl)) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('message_error', (error: any) => {
      console.error('Message error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, userIdFromUrl]);

  // Send message
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !user?.id || !userIdFromUrl || !socketRef.current) return;

    setIsLoading(true);
    
    // Use Socket.IO for real-time messaging
    socketRef.current.emit('send_message', {
      senderId: user.id,
      receiverId: userIdFromUrl,
      content: messageContent.trim()
    });

    setIsLoading(false);
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!userIdFromUrl) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
        <p className="text-muted-foreground">No user specified for conversation.</p>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
        <p className="text-muted-foreground">Please sign in to view messages.</p>
      </div>
    );
  }

  const recipientName = recipient?.displayName || recipient?.username || `User ${userIdFromUrl}`;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Mobile Chat Header */}
        <div className="bg-background/95 border-b border-border/50 px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/messages')}
            className="touch-target"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={recipient?.avatarUrl || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(recipientName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {recipientName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {recipient?.email && 'Online'}
            </p>
          </div>
          
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="touch-target">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="touch-target">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="touch-target">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Chat Interface */}
        <MobileChatInterface
          messages={messages.map(m => ({
            ...m,
            // Normalize null recipient to undefined so it satisfies optional sender typing
            sender: (m.senderId === user.id ? user : recipient) || undefined
          }))}
          currentUserId={user.id}
          recipientName={recipientName}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={recipient?.avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(recipientName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{recipientName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {recipient?.email && 'Online'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Desktop Messages */}
        <CardContent className="flex-1 p-0 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={recipient?.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(recipientName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Send a message to {recipientName}
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user.id;
                const showAvatar = !isOwn && (
                  index === 0 || 
                  messages[index - 1]?.senderId !== message.senderId
                );

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {showAvatar ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={recipient?.avatarUrl || ''} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(recipientName)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8" />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl ${
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
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Message Input */}
          <div className="border-t p-4">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (content.trim()) {
                handleSendMessage(content);
                setContent("");
              }
            }} className="flex gap-3">
              <Input
                type="text"
                placeholder={`Message ${recipientName}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                className="flex-1"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={!content.trim() || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                Send
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}