/**
 * Sermon Player Screen
 *
 * Displays sermon video with native JW Player on both iOS and Android.
 * Fetches playback data from API including CSAI ads configuration.
 * When ads.enabled=true, the native player receives adTagUrl for pre-roll ads.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { MuxJWPlayer } from '../../src/components/video/MuxJWPlayer';
import { useSermonPlayback } from '../../src/queries/churches';

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function SermonPlayerScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const { user } = useAuth();
  const sermonId = parseInt(id || '0', 10);
  const [playbackState, setPlaybackState] = useState<string>('idle');

  const { data, isLoading, error } = useSermonPlayback(sermonId);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a2a4a" />
          <Text style={styles.loadingText}>Loading sermon...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off" size={64} color="#999" />
          <Text style={styles.errorTitle}>Video Not Available</Text>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'This sermon is not available for playback.'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { sermon, playback, ads } = data;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: sermon.title,
          headerShown: true,
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Video Player */}
        <MuxJWPlayer
          hlsUrl={playback.hlsUrl}
          posterUrl={playback.posterUrl || undefined}
          autoPlay={false}
          videoId={String(sermon.id)}
          videoTitle={sermon.title}
          videoSeries={sermon.series || undefined}
          videoDuration={sermon.duration ? sermon.duration * 1000 : undefined}
          viewerUserId={user?.id ? String(user.id) : undefined}
          adsEnabled={ads.enabled}
          adTagUrl={ads.tagUrl || undefined}
          style={styles.player}
          onStateChange={setPlaybackState}
        />

        {/* Sermon Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{sermon.title}</Text>

          <View style={styles.metaRow}>
            {sermon.speaker && (
              <View style={styles.metaItem}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.metaText}>{sermon.speaker}</Text>
              </View>
            )}
            {sermon.sermonDate && (
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.metaText}>{sermon.sermonDate}</Text>
              </View>
            )}
            {sermon.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.metaText}>{formatDuration(sermon.duration)}</Text>
              </View>
            )}
          </View>

          {sermon.series && (
            <View style={styles.seriesContainer}>
              <Ionicons name="bookmark" size={16} color="#1a2a4a" />
              <Text style={styles.seriesText}>Series: {sermon.series}</Text>
            </View>
          )}

          {sermon.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>About This Message</Text>
              <Text style={styles.descriptionText}>{sermon.description}</Text>
            </View>
          )}

          {ads.enabled && (
            <Text style={styles.adsNotice}>
              This content may include advertisements.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1a2a4a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  player: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  seriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seriesText: {
    fontSize: 14,
    color: '#1a2a4a',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  adsNotice: {
    marginTop: 16,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
