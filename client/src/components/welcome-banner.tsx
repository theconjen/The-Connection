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
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">
              Good {timeOfDay}, <span className="text-gradient">{user ? user.username : "Friend"}</span>!
            </h2>
            <p className="text-muted-foreground">
              Welcome to your spiritual journey on The Connection
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={changeQuote}
            className="flex gap-2 items-center"
          >
            <RefreshCw className="h-4 w-4" />
            New Quote
          </Button>
        </div>
        
        <div className="bg-secondary/10 p-4 rounded-lg relative mt-4">
          <div className="text-4xl text-primary/20 absolute top-2 left-4 font-serif">"</div>
          <blockquote className="pl-6 pr-4 py-2 text-lg italic">
            {quote.text}
          </blockquote>
          <div className="text-4xl text-primary/20 absolute bottom-2 right-4 font-serif">"</div>
          <footer className="text-right text-sm mt-2 text-muted-foreground pr-4">
            — {quote.author} {quote.reference && <span className="opacity-75">({quote.reference})</span>}
          </footer>
        </div>
      </CardContent>
    </Card>
  );
}