import { useState, useEffect } from "react";
import { getDailyQuote, getRandomQuote, type DailyQuote } from "@shared/quotes";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeBannerProps {
  className?: string;
}

export default function WelcomeBanner({ className = "" }: WelcomeBannerProps) {
  const { user } = useAuth();
  const [quote, setQuote] = useState<DailyQuote>(getDailyQuote());
  const [timeOfDay, setTimeOfDay] = useState<string>("");
  
  useEffect(() => {
    // Set the greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay("morning");
    } else if (hour < 18) {
      setTimeOfDay("afternoon");
    } else {
      setTimeOfDay("evening");
    }
  }, []);
  
  const changeQuote = () => {
    setQuote(getRandomQuote());
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Good {timeOfDay}, <span className="text-gradient">{user ? user.username : "Friend"}</span>!
            </h2>
            <p className="text-xs text-muted-foreground">
              Welcome to The Connection
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={changeQuote}
            className="flex gap-1 items-center h-7 px-2"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="text-xs">New Quote</span>
          </Button>
        </div>
        
        <div className="bg-secondary/5 p-2 rounded-lg relative mt-2 text-sm">
          <blockquote className="pl-4 pr-2 py-1 text-sm italic">
            "{quote.text}"
          </blockquote>
          <footer className="text-right text-xs text-muted-foreground pr-2">
            — {quote.author} {quote.reference && <span className="opacity-75">({quote.reference})</span>}
          </footer>
        </div>
      </CardContent>
    </Card>
  );
}