import { useState, useEffect } from "react";
import { getDailyQuote, getRandomQuote, type DailyQuote } from "@shared/quotes";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "./ui/card";

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
    <Card className={`overflow-hidden  border/40 shadow-sm ${className}`}>
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">
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
            className="flex gap-1 items-center h-7 px-2 -mr-1 hover:bg-secondary/10 active-scale touch-target"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="text-xs">New Quote</span>
          </Button>
        </div>
        
        <div className="bg-secondary/5 p-2 rounded-lg relative mt-2 border  border/10">
          <blockquote className="pl-3 pr-2 py-0.5 text-xs sm:text-sm italic">
            "{quote.text}"
          </blockquote>
          <footer className="text-right text-xs text-muted-foreground pr-2 pt-1">
            — {quote.author} {quote.reference && <span className="opacity-75 text-[10px]">({quote.reference})</span>}
          </footer>
        </div>
      </CardContent>
    </Card>
  );
}