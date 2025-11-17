import { User } from "@connection/shared/schema";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Link } from "wouter";

interface UserMenuProps {
  user: User;
}

export default function UserMenu({ user }: UserMenuProps) {
  const auth = useAuth() as AuthContextType;
  
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      auth.logoutMutation.mutate();
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full h-9 w-9 p-0 border-2 border-transparent hover:border-primary/10 transition-colors active-scale touch-target">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl || ''} alt={user.username} />
            <AvatarFallback className="bg-primary/5 text-primary font-medium">{getInitials(user.username)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || ''} alt={user.username} />
              <AvatarFallback className="bg-primary/5 text-primary font-medium">{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Link href="/profile">
            <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target">
              Profile
            </DropdownMenuItem>
          </Link>
          <Link href="/dms">
            <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target">
              Messages
            </DropdownMenuItem>
          </Link>
          <Link href="/settings">
            <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target">
              Settings
            </DropdownMenuItem>
          </Link>
          <Link href="/prayer-requests">
            <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target">
              My Prayer Requests
            </DropdownMenuItem>
          </Link>
          <Link href="/messages">
            <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target">
              Direct Messages
            </DropdownMenuItem>
          </Link>
          {user.isAdmin && (
            <Link href="/admin">
              <DropdownMenuItem className="cursor-pointer rounded-md py-2.5 active-scale touch-target font-medium text-primary">
                Admin Dashboard
              </DropdownMenuItem>
            </Link>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-red-500 focus:text-red-500 cursor-pointer rounded-md py-2.5 active-scale touch-target"
            disabled={auth.logoutMutation.isPending}
          >
            {auth.logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}