/**
 * VideoSplash - Animated splash screen that plays an MP4 video
 *
 * Shows after the native splash screen and before the main app content.
 * Automatically hides after the video finishes playing.
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Match the splash screen background color
const SPLASH_BACKGROUND = '#EDE8DF';

interface VideoSplashProps {
  onFinish: () => void;
  // Optional: minimum time to show splash (in ms) even if video loads faster
  minDisplayTime?: number;
}

export function VideoSplash({ onFinish, minDisplayTime = 0 }: VideoSplashProps) {
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);
  const startTimeRef = useRef(Date.now());

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    // End at 11 second mark (or if video finishes naturally)
    if (status.positionMillis >= 11000 || status.didJustFinish) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      if (remaining > 0) {
        setTimeout(onFinish, remaining);
      } else {
        onFinish();
      }
    }
  };

  const handleError = (error: string) => {
    console.error('Video splash error:', error);
    // On error, just finish and show the app
    onFinish();
  };

  const handleLoad = async () => {
    // Start video at 9 second mark
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(9000);
    }
    setIsReady(true);
  };

  // Fallback timeout in case video doesn't load or play
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      console.warn('Video splash fallback timeout triggered');
      onFinish();
    }, 5000); // 5 second max fallback

    return () => clearTimeout(fallbackTimeout);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../../assets/splash-video.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        isMuted={true}
        rate={1}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onLoad={handleLoad}
        onError={handleError}
        // Preload the video
        usePoster={false}
      />
      {/* Overlay to ensure seamless transition */}
      {!isReady && (
        <View style={styles.loadingOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BACKGROUND,
  },
});

export default VideoSplash;
