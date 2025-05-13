import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  User as UserIcon,
  Users,
  Bookmark,
  Settings,
  LogOut,
  ChevronDown,
  Heart,
  PenTool,
  Bell
} from "lucide-react";

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Function to generate random avatar background based on username
  const getAvatarBackground = (username: string) => {
    const colors = [
      "bg-primary/20 text-primary",
      "bg-secondary/30 text-secondary-foreground",
      "bg-accent/20 text-accent-foreground",
      "bg-pink-100 text-pink-700",
      "bg-violet-100 text-violet-700"
    ];
    
    // Use a simple hash of the username to pick a consistent color
    const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-1 flex items-center rounded-full gap-2 hover:bg-primary/5">
          <Avatar className={`w-8 h-8 ${getAvatarBackground(user.username)}`}>
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : (
              <AvatarFallback className="font-semibold">{getInitials(user.username)}</AvatarFallback>
            )}
          </Avatar>
          <span className="hidden md:inline-block font-medium">{user.displayName || user.username}</span>
          <ChevronDown className="text-muted-foreground h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-secondary/20 p-2">
        <DropdownMenuLabel className="flex items-center gap-3 pb-2">
          <Avatar className={`w-10 h-10 ${getAvatarBackground(user.username)}`}>
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : (
              <AvatarFallback className="font-semibold">{getInitials(user.username)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{user.displayName || user.username}</span>
            <span className="text-xs text-muted-foreground">@{user.username}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-secondary/10" />
        
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <UserIcon className="mr-3 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/submit">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <PenTool className="mr-3 h-4 w-4" />
            <span>Create Post</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/groups">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <Users className="mr-3 h-4 w-4" />
            <span>My Communities</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/saved">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <Bookmark className="mr-3 h-4 w-4" />
            <span>Saved Posts</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/notifications">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <Bell className="mr-3 h-4 w-4" />
            <span>Notifications</span>
            <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-0.5 flex items-center justify-center">3</span>
          </DropdownMenuItem>
        </Link>
        
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 hover:text-primary rounded-md my-1 py-2">
            <Settings className="mr-3 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="bg-secondary/10" />
        
        <DropdownMenuItem 
          className="cursor-pointer text-destructive hover:bg-destructive/5 hover:text-destructive focus:text-destructive rounded-md my-1 py-2"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
