/*
  MESSAGES COMPONENT - The Connection App
  ----------------------------------------
  Instagram Direct-style messaging interface
  Styled with The Connection's design system
  
  DESIGN SYSTEM:
  - Primary: #0B132B (Deep Navy Blue)
  - Secondary: #222D99 (Rich Royal Blue)
  - Background: #F5F8FA (Soft White)
  - Text: #0D1829
  - Muted: #637083
  - Border: #D1D8DE
  
  FEATURES:
  - "Active Now" horizontal scroll
  - Message list with unread indicators
  - Native header with "New Message" action
  - Search bar
*/

import { 
  Search, 
  Edit, 
  Camera, 
  Video, 
  Plus,
  Users
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { useState } from "react";
import { MessageDetail } from "./MessageDetail";
import { useConversations } from "../queries/messages";
import { useAuth } from "../contexts/AuthContext";

// ============================================================================
// TYPES
// ============================================================================

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  isOnline?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Messages() {
  const [selectedChat, setSelectedChat] = useState<{ conversationId: number; otherUser: User } | null>(null);
  const { user: currentUser } = useAuth();
  const { data: conversations = [], isLoading } = useConversations();

  if (selectedChat) {
    return (
      <MessageDetail 
        onBack={() => setSelectedChat(null)} 
        conversationId={selectedChat.conversationId}
        otherUser={selectedChat.otherUser}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F8FA] lg:rounded-2xl lg:shadow-sm lg:border lg:border-[#D1D8DE] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#D1D8DE] bg-white lg:bg-white backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#0B132B] flex items-center gap-1">
            {currentUser?.username || 'Messages'}
            <span className="bg-[#222D99] w-2 h-2 rounded-full inline-block ml-1" title="Online"></span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#0B132B] hover:bg-[#F5F8FA]">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-[#0B132B] hover:bg-[#F5F8FA]">
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content Scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 py-3 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#637083]" />
            <Input 
              placeholder="Search messages" 
              className="pl-10 bg-[#F5F8FA] border-[#D1D8DE] h-10 text-sm rounded-xl focus:ring-[#222D99] focus:border-[#222D99]"
            />
          </div>
        </div>

        {/* Active Now */}
        <div className="py-4 bg-white border-b border-[#D1D8DE]">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex px-4 gap-4">
              {/* Your Note Bubble */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-dashed border-[#D1D8DE] p-0.5 bg-white">
                    <AvatarImage src={currentUser?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=222D99&color=fff&bold=true`} className="rounded-full" />
                    <AvatarFallback className="bg-[#222D99] text-white">
                      {currentUser?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 left-0 right-0 bg-white rounded-xl py-0.5 px-2 shadow-sm border border-[#D1D8DE] text-[10px] text-center truncate w-[70px] mx-auto text-[#637083]">
                    Note...
                  </div>
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
                    <div className="bg-[#222D99] w-4 h-4 rounded-full flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#637083] mt-1">Your Note</span>
              </div>

              {/* Active Users - show conversation participants */}
              {conversations.slice(0, 6).map((conv) => {
                const otherParticipant = conv.participants.find(p => p.id !== currentUser?.id);
                if (!otherParticipant) return null;
                
                return (
                  <div key={conv.id} className="flex flex-col items-center gap-1 cursor-pointer group">
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-2 ring-transparent group-hover:ring-[#222D99]/20 transition-all">
                        <AvatarImage src={otherParticipant.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username)}&background=0B132B&color=fff`} />
                        <AvatarFallback className="bg-[#0B132B] text-white">
                          {otherParticipant.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs text-[#0B132B] mt-1 w-[64px] text-center truncate">
                      {otherParticipant.full_name?.split(' ')[0] || otherParticipant.username}
                    </span>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* Messages List Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-[#F5F8FA]">
          <h2 className="text-sm font-semibold text-[#0B132B]">Messages</h2>
          <button className="text-xs text-[#222D99] font-medium hover:underline">
            Requests
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex flex-col bg-white pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-[#637083]">Loading conversations...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-sm text-[#637083] mb-2">No conversations yet</div>
              <div className="text-xs text-[#637083]">Start a new conversation to get started</div>
            </div>
          ) : (
            conversations.map((chat) => {
              const otherParticipant = chat.participants.find(p => p.id !== currentUser?.id);
              if (!otherParticipant) return null;

              return (
                <button 
                  key={chat.id}
                  onClick={() => setSelectedChat({ 
                    conversationId: chat.id, 
                    otherUser: {
                      id: otherParticipant.id,
                      name: otherParticipant.full_name || otherParticipant.username,
                      username: otherParticipant.username,
                      avatar: otherParticipant.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username)}&background=0B132B&color=fff`,
                      isOnline: false
                    }
                  })}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F8FA] transition-colors active:bg-[#E8EDF2] w-full text-left border-b border-[#F5F8FA] last:border-b-0"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={otherParticipant.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant.username)}&background=0B132B&color=fff`} />
                      <AvatarFallback className="bg-[#0B132B] text-white text-sm">
                        {otherParticipant.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm text-[#0B132B] truncate pr-2 ${chat.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                        {otherParticipant.full_name || otherParticipant.username}
                      </span>
                      <span className={`text-[11px] shrink-0 ${chat.unreadCount > 0 ? 'text-[#0B132B] font-semibold' : 'text-[#637083]'}`}>
                        {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleDateString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        }) : 'New'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <p className={`text-sm truncate pr-4 ${
                        chat.unreadCount > 0 ? 'text-[#0B132B] font-medium' : 'text-[#637083]'
                      }`}>
                        {chat.lastMessage?.content || 'Start a conversation'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <div className="w-2.5 h-2.5 bg-[#222D99] rounded-full ml-auto shrink-0"></div>
                      )}
                    </div>
                  </div>

                  {/* Camera icon */}
                  <div className="shrink-0 text-[#637083] hover:text-[#0B132B] transition-colors">
                    <Camera className="w-5 h-5 stroke-[1.5]" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
