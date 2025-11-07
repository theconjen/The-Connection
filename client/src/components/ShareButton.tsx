import { Share } from '@capacitor/share';
import { useState } from 'react';

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
}

export default function ShareButton({ url, title, text }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Try native Capacitor share first
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share this content',
      });
    } catch (error) {
      // Fallback to web share API
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text,
            url,
          });
        } catch (webError) {
          // Fallback to clipboard
          navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
          alert('Link copied to clipboard!');
        }
      } else {
        // Final fallback
        navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        alert('Link copied to clipboard!');
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isSharing ? 'Sharing...' : 'Share'}
    </button>
  );
}