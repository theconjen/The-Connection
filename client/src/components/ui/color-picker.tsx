import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorOption {
  name: string;
  label: string;
  value: string;
  bgClass: string;
  previewClass: string;
}

const availableColors: ColorOption[] = [
  {
    name: "blue",
    label: "Blue",
    value: "#3b82f6",
    bgClass: "bg-gradient-to-br from-blue-50 to-blue-100",
    previewClass: "bg-blue-500",
  },
  {
    name: "pink",
    label: "Pink",
    value: "#ec4899",
    bgClass: "bg-gradient-to-br from-pink-50 to-pink-100",
    previewClass: "bg-pink-500",
  },
  {
    name: "emerald",
    label: "Green",
    value: "#10b981",
    bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    previewClass: "bg-emerald-500",
  },
  {
    name: "amber",
    label: "Amber",
    value: "#f59e0b",
    bgClass: "bg-gradient-to-br from-amber-50 to-amber-100",
    previewClass: "bg-amber-500",
  },
  {
    name: "purple",
    label: "Purple",
    value: "#8b5cf6",
    bgClass: "bg-gradient-to-br from-purple-50 to-purple-100",
    previewClass: "bg-purple-500",
  },
  {
    name: "indigo",
    label: "Indigo",
    value: "#6366f1",
    bgClass: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    previewClass: "bg-indigo-500",
  },
  {
    name: "green",
    label: "Forest",
    value: "#22c55e",
    bgClass: "bg-gradient-to-br from-green-50 to-green-100",
    previewClass: "bg-green-500",
  },
  {
    name: "orange",
    label: "Orange",
    value: "#f97316",
    bgClass: "bg-gradient-to-br from-orange-50 to-orange-100",
    previewClass: "bg-orange-500",
  },
  {
    name: "teal",
    label: "Teal",
    value: "#14b8a6",
    bgClass: "bg-gradient-to-br from-teal-50 to-teal-100",
    previewClass: "bg-teal-500",
  },
  {
    name: "red",
    label: "Red",
    value: "#ef4444",
    bgClass: "bg-gradient-to-br from-red-50 to-red-100",
    previewClass: "bg-red-500",
  },
  {
    name: "rose",
    label: "Rose",
    value: "#f43f5e",
    bgClass: "bg-gradient-to-br from-rose-50 to-rose-100",
    previewClass: "bg-rose-500",
  },
  {
    name: "violet",
    label: "Violet",
    value: "#7c3aed",
    bgClass: "bg-gradient-to-br from-violet-50 to-violet-100",
    previewClass: "bg-violet-500",
  },
];

interface ColorPickerProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ value = "#3b82f6", onValueChange, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedColor = availableColors.find((color) => color.value === value) || availableColors[0];

  const handleSelect = (colorValue: string) => {
    onValueChange?.(colorValue);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>Community Color</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
            data-testid="button-color-picker"
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border border-gray-300",
                  selectedColor.previewClass
                )}
              />
              <span>{selectedColor.label}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="grid grid-cols-4 gap-2 p-4">
            {availableColors.map((color) => (
              <Button
                key={color.name}
                variant="ghost"
                className={cn(
                  "h-14 flex flex-col gap-1 relative",
                  value === color.value && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => handleSelect(color.value)}
                data-testid={`color-option-${color.name}`}
              >
                {value === color.value && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-primary bg-white rounded-full" />
                )}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg border border-gray-200",
                    color.previewClass
                  )}
                />
                <span className="text-xs text-center">{color.label}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground">
        Choose a color theme for your community
      </p>
    </div>
  );
}