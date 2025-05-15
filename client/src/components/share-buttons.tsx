import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  RedditShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
  RedditIcon,
  LinkedinIcon,
  TelegramIcon,
} from "react-share";

interface ShareButtonsProps {
  url: string;
  title: string;
  large?: boolean;
}

export default function ShareButtons({ url, title, large = false }: ShareButtonsProps) {
  // Convert relative URLs to absolute
  const getAbsoluteUrl = (relativeUrl: string) => {
    const baseUrl = window.location.origin;
    return relativeUrl.startsWith("http") ? relativeUrl : baseUrl + relativeUrl;
  };

  const shareUrl = getAbsoluteUrl(url);
  const shareTitle = `${title} | The Connection`;
  const iconSize = large ? 48 : 32;
  
  // Mobile optimized with larger buttons and grid layout when large=true
  return (
    <div className={`${large 
      ? "grid grid-cols-3 gap-4 justify-items-center" 
      : "flex space-x-3 justify-center"}`}
    >
      <FacebookShareButton url={shareUrl} className="focus:outline-none">
        <FacebookIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">Facebook</div>}
      </FacebookShareButton>
      
      <TwitterShareButton url={shareUrl} title={shareTitle} className="focus:outline-none">
        <TwitterIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">Twitter</div>}
      </TwitterShareButton>
      
      <WhatsappShareButton url={shareUrl} title={shareTitle} className="focus:outline-none">
        <WhatsappIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">WhatsApp</div>}
      </WhatsappShareButton>
      
      <TelegramShareButton url={shareUrl} title={shareTitle} className="focus:outline-none">
        <TelegramIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">Telegram</div>}
      </TelegramShareButton>
      
      <LinkedinShareButton url={shareUrl} title={shareTitle} className="focus:outline-none">
        <LinkedinIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">LinkedIn</div>}
      </LinkedinShareButton>
      
      <RedditShareButton url={shareUrl} title={shareTitle} className="focus:outline-none">
        <RedditIcon size={iconSize} round />
        {large && <div className="text-xs mt-1 text-center">Reddit</div>}
      </RedditShareButton>
      
      {large && (
        <EmailShareButton 
          url={shareUrl} 
          subject={shareTitle} 
          body={`Check out this post on The Connection: ${shareUrl}`}
          className="focus:outline-none"
        >
          <EmailIcon size={iconSize} round />
          <div className="text-xs mt-1 text-center">Email</div>
        </EmailShareButton>
      )}
      
      {!large && (
        <EmailShareButton 
          url={shareUrl} 
          subject={shareTitle} 
          body={`Check out this post on The Connection: ${shareUrl}`}
          className="focus:outline-none"
        >
          <EmailIcon size={iconSize} round />
        </EmailShareButton>
      )}
    </div>
  );
}
