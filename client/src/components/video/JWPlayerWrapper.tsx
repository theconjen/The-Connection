/**
 * JW Player Wrapper - Video player component using JW Player with Mux HLS streams
 *
 * Features:
 * - HLS playback via JW Player
 * - Mux Data analytics integration
 * - Ads support (enabled via ads.enabled from playback endpoint)
 * - Responsive design
 *
 * Note: JW Player script must be loaded in the HTML head
 */

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import initJWPlayerMux from "@mux/mux-data-jwplayer";

declare global {
  interface Window {
    jwplayer: any;
  }
}

interface PlaybackData {
  sermon: {
    id: number;
    title: string;
    description?: string | null;
    speaker?: string | null;
    sermonDate?: string | null;
    series?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
  };
  playback: {
    hlsUrl: string;
    posterUrl?: string | null;
  };
  ads: {
    enabled: boolean;
    tagUrl?: string | null;
  };
}

interface JWPlayerWrapperProps {
  sermonId: number;
  className?: string;
  autoPlay?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export function JWPlayerWrapper({
  sermonId,
  className = "",
  autoPlay = false,
  onReady,
  onError,
}: JWPlayerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackData | null>(null);

  // Fetch playback data from API
  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        const response = await fetch(`/api/sermons/${sermonId}/playback`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Video not available");
          }
          throw new Error("Failed to load video");
        }

        const data = await response.json();
        setPlaybackData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
      }
    };

    fetchPlayback();
  }, [sermonId, onError]);

  // Initialize JW Player when data is loaded
  useEffect(() => {
    if (!playbackData || !containerRef.current) return;

    // Check if JW Player is available
    if (!window.jwplayer) {
      setError("Video player not available");
      setIsLoading(false);
      return;
    }

    const containerId = `jwplayer-${sermonId}`;
    containerRef.current.id = containerId;

    try {
      // Capture player init time for Mux Data analytics
      const playerInitTime = initJWPlayerMux.utils.now();

      // Build player config
      const config: any = {
        file: playbackData.playback.hlsUrl,
        image: playbackData.playback.posterUrl || undefined,
        title: playbackData.sermon.title,
        description: playbackData.sermon.description || undefined,
        autostart: autoPlay,
        width: "100%",
        aspectratio: "16:9",
        stretching: "uniform",
        controls: true,
        displaytitle: false,
        playbackRateControls: true,
        mute: false,
        volume: 80,
      };

      // Add advertising if enabled
      if (playbackData.ads.enabled && playbackData.ads.tagUrl) {
        config.advertising = {
          client: "vast",
          tag: playbackData.ads.tagUrl,
          skipoffset: 5,
          admessage: "Ad: Skip in xx seconds",
          cuetext: "Advertisement",
        };
      }

      // Initialize player
      playerRef.current = window.jwplayer(containerId).setup(config);

      // Initialize Mux Data for analytics
      const muxDataEnvKey = import.meta.env.VITE_MUX_DATA_ENV_KEY;
      if (muxDataEnvKey) {
        initJWPlayerMux(playerRef.current, {
          debug: import.meta.env.DEV,
          data: {
            env_key: muxDataEnvKey,
            player_name: "JW Player Web",
            player_init_time: playerInitTime,
            player_version: window.jwplayer?.version || "unknown",
            video_id: String(sermonId),
            video_title: playbackData.sermon.title,
            video_series: playbackData.sermon.series || undefined,
          },
        });
      }

      // Event handlers
      playerRef.current.on("ready", () => {
        setIsLoading(false);
        onReady?.();
      });

      playerRef.current.on("error", (e: any) => {
        setError(e.message || "Playback error");
        setIsLoading(false);
        onError?.(new Error(e.message || "Playback error"));
      });

      playerRef.current.on("setupError", (e: any) => {
        setError(e.message || "Player setup error");
        setIsLoading(false);
        onError?.(new Error(e.message || "Player setup error"));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Player initialization failed";
      setError(message);
      setIsLoading(false);
      onError?.(err instanceof Error ? err : new Error(message));
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.remove();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [playbackData, sermonId, autoPlay, onReady, onError]);

  if (error) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center aspect-video ${className}`}>
        <div className="text-center p-4">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />

      {/* Sponsored indicator for ads */}
      {playbackData?.ads.enabled && !isLoading && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          Sponsored
        </div>
      )}
    </div>
  );
}

/**
 * Fallback player using native HLS.js for browsers without JW Player
 * Use this if JW Player license is not available
 */
export function HLSPlayerFallback({
  sermonId,
  className = "",
  autoPlay = false,
}: Omit<JWPlayerWrapperProps, "onReady" | "onError">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackData | null>(null);

  // Fetch playback data
  useEffect(() => {
    const fetchPlayback = async () => {
      try {
        const response = await fetch(`/api/sermons/${sermonId}/playback`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Video not available");
        }

        const data = await response.json();
        setPlaybackData(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    };

    fetchPlayback();
  }, [sermonId]);

  // Load HLS.js and initialize player
  useEffect(() => {
    if (!playbackData || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = playbackData.playback.hlsUrl;

    // Check for native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return;
    }

    // Load HLS.js dynamically
    const loadHls = async () => {
      try {
        const Hls = (await import("hls.js")).default;

        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setError("Playback error");
            }
          });

          return () => {
            hls.destroy();
          };
        } else {
          setError("HLS playback not supported");
        }
      } catch {
        setError("Failed to load video player");
      }
    };

    loadHls();
  }, [playbackData]);

  if (error) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center aspect-video ${className}`}>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className={`aspect-video ${className}`} />;
  }

  return (
    <div className={`relative aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay={autoPlay}
        poster={playbackData?.playback.posterUrl || undefined}
        playsInline
      />

      {playbackData?.ads.enabled && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          Sponsored
        </div>
      )}
    </div>
  );
}

export default JWPlayerWrapper;
