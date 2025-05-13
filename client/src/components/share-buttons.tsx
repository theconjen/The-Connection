import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  EmailShareButton,
  RedditShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailIcon,
  RedditIcon,
} from "react-share";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  // Convert relative URLs to absolute
  const getAbsoluteUrl = (relativeUrl: string) => {
    const baseUrl = window.location.origin;
    return baseUrl + relativeUrl;
  };

  const shareUrl = getAbsoluteUrl(url);
  const shareTitle = `${title} | The Connection`;

  return (
    <div className="flex space-x-3 justify-center">
      <FacebookShareButton url={shareUrl}>
        <FacebookIcon size={32} round />
      </FacebookShareButton>
      
      <TwitterShareButton url={shareUrl} title={shareTitle}>
        <TwitterIcon size={32} round />
      </TwitterShareButton>
      
      <RedditShareButton url={shareUrl} title={shareTitle}>
        <RedditIcon size={32} round />
      </RedditShareButton>
      
      <WhatsappShareButton url={shareUrl} title={shareTitle}>
        <WhatsappIcon size={32} round />
      </WhatsappShareButton>
      
      <EmailShareButton url={shareUrl} subject={shareTitle} body={`Check out this post on The Connection: ${shareUrl}`}>
        <EmailIcon size={32} round />
      </EmailShareButton>
    </div>
  );
}
