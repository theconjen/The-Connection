import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import {
  Users,
  BookOpen,
  Heart,
  Music,
  Camera,
  Coffee,
  Globe,
  Star,
  Home,
  MessageCircle,
  Calendar,
  Map,
  Shield,
  Zap,
  Target,
  Activity,
  Briefcase,
  Palette,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconOption {
  name: string;
  label: string;
  icon: React.ReactElement;
}

const availableIcons: IconOption[] = [
  { name: "users", label: "Users", icon: <Users className="h-5 w-5" /> },
  { name: "bookopen", label: "Book", icon: <BookOpen className="h-5 w-5" /> },
  { name: "heart", label: "Heart", icon: <Heart className="h-5 w-5" /> },
  { name: "music", label: "Music", icon: <Music className="h-5 w-5" /> },
  { name: "camera", label: "Camera", icon: <Camera className="h-5 w-5" /> },
  { name: "coffee", label: "Coffee", icon: <Coffee className="h-5 w-5" /> },
  { name: "globe", label: "Globe", icon: <Globe className="h-5 w-5" /> },
  { name: "star", label: "Star", icon: <Star className="h-5 w-5" /> },
  { name: "home", label: "Home", icon: <Home className="h-5 w-5" /> },
  { name: "messagecircle", label: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
  { name: "calendar", label: "Calendar", icon: <Calendar className="h-5 w-5" /> },
  { name: "map", label: "Map", icon: <Map className="h-5 w-5" /> },
  { name: "shield", label: "Shield", icon: <Shield className="h-5 w-5" /> },
  { name: "zap", label: "Lightning", icon: <Zap className="h-5 w-5" /> },
  { name: "target", label: "Target", icon: <Target className="h-5 w-5" /> },
  { name: "activity", label: "Activity", icon: <Activity className="h-5 w-5" /> },
  { name: "briefcase", label: "Business", icon: <Briefcase className="h-5 w-5" /> },
  { name: "palette", label: "Art", icon: <Palette className="h-5 w-5" /> },
  { name: "graduationcap", label: "Education", icon: <GraduationCap className="h-5 w-5" /> },
];

interface IconPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function IconPicker({ value = "users", onValueChange, disabled }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIcon = availableIcons.find((icon) => icon.name === value) || availableIcons[0];

  const handleSelect = (iconName: string) => {
    onValueChange?.(iconName);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>Community Icon</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
            data-testid="button-icon-picker"
          >
            <div className="flex items-center gap-2">
              {selectedIcon.icon}
              <span>{selectedIcon.label}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="grid grid-cols-4 gap-2 p-4">
            {availableIcons.map((icon) => (
              <Button
                key={icon.name}
                variant="ghost"
                className={cn(
                  "h-14 flex flex-col gap-1 relative",
                  value === icon.name && "bg-primary/10 text-primary"
                )}
                onClick={() => handleSelect(icon.name)}
                data-testid={`icon-option-${icon.name}`}
              >
                {value === icon.name && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                )}
                {icon.icon}
                <span className="text-xs text-center">{icon.label}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">
        Choose an icon that represents your community
      </p>
    </div>
  );
}