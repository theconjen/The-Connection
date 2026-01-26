import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsAPI, getApiBase } from "../lib/apiClient";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Constants from "expo-constants";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import apiClient from "../lib/apiClient";
import { getCurrentLocation, hasLocationPermission, requestLocationPermission, type UserLocation } from "../services/locationService";
import { shareEvent } from "../lib/shareUrls";
import { isHost } from "../lib/eventHelpers";

// DEV-ONLY: Get build channel from EAS or fallback
const getBuildChannel = (): string => {
  // EAS Update channel
  const updateChannel = Constants.expoConfig?.extra?.eas?.projectId ? 'eas' : null;
  // Check releaseChannel (older expo)
  const releaseChannel = (Constants.manifest as any)?.releaseChannel;
  // Check if running in development
  if (__DEV__) return 'dev';
  if (releaseChannel) return releaseChannel;
  if (updateChannel) return 'production';
  return 'unknown';
};

// Custom church icon
const ChurchIcon = require("../../assets/church-icon.png");

type Range = "today" | "week" | "weekend" | "next" | "all";
type Mode = "all" | "inPerson" | "online";
type DistanceFilter = "all" | "5" | "10" | "20" | "50" | "100";

// RSVP status type - matches backend values: 'going', 'maybe', 'not_going'
type RsvpStatus = 'going' | 'maybe' | 'not_going' | null;

// Host user info type
type HostUser = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

type EventItem = {
  id: number | string;
  title: string;
  // API returns these separate fields:
  eventDate?: string;      // "2026-01-12 00:00:00"
  startTime?: string;      // "10:30:00"
  endTime?: string;        // "12:00:00"
  // Legacy field (may not exist):
  startsAt?: string;       // ISO datetime
  // Location fields
  location?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOnline?: boolean;
  isVirtual?: boolean;
  distanceMiles?: number | null;
  posterUrl?: string | null;
  imageUrl?: string | null;
  category?: string | null; // "Worship", "Bible Study", "Apologetics"
  isPublic?: boolean; // true = visible on main Events page
  attendingCount?: number | null;
  rsvpStatus?: RsvpStatus; // User's RSVP status for this event (legacy)
  userRsvpStatus?: RsvpStatus; // User's RSVP status from API
  isBookmarked?: boolean; // User's bookmark status from API
  creatorId?: number; // Event creator ID
  hostUserId?: number; // Reliable host identifier from API
  host?: HostUser | null; // Host user info from API
};

// ----- API -----
async function fetchEvents(params: {
  range: Range;
  mode: Mode;
  distance: DistanceFilter;
  q: string;
  city: string;
  userLocation?: UserLocation | null;
}) {
  const qs = new URLSearchParams();
  qs.set("range", params.range);
  qs.set("mode", params.mode);
  if (params.q.trim()) qs.set("q", params.q.trim());
  if (params.city.trim()) qs.set("city", params.city.trim());

  // Send user location for distance filtering
  if (params.userLocation && params.distance !== "all") {
    qs.set("latitude", params.userLocation.latitude.toString());
    qs.set("longitude", params.userLocation.longitude.toString());
    qs.set("distance", params.distance);
  }

  const res = await apiClient.get(`/api/events?${qs.toString()}`);
  return (res.data?.events ?? res.data ?? []) as EventItem[];
}

// ----- FILTER COMPONENTS -----

function FilterChip({
  label,
  active,
  onPress,
  icon,
  colors,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  colors: any;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.borderSubtle,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? colors.primaryForeground : colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.filterChipText,
          { color: active ? colors.primaryForeground : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterSection({
  title,
  subtitle,
  children,
  colors,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.filterSectionSubtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      )}
      <View style={styles.filterSectionContent}>{children}</View>
    </View>
  );
}

// ----- UI PIECES -----
function ToggleTabs({
  value,
  onChange,
  leftLabel,
  rightLabel,
  colors,
}: {
  value: "list" | "map";
  onChange: (v: "list" | "map") => void;
  leftLabel: string;
  rightLabel: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.toggleWrap,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
      ]}
    >
      {(["list", "map"] as const).map((v) => {
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[
              styles.toggleBtn,
              active
                ? { backgroundColor: colors.primary }
                : { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { color: active ? colors.primaryForeground : colors.textSecondary },
              ]}
            >
              {v === "list" ? leftLabel : rightLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Parse eventDate (handles "2026-01-12 00:00:00" or "2026-01-12" formats)
function parseEventDate(eventDate: string): Date {
  if (!eventDate) return new Date(NaN);
  // Handle "2026-01-12 00:00:00" format by taking just the date part
  const datePart = eventDate.split(' ')[0];
  // Parse as local date (not UTC)
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format time string "10:30:00" to "10:30 AM"
function formatTimeStr(timeStr: string): string {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const hour = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatWhen(event: EventItem) {
  // Try to use eventDate + startTime first (new API format)
  if (event.eventDate) {
    const d = parseEventDate(event.eventDate);
    if (!isNaN(d.getTime())) {
      const dateOpts: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
      };
      const dateStr = new Intl.DateTimeFormat(undefined, dateOpts).format(d);
      const timeStr = event.startTime ? formatTimeStr(event.startTime) : '';
      return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
    }
  }

  // Fallback to startsAt (legacy format)
  if (event.startsAt) {
    const d = new Date(event.startsAt);
    if (!isNaN(d.getTime())) {
      const opts: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      };
      return new Intl.DateTimeFormat(undefined, opts).format(d);
    }
  }

  return "Date TBD";
}

// Event type icon mapping (Ionicons only, Sunday Service uses custom image)
const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Worship': 'musical-notes-outline',
  'Social': 'people-outline',
  'Service': 'hand-left-outline',
  'Bible Study': 'book-outline',
  'Prayer': 'prism-outline',
};

// Helper to get icon for event type
const getEventIcon = (eventType: string) => {
  if (eventType === 'Sunday Service') {
    return null; // Use custom church icon image
  }
  return EVENT_TYPE_ICONS[eventType] || 'calendar-outline';
};

// Default gradient colors for event types
const EVENT_TYPE_GRADIENTS: Record<string, [string, string]> = {
  'Sunday Service': ['#4A5568', '#2D3748'],
  'Worship': ['#805AD5', '#553C9A'],
  'Social': ['#48BB78', '#38A169'],
  'Service': ['#ED8936', '#DD6B20'],
  'Bible Study': ['#3182CE', '#2C5282'],
  'Prayer': ['#9F7AEA', '#805AD5'],
};

// RSVP status colors - matches backend values
const RSVP_COLORS: Record<string, string> = {
  going: '#22C55E',     // Green
  maybe: '#EAB308',     // Yellow
  not_going: '#EF4444', // Red
};

// DEV-ONLY: Viewer type for debug panel
type ViewerInfo = {
  id?: number;
  username?: string;
} | null;

function EventCard({
  item,
  colors,
  onPress,
  rsvpStatus,
  onRsvpPress,
  onBookmarkPress,
  isBookmarked,
  isUserHost,
  onManagePress,
  viewer,
}: {
  item: EventItem;
  colors: any;
  onPress: () => void;
  rsvpStatus?: RsvpStatus;
  onRsvpPress?: () => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  isUserHost?: boolean;
  onManagePress?: () => void;
  viewer?: ViewerInfo;
}) {
  // DEV-ONLY: Track if we've logged once for this card
  const hasLoggedRef = useRef(false);

  // DEV-ONLY: Console.log debug payload once on mount
  useEffect(() => {
    if (__DEV__ && viewer && !hasLoggedRef.current) {
      hasLoggedRef.current = true;
      console.info('[EventCard DEBUG]', {
        viewerId: viewer?.id,
        viewerUsername: viewer?.username,
        eventId: item.id,
        'event.hostUserId': item.hostUserId,
        'event.host?.id': item.host?.id,
        'event.creatorId': item.creatorId,
        derivedIsHost: isHost(item, viewer?.id),
      });
    }
  }, [item, viewer]);
  // Handle both isOnline and isVirtual flags
  const isOnlineEvent = item.isOnline || item.isVirtual;

  // Use location field first, then fall back to city/state
  const locationLine = isOnlineEvent
    ? "Online"
    : item.location || [item.city, item.state].filter(Boolean).join(", ");

  const distance =
    !item.isOnline && typeof item.distanceMiles === "number"
      ? `${item.distanceMiles.toFixed(1)} mi`
      : null;

  const eventType = item.category || 'Sunday Service';
  const eventIcon = getEventIcon(eventType);
  const [gradientStart, gradientEnd] = EVENT_TYPE_GRADIENTS[eventType] || ['#4A5568', '#2D3748'];
  const isSundayService = eventType === 'Sunday Service';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      {/* Poster block with default gradient */}
      <View
        style={[
          styles.poster,
          item.posterUrl
            ? { backgroundColor: colors.surfaceNested, borderColor: colors.borderSubtle }
            : { backgroundColor: gradientStart, borderColor: colors.borderSubtle }
        ]}
      >
        {item.posterUrl ? (
          <View style={styles.posterImagePlaceholder}>
            <Text style={{ color: colors.textPrimaryTertiary, fontWeight: "700" }}>
              Poster
            </Text>
          </View>
        ) : (
          <View style={styles.posterFallback}>
            {/* Event type icon */}
            <View style={styles.posterIconContainer}>
              {isSundayService ? (
                <Image source={ChurchIcon} style={styles.customIconImage} />
              ) : (
                <Ionicons name={eventIcon || 'calendar-outline'} size={32} color={colors.textInverse} />
              )}
            </View>

            {/* Event type badge */}
            <View style={[styles.posterTypeBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[styles.posterTypeText, { color: colors.textInverse }]}>{eventType}</Text>
            </View>
          </View>
        )}

        {/* Community-only badge (shows when event is not public) */}
        {item.isPublic === false ? (
          <View style={[styles.badge, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
              Community Only
            </Text>
          </View>
        ) : null}

        {/* Host badge */}
        {isUserHost && (
          <View style={[styles.hostBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.hostBadgeText}>Host</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Host line */}
      {item.host && (
        <View style={styles.hostRow}>
          <Ionicons name="person-circle-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.hostText, { color: colors.textTertiary }]} numberOfLines={1}>
            Hosted by {item.host.displayName || item.host.username}
          </Text>
        </View>
      )}

      {/* Meta rows */}
      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatWhen(item)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Ionicons
          name={item.isOnline ? "videocam-outline" : "location-outline"}
          size={13}
          color={colors.textSecondary}
        />
        <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
          {locationLine || "Location TBD"}
          {distance ? ` • ${distance}` : ""}
        </Text>
      </View>

      {/* Footer actions */}
      <View style={styles.footerRow}>
        {/* Event type chip - always show */}
        <View
          style={[
            styles.categoryChip,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
          ]}
        >
          {isSundayService ? (
            <Image source={ChurchIcon} style={styles.chipIconImage} />
          ) : (
            <Ionicons name={eventIcon || 'calendar-outline'} size={11} color={colors.textPrimary} style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.categoryText, { color: colors.textPrimary }]} numberOfLines={1}>
            {eventType}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {/* Share button */}
          <Pressable
            hitSlop={10}
            onPress={() => shareEvent(item.id, item.title)}
            style={[
              styles.iconAction,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.borderSoft
              },
            ]}
          >
            <Ionicons
              name="share-outline"
              size={15}
              color={colors.textPrimary}
            />
          </Pressable>

          {/* Bookmark button */}
          <Pressable
            hitSlop={10}
            onPress={onBookmarkPress}
            style={[
              styles.iconAction,
              {
                backgroundColor: isBookmarked ? colors.primary : colors.surfaceMuted,
                borderColor: isBookmarked ? colors.primary : colors.borderSoft
              },
            ]}
          >
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={15}
              color={isBookmarked ? '#FFFFFF' : colors.textPrimary}
            />
          </Pressable>

          {/* RSVP status button */}
          <Pressable
            hitSlop={10}
            onPress={onRsvpPress}
            style={[
              styles.iconAction,
              {
                backgroundColor: rsvpStatus ? RSVP_COLORS[rsvpStatus] : colors.surfaceMuted,
                borderColor: rsvpStatus ? RSVP_COLORS[rsvpStatus] : colors.borderSoft
              },
            ]}
          >
            <Ionicons
              name={rsvpStatus ? "checkmark-circle" : "checkmark-circle-outline"}
              size={15}
              color={rsvpStatus ? '#FFFFFF' : colors.textPrimary}
            />
          </Pressable>

          {/* Manage button (host only) */}
          {isUserHost && onManagePress && (
            <Pressable
              hitSlop={10}
              onPress={onManagePress}
              style={[
                styles.iconAction,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary
                },
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={15}
                color="#FFFFFF"
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* DEV-ONLY Debug Panel */}
      {__DEV__ && viewer && (
        <View style={styles.debugPanelCard}>
          <Text style={styles.debugTitleCard}>🛠️ DEBUG</Text>
          <View style={styles.debugRowCard}>
            <Text style={styles.debugLabelCard}>viewer: {viewer?.id ?? 'null'} (@{viewer?.username ?? 'null'})</Text>
          </View>
          <View style={styles.debugRowCard}>
            <Text style={styles.debugLabelCard}>eventId: {item.id}</Text>
          </View>
          <View style={styles.debugRowCard}>
            <Text style={styles.debugLabelCard}>hostUserId: {item.hostUserId ?? 'undef'} | host?.id: {item.host?.id ?? 'undef'}</Text>
          </View>
          <View style={styles.debugRowCard}>
            <Text style={[styles.debugLabelCard, { color: isHost(item, viewer?.id) ? '#22c55e' : '#ef4444', fontWeight: 'bold' }]}>
              isHost: {isHost(item, viewer?.id) ? 'TRUE' : 'FALSE'}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

interface EventsScreenNewProps {
  onMenuPress?: () => void;
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
  unreadNotificationCount?: number;
  unreadMessageCount?: number;
}

export default function EventsScreenNew({
  onMenuPress: externalMenuPress,
  onProfilePress: externalProfilePress,
  onMessagesPress: externalMessagesPress,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
}: EventsScreenNewProps = {}) {
  const router = useRouter();
  const { colors, theme, radii, colorScheme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();

  // Auth must be fully initialized before firing event queries
  // This ensures JWT token is restored and attached to requests
  const authReady = !authLoading;

  // DEV-ONLY: Log auth readiness state on mount
  useEffect(() => {
    if (__DEV__) {
      console.info('[EventsScreen] Auth state:', {
        authReady,
        authLoading,
        hasUser: !!user,
        userId: user?.id,
      });
    }
  }, [authReady, authLoading, user]);

  const [view, setView] = useState<"list" | "map">("list");
  const [range, setRange] = useState<Range>("week");
  const [mode, setMode] = useState<Mode>("all");
  const [distance, setDistance] = useState<DistanceFilter>("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showMyEvents, setShowMyEvents] = useState(false);

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // RSVP and bookmark state - track per event
  const [rsvpStatuses, setRsvpStatuses] = useState<Record<string | number, RsvpStatus>>({});
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Set<string | number>>(new Set());
  const queryClient = useQueryClient();

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      if (__DEV__) {
        console.info('[RSVP] Setting status:', { eventId, status });
      }
      return eventsAPI.rsvp(eventId, status);
    },
    onSuccess: (_, { eventId, status }) => {
      if (__DEV__) {
        console.info('[RSVP] Success - invalidating queries for event:', eventId);
      }
      // Optimistic update for immediate UI feedback
      setRsvpStatuses(prev => ({
        ...prev,
        [eventId]: status as RsvpStatus,
      }));
      // Invalidate queries to ensure server state is fetched
      // This ensures RSVP persists across app restarts
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", "my"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (error: any) => {
      // Extract actual server error message from axios response
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      const statusCode = error.response?.status;

      console.error('[RSVP Error]', {
        statusCode,
        serverMessage,
        responseData: error.response?.data,
        axiosMessage: error.message
      });

      // Show user-friendly message based on error
      if (statusCode === 403 && serverMessage?.includes('suspended')) {
        Alert.alert('Account Issue', serverMessage || 'Your account has been suspended. Please contact support.');
      } else if (statusCode === 401) {
        Alert.alert('Login Required', 'Please log in again to RSVP to events.');
      } else {
        Alert.alert('RSVP Failed', serverMessage || error.message || 'Failed to update RSVP. Please try again.');
      }
    },
  });

  // Clear RSVP mutation - calls DELETE /api/events/:id/rsvp
  const clearRsvpMutation = useMutation({
    mutationFn: async (eventId: number) => {
      if (__DEV__) {
        console.info('[RSVP] Clearing RSVP for event:', eventId);
      }
      return apiClient.delete(`/api/events/${eventId}/rsvp`);
    },
    onSuccess: (_, eventId) => {
      if (__DEV__) {
        console.info('[RSVP] Clear success - invalidating queries for event:', eventId);
      }
      // Clear local state
      setRsvpStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[eventId];
        return newStatuses;
      });
      // Invalidate queries to ensure server state is fetched
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", "my"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
    onError: (error: any) => {
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      console.error('[RSVP Clear Error]', {
        status: error.response?.status,
        message: serverMessage || error.message,
      });
      Alert.alert('Error', serverMessage || 'Failed to clear RSVP. Please try again.');
    },
  });

  // Handle RSVP button press - show action sheet
  // Backend expects: 'going', 'maybe', 'not_going'
  const handleRsvpPress = (eventId: number | string) => {
    const currentStatus = rsvpStatuses[eventId];
    const options = ['Going', 'Maybe', "Can't Go", 'Clear RSVP', 'Cancel'];
    const statusMap: Record<number, RsvpStatus> = {
      0: 'going',
      1: 'maybe',
      2: 'not_going',
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 4,
          destructiveButtonIndex: 3,
          title: 'Set your RSVP status',
        },
        (buttonIndex) => {
          if (buttonIndex < 3) {
            rsvpMutation.mutate({ eventId: Number(eventId), status: statusMap[buttonIndex]! });
          } else if (buttonIndex === 3) {
            // Clear RSVP - call API to persist deletion
            clearRsvpMutation.mutate(Number(eventId));
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      Alert.alert(
        'Set your RSVP status',
        undefined,
        [
          { text: 'Going', onPress: () => rsvpMutation.mutate({ eventId: Number(eventId), status: 'going' }) },
          { text: 'Maybe', onPress: () => rsvpMutation.mutate({ eventId: Number(eventId), status: 'maybe' }) },
          { text: "Can't Go", onPress: () => rsvpMutation.mutate({ eventId: Number(eventId), status: 'not_going' }) },
          { text: 'Clear', style: 'destructive', onPress: () => {
            // Clear RSVP - call API to persist deletion
            clearRsvpMutation.mutate(Number(eventId));
          }},
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async ({ eventId, isBookmarked }: { eventId: number; isBookmarked: boolean }) => {
      if (isBookmarked) {
        // Unbookmark
        return apiClient.delete(`/api/events/${eventId}/bookmark`);
      } else {
        // Bookmark
        return apiClient.post(`/api/events/${eventId}/bookmark`);
      }
    },
    onMutate: ({ eventId, isBookmarked }) => {
      // Optimistic update
      setBookmarkedEvents(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
    },
    onError: (error: any, { eventId, isBookmarked }) => {
      // Rollback on error
      setBookmarkedEvents(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.add(eventId); // Re-add if unbookmark failed
        } else {
          newSet.delete(eventId); // Remove if bookmark failed
        }
        return newSet;
      });

      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      Alert.alert('Bookmark Failed', serverMessage || 'Failed to update bookmark. Please try again.');
    },
  });

  // Handle bookmark press
  const handleBookmarkPress = (eventId: number | string) => {
    const isCurrentlyBookmarked = bookmarkedEvents.has(eventId);
    bookmarkMutation.mutate({ eventId: Number(eventId), isBookmarked: isCurrentlyBookmarked });
  };

  // Navigation handlers - use external handlers if provided, otherwise use defaults
  const onProfilePress = externalProfilePress || (() => router.push("/(tabs)/profile"));
  const onMessagesPress = externalMessagesPress || (() => router.push("/messages"));
  const onMenuPress = externalMenuPress || (() => {});

  const userName = user?.displayName || user?.username || "";
  const userAvatar = user?.profileImageUrl || user?.avatarUrl || null;

  // Get user location on mount
  useEffect(() => {
    async function initLocation() {
      const hasPermission = await hasLocationPermission();
      setLocationPermissionGranted(hasPermission);

      if (hasPermission) {
        setLocationLoading(true);
        const location = await getCurrentLocation();
        setUserLocation(location);
        setLocationLoading(false);
      }
    }

    initLocation();
  }, []);

  // Request location permission when distance filter is selected
  const handleDistanceFilterChange = async (newDistance: DistanceFilter) => {
    if (newDistance !== "all" && !locationPermissionGranted) {
      setLocationLoading(true);
      const granted = await requestLocationPermission();
      setLocationPermissionGranted(granted);

      if (granted) {
        const location = await getCurrentLocation();
        setUserLocation(location);
        setDistance(newDistance);
      }
      setLocationLoading(false);
    } else {
      setDistance(newDistance);
    }
  };

  const { data: rawData, isLoading: isLoadingAll, isError, refetch } = useQuery({
    queryKey: ["events", { view, range, mode, distance, q, city, userLocation }],
    queryFn: async () => {
      if (__DEV__) {
        console.info('[EventsScreen] Fetching events list...');
      }
      try {
        const data = await fetchEvents({ range, mode, distance, q, city, userLocation });
        if (__DEV__) {
          console.info('[EventsScreen] Events fetch success:', {
            count: data?.length ?? 0,
            hasUserRsvpStatus: data?.[0]?.userRsvpStatus !== undefined,
          });
        }
        return data;
      } catch (error: any) {
        if (__DEV__) {
          console.error('[EventsScreen] Events fetch error:', {
            status: error.response?.status,
            message: error.message,
          });
        }
        throw error;
      }
    },
    staleTime: 30_000,
    // Wait for auth to be ready before fetching (ensures JWT is attached)
    enabled: authReady && !showMyEvents,
  });

  // My Events query - fetches hosting, going, maybe events from server
  const { data: myEventsData, isLoading: isLoadingMy, refetch: refetchMy } = useQuery({
    queryKey: ["events", "my"],
    queryFn: async () => {
      if (__DEV__) {
        console.info('[EventsScreen] Fetching my events...');
      }
      try {
        const data = await eventsAPI.getMy();
        if (__DEV__) {
          console.info('[EventsScreen] My events fetch success:', {
            hosting: data?.hosting?.length ?? 0,
            going: data?.going?.length ?? 0,
            maybe: data?.maybe?.length ?? 0,
            saved: data?.saved?.length ?? 0,
          });
        }
        return data;
      } catch (error: any) {
        if (__DEV__) {
          console.error('[EventsScreen] My events fetch error:', {
            status: error.response?.status,
            message: error.message,
          });
        }
        throw error;
      }
    },
    staleTime: 30_000,
    // Wait for auth to be ready AND user to be authenticated
    enabled: authReady && showMyEvents && !!user,
  });

  // DEV-ONLY: Fetch viewer from /api/user/me for debug panel
  const { data: viewer } = useQuery<ViewerInfo>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await apiClient.get('/api/user/me');
      return res.data;
    },
    enabled: __DEV__,
    staleTime: 60_000,
  });

  // Include authLoading in isLoading to show loading state while auth initializes
  // This prevents showing "No events" before the query even starts
  const isLoading = authLoading || (showMyEvents ? isLoadingMy : isLoadingAll);

  // Initialize RSVP statuses from API response (persists across app reloads)
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const initialStatuses: Record<string | number, RsvpStatus> = {};
      rawData.forEach((event) => {
        if (event.userRsvpStatus) {
          initialStatuses[event.id] = event.userRsvpStatus;
        }
      });
      // Only update if we have statuses to set (avoid overwriting user's recent changes)
      if (Object.keys(initialStatuses).length > 0) {
        setRsvpStatuses(prev => ({ ...initialStatuses, ...prev }));
      }
    }
  }, [rawData]);

  // Initialize bookmark statuses from API response (persists across app reloads)
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const initialBookmarks = new Set<string | number>();
      rawData.forEach((event) => {
        if (event.isBookmarked) {
          initialBookmarks.add(event.id);
        }
      });
      // Only update if we have bookmarks to set (merge with existing to preserve recent changes)
      if (initialBookmarks.size > 0) {
        setBookmarkedEvents(prev => new Set([...initialBookmarks, ...prev]));
      }
    }
  }, [rawData]);

  // Filter out past events - only show upcoming events
  // Note: isPublic filter removed since existing events have isPublic=false
  // Events marked as explicitly private (isPrivate=true) are still hidden
  const data = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    // For My Events, use the server data which includes hosting events
    if (showMyEvents && myEventsData) {
      // Combine hosting, going, maybe into single list (deduplicated)
      const seenIds = new Set<number | string>();
      const combined: EventItem[] = [];

      // Add hosting events first (user's own events)
      for (const event of (myEventsData.hosting || [])) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          combined.push({ ...event, _section: 'hosting' });
        }
      }

      // Add going events
      for (const event of (myEventsData.going || [])) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          combined.push({ ...event, _section: 'going' });
        }
      }

      // Add maybe events
      for (const event of (myEventsData.maybe || [])) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          combined.push({ ...event, _section: 'maybe' });
        }
      }

      // Add saved/bookmarked events
      for (const event of (myEventsData.saved || [])) {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          combined.push({ ...event, _section: 'saved' });
        }
      }

      // Filter to upcoming events, but ALWAYS keep hosted events (host can manage past events)
      return combined.filter((event: any) => {
        // Always show events the user is hosting
        if (event._section === 'hosting') {
          return true;
        }

        let eventDateParsed: Date | null = null;
        if (event.eventDate) {
          eventDateParsed = parseEventDate(event.eventDate);
        } else if (event.startsAt) {
          eventDateParsed = new Date(event.startsAt);
        }
        if (!eventDateParsed || isNaN(eventDateParsed.getTime())) {
          return true;
        }
        return eventDateParsed >= now;
      }).sort((a, b) => {
        const dateA = parseEventDate(a.eventDate || '') || new Date(0);
        const dateB = parseEventDate(b.eventDate || '') || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });
    }

    // Regular events list
    if (!rawData) return [];

    return rawData.filter((event) => {
      // Try to parse the event date - prefer eventDate (new API), fall back to startsAt (legacy)
      let eventDateParsed: Date | null = null;

      if (event.eventDate) {
        // Use the same parsing logic as formatWhen
        eventDateParsed = parseEventDate(event.eventDate);
      } else if (event.startsAt) {
        eventDateParsed = new Date(event.startsAt);
      }

      // If we couldn't parse a valid date, include the event (fail safe)
      if (!eventDateParsed || isNaN(eventDateParsed.getTime())) {
        return true;
      }

      // Only show events that are today or in the future
      return eventDateParsed >= now;
    });
  }, [rawData, myEventsData, showMyEvents]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (range !== "week") count++;
    if (mode !== "all") count++;
    if (distance !== "all") count++;
    if (q.trim()) count++;
    if (city.trim()) count++;
    return count;
  }, [range, mode, distance, q, city]);

  const clearAllFilters = () => {
    setRange("week");
    setMode("all");
    setDistance("all");
    setQ("");
    setCity("");
  };

  const getDistanceLabel = (dist: DistanceFilter) => {
    if (dist === "all") return "All Distances";
    return `Within ${dist} miles`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }} edges={['top']}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* App Header */}
      <AppHeader
        showCenteredLogo={true}
        userName={userName}
        userAvatar={userAvatar}
        onProfilePress={onProfilePress}
        showMessages={true}
        onMessagesPress={onMessagesPress}
        showMenu={true}
        onMenuPress={onMenuPress}
        unreadNotificationCount={unreadNotificationCount}
        unreadMessageCount={unreadMessageCount}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputWrap,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search events..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              returnKeyType="search"
              onSubmitEditing={() => refetch()}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Filter Toggle Button */}
          <Pressable
            onPress={() => setFiltersExpanded(!filtersExpanded)}
            style={[
              styles.filterToggleBtn,
              {
                backgroundColor: filtersExpanded || activeFiltersCount > 0 ? colors.primary : colors.surface,
                borderColor: filtersExpanded || activeFiltersCount > 0 ? colors.primary : colors.borderSubtle,
              },
            ]}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filtersExpanded || activeFiltersCount > 0 ? colors.primaryForeground : colors.textPrimary}
            />
            {activeFiltersCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primaryForeground }]}>
                <Text style={[styles.filterBadgeText, { color: colors.primary }]}>
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Compact Filter Pills (when collapsed) */}
        {!filtersExpanded && activeFiltersCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersRow}
          >
            {range !== "week" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {range === "today" ? "Today" : range === "weekend" ? "Weekend" : range === "next" ? "Next Week" : "All"}
                </Text>
                <Pressable onPress={() => setRange("week")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {mode !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {mode === "inPerson" ? "In-Person" : "Online"}
                </Text>
                <Pressable onPress={() => setMode("all")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {distance !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Ionicons name="navigate-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  Within {distance} mi
                </Text>
                <Pressable onPress={() => setDistance("all")} hitSlop={8} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {city.trim() && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Ionicons name="location-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{city}</Text>
                <Pressable onPress={() => setCity("")} hitSlop={8} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={16} color={colors.primary} />
                </Pressable>
              </View>
            )}
            <Pressable onPress={clearAllFilters} style={[styles.clearAllBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.textMuted }]}>
              <Text style={[styles.clearAllText, { color: colors.textPrimary }]}>Clear All</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Expanded Filters Panel */}
        {filtersExpanded && (
          <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Range */}
              <FilterSection title="DATE RANGE" colors={colors}>
                <View style={styles.filterGrid}>
                  <FilterChip
                    label="Today"
                    active={range === "today"}
                    onPress={() => setRange("today")}
                    icon="today-outline"
                    colors={colors}
                  />
                  <FilterChip
                    label="This Week"
                    active={range === "week"}
                    onPress={() => setRange("week")}
                    icon="calendar-outline"
                    colors={colors}
                  />
                  <FilterChip
                    label="Weekend"
                    active={range === "weekend"}
                    onPress={() => setRange("weekend")}
                    icon="calendar-number-outline"
                    colors={colors}
                  />
                  <FilterChip
                    label="Next Week"
                    active={range === "next"}
                    onPress={() => setRange("next")}
                    icon="arrow-forward-circle-outline"
                    colors={colors}
                  />
                  <FilterChip
                    label="All Events"
                    active={range === "all"}
                    onPress={() => setRange("all")}
                    colors={colors}
                  />
                </View>
              </FilterSection>

              {/* Event Format */}
              <FilterSection title="EVENT FORMAT" colors={colors}>
                <View style={styles.filterGrid}>
                  <FilterChip
                    label="All"
                    active={mode === "all"}
                    onPress={() => setMode("all")}
                    colors={colors}
                  />
                  <FilterChip
                    label="In-Person"
                    active={mode === "inPerson"}
                    onPress={() => setMode("inPerson")}
                    icon="location-outline"
                    colors={colors}
                  />
                  <FilterChip
                    label="Online"
                    active={mode === "online"}
                    onPress={() => setMode("online")}
                    icon="videocam-outline"
                    colors={colors}
                  />
                </View>
              </FilterSection>

              {/* Distance Filter */}
              <FilterSection
                title="DISTANCE"
                subtitle={locationLoading ? "Getting your location..." : !locationPermissionGranted ? "Location permission required" : undefined}
                colors={colors}
              >
                {locationLoading ? (
                  <View style={styles.locationLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.locationLoadingText, { color: colors.textSecondary }]}>
                      Getting your location...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.filterGrid}>
                    <FilterChip
                      label="All Distances"
                      active={distance === "all"}
                      onPress={() => setDistance("all")}
                      colors={colors}
                    />
                    <FilterChip
                      label="5 miles"
                      active={distance === "5"}
                      onPress={() => handleDistanceFilterChange("5")}
                      icon="navigate-outline"
                      colors={colors}
                    />
                    <FilterChip
                      label="10 miles"
                      active={distance === "10"}
                      onPress={() => handleDistanceFilterChange("10")}
                      icon="navigate-outline"
                      colors={colors}
                    />
                    <FilterChip
                      label="20 miles"
                      active={distance === "20"}
                      onPress={() => handleDistanceFilterChange("20")}
                      icon="navigate-outline"
                      colors={colors}
                    />
                    <FilterChip
                      label="50 miles"
                      active={distance === "50"}
                      onPress={() => handleDistanceFilterChange("50")}
                      icon="navigate-outline"
                      colors={colors}
                    />
                    <FilterChip
                      label="100 miles"
                      active={distance === "100"}
                      onPress={() => handleDistanceFilterChange("100")}
                      icon="navigate-outline"
                      colors={colors}
                    />
                  </View>
                )}
              </FilterSection>

              {/* Location */}
              <FilterSection title="CITY SEARCH" subtitle="Or search by city name" colors={colors}>
                <View
                  style={[
                    styles.locationInputWrap,
                    { backgroundColor: colors.background, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Enter city name..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { color: colors.textPrimary }]}
                    returnKeyType="done"
                    onSubmitEditing={() => refetch()}
                  />
                  {city.length > 0 && (
                    <Pressable onPress={() => setCity("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </FilterSection>

              {/* Action Buttons */}
              <View style={styles.filterActions}>
                <Pressable
                  onPress={clearAllFilters}
                  style={[styles.filterActionBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.filterActionText, { color: colors.textPrimary }]}>Clear All</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFiltersExpanded(false);
                    refetch();
                  }}
                  style={[styles.filterActionBtn, styles.filterActionBtnPrimary, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.filterActionText, { color: colors.primaryForeground }]}>
                    Apply Filters
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}

        {/* View Toggle and My Events filter */}
        <View style={styles.viewToggleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ToggleTabs value={view} onChange={setView} leftLabel="List" rightLabel="Map" colors={colors} />

            {/* My Events toggle */}
            <Pressable
              onPress={() => setShowMyEvents(!showMyEvents)}
              style={[
                styles.myEventsToggle,
                {
                  backgroundColor: showMyEvents ? colors.primary : colors.surfaceMuted,
                  borderColor: showMyEvents ? colors.primary : colors.borderSoft,
                },
              ]}
            >
              <Ionicons
                name="bookmark"
                size={14}
                color={showMyEvents ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: showMyEvents ? '#FFFFFF' : colors.textSecondary,
                }}
              >
                My Events
              </Text>
            </Pressable>
          </View>

          {/* Results count */}
          {!isLoading && data && (
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {data.length} {data.length === 1 ? 'event' : 'events'}
            </Text>
          )}
        </View>

        {/* Body */}
        {view === "map" ? (
          isLoading ? (
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                Loading events...
              </Text>
            </View>
          ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={
              userLocation
                ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.2,
                    longitudeDelta: 0.2,
                  }
                : {
                    // Default to US center if no location
                    latitude: 39.8283,
                    longitude: -98.5795,
                    latitudeDelta: 50,
                    longitudeDelta: 50,
                  }
            }
            showsUserLocation={locationPermissionGranted}
            showsMyLocationButton={true}
            userInterfaceStyle={theme === "dark" ? "dark" : "light"}
          >
            {data?.map((event) => {
              // Skip events without coordinates or online events
              if (!event.latitude || !event.longitude || event.isOnline) {
                return null;
              }

              const eventType = event.category || 'Sunday Service';
              const eventIcon = getEventIcon(eventType);
              const [markerColor] = EVENT_TYPE_GRADIENTS[eventType] || ['#3B82F6'];
              const isSundayService = eventType === 'Sunday Service';

              return (
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.latitude,
                    longitude: event.longitude,
                  }}
                  title={event.title}
                  description={formatWhen(event)}
                  pinColor={markerColor}
                  onCalloutPress={() => {
                    router.push({
                      pathname: "/events/[id]",
                      params: { id: String(event.id) },
                    });
                  }}
                >
                  {/* Custom marker with event type icon */}
                  <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                    {isSundayService ? (
                      <Image source={ChurchIcon} style={styles.markerIconImage} />
                    ) : (
                      <Ionicons name={eventIcon || 'calendar-outline'} size={18} color="#FFFFFF" />
                    )}
                  </View>
                </Marker>
              );
            })}
          </MapView>
          )
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingBottom: 18 }}
            ListEmptyComponent={
              isLoading ? (
                <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 14 }}>
                    Loading events...
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.empty,
                    { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 12 }}>
                    No events found
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 18, textAlign: 'center' }}>
                    Try adjusting your filters or search criteria
                  </Text>
                  {activeFiltersCount > 0 && (
                    <Pressable
                      onPress={clearAllFilters}
                      style={[
                        styles.secondaryBtn,
                        { backgroundColor: colors.surfaceMuted, marginTop: 12 },
                      ]}
                    >
                      <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>Clear Filters</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => router.push("/events/create")}
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: colors.primary, marginTop: 8 },
                    ]}
                  >
                    <Text style={{ color: colors.primaryForeground, fontWeight: "700" }}>Create an Event</Text>
                  </Pressable>
                </View>
              )
            }
            renderItem={({ item }) => (
              <EventCard
                item={item}
                colors={colors}
                onPress={() => {
                  console.info('[EventsScreen] Navigating to event:', item.id, item.title);
                  Alert.alert('DEBUG', `Navigating to event ${item.id}: ${item.title}`);
                  router.push({ pathname: "/events/[id]", params: { id: String(item.id) } });
                }}
                rsvpStatus={rsvpStatuses[item.id]}
                onRsvpPress={() => handleRsvpPress(item.id)}
                isBookmarked={bookmarkedEvents.has(item.id)}
                onBookmarkPress={() => handleBookmarkPress(item.id)}
                isUserHost={isHost(item, user?.id)}
                onManagePress={() => router.push({ pathname: "/events/manage/[id]", params: { id: String(item.id) } })}
                viewer={__DEV__ ? viewer : undefined}
              />
            )}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        )}

        {isError ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <Text style={{ color: colors.textSecondary }}>
              Couldn't load events. Pull to refresh.
            </Text>
          </View>
        ) : null}

        {/* DEV-ONLY: Debug Footer */}
        {__DEV__ && (
          <View style={styles.devFooter}>
            <View style={styles.devFooterRow}>
              <Text style={styles.devFooterLabel}>API:</Text>
              <Text style={styles.devFooterValue} numberOfLines={1}>{getApiBase()}</Text>
            </View>
            <View style={styles.devFooterRow}>
              <Text style={styles.devFooterLabel}>Build:</Text>
              <Text style={styles.devFooterValue}>{getBuildChannel()}</Text>
            </View>
            <View style={styles.devFooterRow}>
              <Text style={styles.devFooterLabel}>User:</Text>
              <Text style={styles.devFooterValue}>
                {user ? `${user.id} (@${user.username})` : 'not logged in'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.devRefreshBtn}
              onPress={async () => {
                console.info('[DEV] Hard refresh triggered');
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: ["events"] }),
                  queryClient.invalidateQueries({ queryKey: ["events", "my"] }),
                  queryClient.invalidateQueries({ queryKey: ["me"] }),
                ]);
                // Also refetch immediately
                await Promise.all([
                  queryClient.refetchQueries({ queryKey: ["events"] }),
                  queryClient.refetchQueries({ queryKey: ["events", "my"] }),
                  queryClient.refetchQueries({ queryKey: ["me"] }),
                ]);
                console.info('[DEV] Hard refresh complete');
                Alert.alert('Refreshed', 'All queries invalidated and refetched');
              }}
            >
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.devRefreshText}>Hard Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Search Row
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInputWrap: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.select({ ios: 10, android: 8, default: 8 }),
  },
  filterToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Active Filters Row (collapsed state)
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 8,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Filters Panel (expanded state)
  filtersPanel: {
    maxHeight: 400,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  filterSectionSubtitle: {
    fontSize: 11,
    marginBottom: 8,
  },
  filterSectionContent: {
    // Container for filter content
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  locationLoadingText: {
    fontSize: 13,
  },
  locationInputWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActionBtnPrimary: {
    borderWidth: 0,
  },
  filterActionText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // View Toggle
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  myEventsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleWrap: {
    width: 120,
    height: 36,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: { fontSize: 13, fontWeight: "700" },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Event Card
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  poster: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  posterImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  posterFallback: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  posterIconContainer: {
    marginBottom: 6,
  },
  customIconImage: {
    width: 32,
    height: 32,
    tintColor: '#FFFFFF',
  },
  posterTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  posterTypeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "900" },
  hostBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  hostBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: { fontSize: 13, fontWeight: "500" },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  hostText: { fontSize: 12, fontWeight: "500" },
  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 150,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipIconImage: {
    width: 11,
    height: 11,
    marginRight: 4,
  },
  categoryText: { fontSize: 10, fontWeight: "900" },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Map & Empty States
  map: {
    flex: 1,
    width: '100%',
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerIconImage: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  empty: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // DEV-ONLY Debug Panel styles for EventCard
  debugPanelCard: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  debugTitleCard: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 6,
  },
  debugRowCard: {
    paddingVertical: 2,
  },
  debugLabelCard: {
    fontSize: 9,
    color: '#a1a1aa',
    fontFamily: 'monospace',
  },

  // DEV-ONLY: Footer styles
  devFooter: {
    backgroundColor: '#1e1e2e',
    borderTopWidth: 2,
    borderTopColor: '#f59e0b',
    padding: 12,
    gap: 6,
  },
  devFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devFooterLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f59e0b',
    width: 40,
  },
  devFooterValue: {
    fontSize: 10,
    color: '#e4e4e7',
    fontFamily: 'monospace',
    flex: 1,
  },
  devRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  devRefreshText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e1e2e',
  },
});
