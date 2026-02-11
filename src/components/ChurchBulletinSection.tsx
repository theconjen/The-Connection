/**
 * ChurchBulletinSection Component
 * Displays church bulletin on home screen when user has church affiliation
 * Shows: Church header, service times, upcoming events, recent sermons
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ChurchBulletinData, ChurchBulletinEvent, ChurchBulletinSermon } from '../queries/churches';

interface ChurchBulletinSectionProps {
  bulletin: ChurchBulletinData;
  colors: any;
  onChurchPress: () => void;
  onEventPress: (eventId: number) => void;
  onSermonPress: (sermonId: number) => void;
}

function formatEventDate(eventDate: string): string {
  try {
    const date = parseISO(eventDate);
    return format(date, 'EEE, MMM d');
  } catch {
    return eventDate;
  }
}

function formatEventTime(startTime: string | null): string {
  if (!startTime) return '';
  try {
    // startTime is in format "HH:mm:ss" or "HH:mm"
    const [hours, minutes] = startTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return startTime;
  }
}

function formatSermonDate(sermonDate: string | null): string {
  if (!sermonDate) return '';
  try {
    const date = parseISO(sermonDate);
    return format(date, 'MMM d');
  } catch {
    return sermonDate;
  }
}

function BulletinEventCard({
  event,
  colors,
  onPress,
}: {
  event: ChurchBulletinEvent;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
    >
      <View style={[styles.eventDateBadge, { backgroundColor: colors.primaryMuted || '#6366F115' }]}>
        <Text style={[styles.eventDateText, { color: colors.primary }]}>
          {formatEventDate(event.eventDate)}
        </Text>
      </View>
      <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {event.title}
      </Text>
      {event.startTime && (
        <View style={styles.eventTimeRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.eventTimeText, { color: colors.textMuted }]}>
            {formatEventTime(event.startTime)}
          </Text>
        </View>
      )}
      {event.location && (
        <View style={styles.eventTimeRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.eventLocationText, { color: colors.textMuted }]} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function BulletinSermonCard({
  sermon,
  colors,
  onPress,
}: {
  sermon: ChurchBulletinSermon;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.sermonCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={onPress}
    >
      {sermon.thumbnailUrl ? (
        <Image
          source={{ uri: sermon.thumbnailUrl }}
          style={styles.sermonThumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.sermonThumbnailPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="videocam" size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.sermonInfo}>
        <Text style={[styles.sermonTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {sermon.title}
        </Text>
        {sermon.speaker && (
          <Text style={[styles.sermonSpeaker, { color: colors.textSecondary }]} numberOfLines={1}>
            {sermon.speaker}
          </Text>
        )}
        {sermon.sermonDate && (
          <Text style={[styles.sermonDate, { color: colors.textMuted }]}>
            {formatSermonDate(sermon.sermonDate)}
          </Text>
        )}
      </View>
      <Ionicons name="play-circle" size={28} color={colors.primary} />
    </Pressable>
  );
}

export function ChurchBulletinSection({
  bulletin,
  colors,
  onChurchPress,
  onEventPress,
  onSermonPress,
}: ChurchBulletinSectionProps) {
  if (!bulletin.hasBulletin || !bulletin.church) {
    return null;
  }

  const { church, upcomingEvents = [], recentSermons = [] } = bulletin;
  const hasEvents = upcomingEvents.length > 0;
  const hasSermons = recentSermons.length > 0;

  // If no content to show, just show the church card
  const hasContent = hasEvents || hasSermons || church.serviceTimes;

  return (
    <View style={styles.container}>
      {/* Church Header */}
      <Pressable
        style={[styles.churchHeader, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
        onPress={onChurchPress}
      >
        {church.logoUrl ? (
          <Image
            source={{ uri: church.logoUrl }}
            style={styles.churchLogo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.churchLogoPlaceholder, { backgroundColor: colors.primaryMuted || '#6366F115' }]}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.churchInfo}>
          <Text style={[styles.churchName, { color: colors.textPrimary }]} numberOfLines={1}>
            {church.name}
          </Text>
          <Text style={[styles.churchSubtitle, { color: colors.textSecondary }]}>
            Tap to view church profile
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>

      {/* Service Times Card */}
      {church.serviceTimes && (
        <View style={[styles.serviceTimesCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.serviceTimesHeader}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.serviceTimesLabel, { color: colors.textSecondary }]}>
              Service Times
            </Text>
          </View>
          <Text style={[styles.serviceTimesText, { color: colors.textPrimary }]}>
            {church.serviceTimes}
          </Text>
        </View>
      )}

      {/* Upcoming Events */}
      {hasEvents && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Upcoming Events
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {upcomingEvents.map((event) => (
              <BulletinEventCard
                key={event.id}
                event={event}
                colors={colors}
                onPress={() => onEventPress(event.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Sermons */}
      {hasSermons && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Recent Sermons
          </Text>
          {recentSermons.map((sermon) => (
            <BulletinSermonCard
              key={sermon.id}
              sermon={sermon}
              colors={colors}
              onPress={() => onSermonPress(sermon.id)}
            />
          ))}
        </View>
      )}

      {/* Empty state if no content */}
      {!hasContent && (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Check back soon for updates from your church
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 12,
  },

  // Church Header
  churchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  churchLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  churchLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  churchInfo: {
    flex: 1,
  },
  churchName: {
    fontSize: 16,
    fontWeight: '600',
  },
  churchSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Service Times
  serviceTimesCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceTimesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  serviceTimesLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  serviceTimesText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    gap: 10,
  },

  // Event Card
  eventCard: {
    width: 180,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  eventDateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventDateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontSize: 11,
  },
  eventLocationText: {
    fontSize: 11,
    flex: 1,
  },

  // Sermon Card
  sermonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  sermonThumbnail: {
    width: 60,
    height: 45,
    borderRadius: 6,
  },
  sermonThumbnailPlaceholder: {
    width: 60,
    height: 45,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sermonInfo: {
    flex: 1,
    gap: 2,
  },
  sermonTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  sermonSpeaker: {
    fontSize: 12,
  },
  sermonDate: {
    fontSize: 11,
  },

  // Empty state
  emptyCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default ChurchBulletinSection;
