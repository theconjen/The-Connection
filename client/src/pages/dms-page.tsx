import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import io, { Socket } from 'socket.io-client';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Loader2, Send, MessageCircle, Search, MoreVertical, Phone, Video, Smile, Paperclip, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { apiUrl } from '../lib/env';

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  isRead: boolean;
}

export default function DMsPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const userIdFromUrl = (params as any).userId;
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current user data
  const { data: user } = useQuery<{ id: number; username: string; displayName?: string; avatarUrl?: string }>({
    queryKey: ['/api/user'],
    retry: false
  });

  // Fetch real conversations from backend
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/dms/conversations'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/dms/conversations'));
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/dms/unread-count'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/dms/unread-count'));
      if (!res.ok) throw new Error('Failed to fetch unread count');
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Mark conversation as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      const res = await fetch(apiUrl(`/api/dms/mark-conversation-read/${otherUserId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dms/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dms/unread-count'] });
    }
  });

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.otherUser.displayName || conv.otherUser.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Set selected user from URL
  useEffect(() => {
    if (userIdFromUrl) {
      setSelectedUserId(parseInt(userIdFromUrl));
    }
  }, [userIdFromUrl]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (!selectedUserId) return;

    fetch(apiUrl(`/api/dms/${selectedUserId}`))
      .then((res) => res.json())
      .then((data) => {
        setMessages(data || []);
        markReadMutation.mutate(selectedUserId);
      })
      .catch((err) => {
        console.error("Error fetching messages:", err);
        setMessages([]);
      });
  }, [selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when selecting a conversation
  useEffect(() => {
    if (selectedUserId) {
      inputRef.current?.focus();
    }
  }, [selectedUserId]);

  // Socket.IO connection
  useEffect(() => {
    if (!user?.id) return;

    const socket = io({
      path: '/socket.io/',
      auth: { userId: user.id },
      query: { userId: user.id }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_user_room', user.id);
    });

    socket.on('new_message', (message: Message) => {
      if (selectedUserId && (message.senderId === selectedUserId || message.receiverId === selectedUserId)) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.senderId === selectedUserId) {
          markReadMutation.mutate(selectedUserId);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/dms/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dms/unread-count'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, selectedUserId, queryClient]);

  // Send message
  async function sendMessage() {
    if (!content.trim() || !user?.id || !selectedUserId || !socketRef.current) return;

    socketRef.current.emit('send_dm', {
      senderId: user.id,
      receiverId: selectedUserId,
      content: content.trim()
    });

    setContent("");
    inputRef.current?.focus();
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], message) => {
    const dateKey = formatMessageDate(message.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date: dateKey, messages: [message] });
    }
    return groups;
  }, []);

  const selectedConversation = conversations.find(c => c.otherUser.id === selectedUserId);

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-7xl mx-auto bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              Messages
              {unreadData?.count ? (
                <Badge className="bg-primary text-primary-foreground">{unreadData.count}</Badge>
              ) : null}
            </h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Start a conversation from someone's profile
              </p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv) => {
                const isSelected = selectedUserId === conv.otherUser.id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedUserId(conv.otherUser.id);
                      navigate(`/messages/${conv.otherUser.id}`);
                    }}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                      isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 ring-2 ring-background">
                        <AvatarImage src={conv.otherUser.avatarUrl || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {getInitials(conv.otherUser.displayName || conv.otherUser.username)}
                        </AvatarFallback>
                      </Avatar>
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-primary-foreground font-bold ring-2 ring-background">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold truncate ${hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                          {conv.otherUser.displayName || conv.otherUser.username}
                        </span>
                        <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage.senderId === user?.id && (
                          <span className="text-muted-foreground">You: </span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedUserId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherUser.avatarUrl || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                    {getInitials(selectedConversation.otherUser.displayName || selectedConversation.otherUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {selectedConversation.otherUser.displayName || selectedConversation.otherUser.username}
                  </h2>
                  <p className="text-xs text-muted-foreground">@{selectedConversation.otherUser.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={selectedConversation.otherUser.avatarUrl || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-semibold">
                      {getInitials(selectedConversation.otherUser.displayName || selectedConversation.otherUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold mb-1">
                    {selectedConversation.otherUser.displayName || selectedConversation.otherUser.username}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Start your conversation with {selectedConversation.otherUser.displayName?.split(' ')[0] || selectedConversation.otherUser.username}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-muted px-3 py-1 rounded-full">
                          <span className="text-xs text-muted-foreground font-medium">{group.date}</span>
                        </div>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-2">
                        {group.messages.map((message, msgIndex) => {
                          const isOwn = message.senderId === user?.id;
                          const showAvatar = !isOwn && (
                            msgIndex === 0 ||
                            group.messages[msgIndex - 1]?.senderId !== message.senderId
                          );

                          return (
                            <div
                              key={message.id}
                              className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                              {!isOwn && (
                                <div className="w-8 flex-shrink-0">
                                  {showAvatar && (
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={selectedConversation.otherUser.avatarUrl || ''} />
                                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                        {getInitials(selectedConversation.otherUser.displayName || selectedConversation.otherUser.username)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )}

                              <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                <div
                                  className={`px-4 py-2.5 rounded-2xl ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground rounded-br-md'
                                      : 'bg-muted text-foreground rounded-bl-md'
                                  }`}
                                >
                                  <p className="break-words text-[15px] leading-relaxed">{message.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-[11px] text-muted-foreground">
                                    {format(new Date(message.createdAt), 'h:mm a')}
                                  </span>
                                  {isOwn && (
                                    message.isRead ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-muted-foreground" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-3">
                <Button type="button" variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!user?.id}
                    className="pr-12 py-6 rounded-full bg-muted/50 border-0"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full">
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!content.trim() || !user?.id || !selectedUserId}
                  className="rounded-full h-12 w-12 flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 bg-muted/20">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageCircle className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your Messages</h2>
            <p className="text-center max-w-sm">
              Select a conversation from the list or start a new one by visiting someone's profile
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
