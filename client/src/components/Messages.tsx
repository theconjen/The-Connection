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
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useState } from "react";
import { MessageDetail } from "./MessageDetail";

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

interface Conversation {
  id: number;
  user: User;
  lastMessage: string;
  time: string;
  unread: boolean;
  isTyping: boolean;
  isGroup?: boolean;
  groupMembers?: User[];
}

// ============================================================================
// SEED DATA - Based on The Connection's promo users
// ============================================================================

// Current logged-in user (for display purposes)
const currentUser: User = {
  id: 0,
  name: "Janelle",
  username: "janelle_faith",
  avatar: "https://ui-avatars.com/api/?name=Janelle&background=222D99&color=fff&bold=true"
};

// Real user accounts from The Connection seed data
const appUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    username: "sarah_yp",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=6366f1&color=fff",
    isOnline: true
  },
  {
    id: 2,
    name: "David Chen",
    username: "david_apologetics",
    avatar: "https://ui-avatars.com/api/?name=David+Chen&background=8b5cf6&color=fff",
    isOnline: true
  },
  {
    id: 3,
    name: "Maria Rodriguez",
    username: "maria_missionary",
    avatar: "https://ui-avatars.com/api/?name=Maria+Rodriguez&background=ec4899&color=fff",
    isOnline: false
  },
  {
    id: 4,
    name: "Pastor James",
    username: "pastor_james",
    avatar: "https://ui-avatars.com/api/?name=Pastor+James&background=0B132B&color=fff",
    isOnline: true
  },
  {
    id: 5,
    name: "Grace Kim",
    username: "grace_worship",
    avatar: "https://ui-avatars.com/api/?name=Grace+Kim&background=10b981&color=fff",
    isOnline: true
  },
  {
    id: 6,
    name: "Michael Torres",
    username: "mike_t",
    avatar: "https://ui-avatars.com/api/?name=Michael+Torres&background=f59e0b&color=fff",
    isOnline: false
  }
];

// Active users (online now)
const activeUsers = appUsers.filter(user => user.isOnline);

// Conversations with real user data
const conversations: Conversation[] = [
  {
    id: 1,
    user: appUsers[0], // Sarah Johnson
    lastMessage: "See you at Bible study tonight! 🙏",
    time: "2m",
    unread: true,
    isTyping: false
  },
  {
    id: 2,
    user: {
      id: 100,
      name: "Youth Ministry",
      username: "youth_ministry",
      avatar: "https://ui-avatars.com/api/?name=Youth+Ministry&background=222D99&color=fff"
    },
    lastMessage: "David: Just posted the retreat photos!",
    time: "15m",
    unread: true,
    isTyping: false,
    isGroup: true,
    groupMembers: [appUsers[0], appUsers[1], appUsers[4]]
  },
  {
    id: 3,
    user: appUsers[3], // Pastor James
    lastMessage: "Can we chat about the sermon series?",
    time: "1h",
    unread: false,
    isTyping: false
  },
  {
    id: 4,
    user: appUsers[1], // David Chen
    lastMessage: "Have you read the new Mere Christianity study guide?",
    time: "3h",
    unread: false,
    isTyping: false
  },
  {
    id: 5,
    user: appUsers[4], // Grace Kim
    lastMessage: "Typing...",
    time: "Now",
    unread: false,
    isTyping: true
  },
  {
    id: 6,
    user: {
      id: 101,
      name: "Worship Team",
      username: "worship_team",
      avatar: "https://ui-avatars.com/api/?name=Worship+Team&background=0B132B&color=fff"
    },
    lastMessage: "Setlist for Sunday is finalized!",
    time: "1d",
    unread: false,
    isTyping: false,
    isGroup: true,
    groupMembers: [appUsers[4], appUsers[5]]
  },
  {
    id: 7,
    user: appUsers[2], // Maria Rodriguez
    lastMessage: "Praying for you from Colombia 🇨🇴",
    time: "2d",
    unread: false,
    isTyping: false
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export function Messages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  if (selectedChat) {
    const conversation = conversations.find(c => c.id === selectedChat);
    return (
      <MessageDetail 
        onBack={() => setSelectedChat(null)} 
        user={conversation?.user}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F8FA] lg:rounded-2xl lg:shadow-sm lg:border lg:border-[#D1D8DE] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#D1D8DE] bg-white lg:bg-white backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#0B132B] flex items-center gap-1">
            {currentUser.username}
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
                    <AvatarImage src={currentUser.avatar} className="rounded-full" />
                    <AvatarFallback className="bg-[#222D99] text-white">
                      {currentUser.name[0]}
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

              {/* Active Users */}
              {activeUsers.map((user) => (
                <div key={user.id} className="flex flex-col items-center gap-1 cursor-pointer group">
                  <div className="relative">
                    <Avatar className="w-16 h-16 ring-2 ring-transparent group-hover:ring-[#222D99]/20 transition-all">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-[#0B132B] text-white">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-[#10B981] rounded-full border-[3px] border-white"></div>
                  </div>
                  <span className="text-xs text-[#0B132B] mt-1 w-[64px] text-center truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </div>
              ))}
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
          {conversations.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F8FA] transition-colors active:bg-[#E8EDF2] w-full text-left border-b border-[#F5F8FA] last:border-b-0"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={chat.user.avatar} />
                  <AvatarFallback className="bg-[#0B132B] text-white text-sm">
                    {chat.user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {/* Group indicator - show additional member */}
                {chat.isGroup && chat.groupMembers && chat.groupMembers.length > 0 && (
                  <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                    <div className="w-5 h-5 bg-[#222D99] rounded-full flex items-center justify-center">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                {/* Online indicator for non-groups */}
                {!chat.isGroup && chat.user.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className={`text-sm text-[#0B132B] truncate pr-2 ${chat.unread ? 'font-bold' : 'font-medium'}`}>
                    {chat.user.name}
                  </span>
                  <span className={`text-[11px] shrink-0 ${chat.unread ? 'text-[#0B132B] font-semibold' : 'text-[#637083]'}`}>
                    {chat.time}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <p className={`text-sm truncate pr-4 ${
                    chat.unread ? 'text-[#0B132B] font-medium' : 
                    chat.isTyping ? 'text-[#222D99] font-medium italic' : 'text-[#637083]'
                  }`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread && (
                    <div className="w-2.5 h-2.5 bg-[#222D99] rounded-full ml-auto shrink-0"></div>
                  )}
                </div>
              </div>

              {/* Camera icon */}
              <div className="shrink-0 text-[#637083] hover:text-[#0B132B] transition-colors">
                <Camera className="w-5 h-5 stroke-[1.5]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
