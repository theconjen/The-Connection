import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlameIcon, ClockIcon, TrophyIcon, SlidersHorizontalIcon } from "lucide-react";

interface FeedFiltersProps {
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export default function FeedFilters({ onFilterChange, currentFilter }: FeedFiltersProps) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  return (
    <Card className="mb-6">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <Button
            variant={currentFilter === "popular" ? "secondary" : "ghost"}
            className={currentFilter === "popular" ? "bg-primary-50 text-primary" : "text-neutral-600"}
            onClick={() => onFilterChange("popular")}
          >
            <FlameIcon className="mr-2 h-4 w-4" />
            <span>Popular</span>
          </Button>
          
          <Button
            variant={currentFilter === "latest" ? "secondary" : "ghost"}
            className={currentFilter === "latest" ? "bg-primary-50 text-primary" : "text-neutral-600"}
            onClick={() => onFilterChange("latest")}
          >
            <ClockIcon className="mr-2 h-4 w-4" />
            <span>Latest</span>
          </Button>
          
          <Button
            variant={currentFilter === "top" ? "secondary" : "ghost"}
            className={`hidden md:flex ${currentFilter === "top" ? "bg-primary-50 text-primary" : "text-neutral-600"}`}
            onClick={() => onFilterChange("top")}
          >
            <TrophyIcon className="mr-2 h-4 w-4" />
            <span>Top</span>
          </Button>
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              className="text-neutral-600"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            >
              <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Filter</span>
            </Button>
          </div>
        </div>
        
        {isFilterMenuOpen && (
          <div className="mt-3 p-3 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 mb-2">Additional filters coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
