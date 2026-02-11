/**
 * MuxJWPlayer - React Native wrapper for JW Player with Mux Stats
 *
 * Uses native JW Player SDK on BOTH iOS and Android for CSAI ad support.
 * The native view manager (MuxJWPlayerView) is registered by the withMuxJWPlayer config plugin.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  requireNativeComponent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Text,
} from 'react-native';
import Constants from 'expo-constants';

// Props for the native view (iOS and Android)
interface NativePlayerProps {
  hlsUrl: string;
  posterUrl?: string;
  autostart?: boolean;
  muxEnvKey?: string;
  videoId?: string;
  videoTitle?: string;
  videoSeries?: string;
  videoDuration?: number;
  viewerUserId?: string;
  adTagUrl?: string; // CSAI ad tag URL when ads are enabled
  onPlayerReady?: (event: NativeSyntheticEvent<{ playerId: string }>) => void;
  onPlayerError?: (event: NativeSyntheticEvent<{ error: string; code?: number }>) => void;
  onPlaybackStateChange?: (event: NativeSyntheticEvent<{ state: string }>) => void;
  onAdEvent?: (event: NativeSyntheticEvent<{ event: string }>) => void;
  style?: any;
}

// Native component - works on both iOS and Android
const NativeMuxJWPlayerView = requireNativeComponent<NativePlayerProps>('MuxJWPlayerView');

// Public props
export interface MuxJWPlayerProps {
  hlsUrl: string;
  posterUrl?: string;
  autoPlay?: boolean;
  videoId: string;
  videoTitle: string;
  videoSeries?: string;
  videoDuration?: number;
  viewerUserId?: string;
  adsEnabled?: boolean;
  adTagUrl?: string; // CSAI ad tag URL
  style?: any;
  onReady?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'playing' | 'paused' | 'complete' | 'buffering') => void;
  onAdEvent?: (event: 'impression' | 'started' | 'complete' | 'clicked' | 'skipped') => void;
}

/**
 * Cross-platform video player with Mux analytics and CSAI ad support
 *
 * Uses native JW Player SDK on both iOS and Android.
 * When adsEnabled=true and adTagUrl is provided, displays pre-roll ads.
 */
export function MuxJWPlayer({
  hlsUrl,
  posterUrl,
  autoPlay = false,
  videoId,
  videoTitle,
  videoSeries,
  videoDuration,
  viewerUserId,
  adsEnabled = false,
  adTagUrl,
  style,
  onReady,
  onError,
  onStateChange,
  onAdEvent,
}: MuxJWPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get Mux environment key from app config
  const muxEnvKey = Constants.expoConfig?.extra?.muxDataEnvKey || '';

  const handleReady = useCallback((event: NativeSyntheticEvent<{ playerId: string }>) => {
    setIsLoading(false);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback((event: NativeSyntheticEvent<{ error: string; code?: number }>) => {
    setIsLoading(false);
    setError(event.nativeEvent.error);
    onError?.(event.nativeEvent.error);
  }, [onError]);

  const handleStateChange = useCallback((event: NativeSyntheticEvent<{ state: string }>) => {
    const state = event.nativeEvent.state as 'playing' | 'paused' | 'complete' | 'buffering';
    onStateChange?.(state);
  }, [onStateChange]);

  const handleAdEvent = useCallback((event: NativeSyntheticEvent<{ event: string }>) => {
    const adEventType = event.nativeEvent.event as 'impression' | 'started' | 'complete' | 'clicked' | 'skipped';
    onAdEvent?.(adEventType);
  }, [onAdEvent]);

  return (
    <View style={[styles.container, style]}>
      <NativeMuxJWPlayerView
        style={styles.player}
        hlsUrl={hlsUrl}
        posterUrl={posterUrl}
        autostart={autoPlay}
        muxEnvKey={muxEnvKey}
        videoId={videoId}
        videoTitle={videoTitle}
        videoSeries={videoSeries}
        videoDuration={videoDuration}
        viewerUserId={viewerUserId}
        adTagUrl={adsEnabled ? adTagUrl : undefined}
        onPlayerReady={handleReady}
        onPlayerError={handleError}
        onPlaybackStateChange={handleStateChange}
        onAdEvent={handleAdEvent}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {adsEnabled && !isLoading && (
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sponsoredText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default MuxJWPlayer;
