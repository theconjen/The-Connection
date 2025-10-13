import { Share } from "@capacitor/share";
import { useCallback, type ReactNode } from "react";

type ShareOptions = {
  url?: string;
  title?: string;
  text?: string;
  dialogTitle?: string;
};

type ShareButtonProps = ShareOptions & {
  children?: ReactNode;
  className?: string;
  fallback?: () => Promise<void> | void;
};

async function triggerWebShare(options: ShareOptions) {
  if (typeof navigator === "undefined") return;
  if (navigator.share) {
    await navigator.share(options);
    return;
  }

  if (navigator.clipboard && options.url) {
    await navigator.clipboard.writeText(options.url);
  }
}

export function ShareButton({
  children = "Share",
  className,
  fallback,
  url,
  title = "The Connection",
  text = "",
  dialogTitle,
}: ShareButtonProps) {
  const handleShare = useCallback(async () => {
    const payload = {
      title,
      text,
      url: url ?? (typeof window !== "undefined" ? window.location.href : undefined),
      dialogTitle: dialogTitle ?? "Share",
    } satisfies ShareOptions;

    try {
      await Share.share(payload);
    } catch (err) {
      if (fallback) {
        await fallback();
        return;
      }

      try {
        await triggerWebShare(payload);
      } catch (webErr) {
        console.warn("Share not available", { err, webErr });
      }
    }
  }, [dialogTitle, fallback, text, title, url]);

  return (
    <button type="button" onClick={handleShare} className={className}>
      {children}
    </button>
  );
}
