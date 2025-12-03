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
            variant="ghost"
            className={`${currentFilter === "popular" ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground"} hover:bg-muted`}
            onClick={() => onFilterChange("popular")}
          >
            <FlameIcon className="mr-2 h-4 w-4" />
            <span>Popular</span>
          </Button>

          <Button
            variant="ghost"
            className={`${currentFilter === "latest" ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground"} hover:bg-muted`}
            onClick={() => onFilterChange("latest")}
          >
            <ClockIcon className="mr-2 h-4 w-4" />
            <span>Latest</span>
          </Button>

          <Button
            variant="ghost"
            className={`hidden md:flex ${currentFilter === "top" ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground"} hover:bg-muted`}
            onClick={() => onFilterChange("top")}
          >
            <TrophyIcon className="mr-2 h-4 w-4" />
            <span>Top</span>
          </Button>
          
          <div className="ml-auto">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-muted"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            >
              <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Filter</span>
            </Button>
          </div>
        </div>

        {isFilterMenuOpen && (
          <div className="mt-3 p-3 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Additional filters coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
