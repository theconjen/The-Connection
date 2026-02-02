import React, { useMemo, useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsAPI } from "../lib/apiClient";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import apiClient from "../lib/apiClient";
import { getCurrentLocation, hasLocationPermission, requestLocationPermission, type UserLocation } from "../services/locationService";

// Custom church icon
const ChurchIcon = require("../../assets/church-icon.png");

type Range = "today" | "week" | "weekend" | "next" | "all";
type Mode = "all" | "inPerson" | "online";
type DistanceFilter = "all" | "5" | "10" | "25" | "50";
type EventType = "all" | "Sunday Service" | "Worship" | "Bible Study" | "Social" | "Service" | "Prayer";

// RSVP status type - matches backend values: 'going', 'maybe', 'not_going'
type RsvpStatus = 'going' | 'maybe' | 'not_going' | null;

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
  isPrivate?: boolean;
  isPublic?: boolean;
  attendingCount?: number | null;
  rsvpStatus?: RsvpStatus; // User's RSVP status for this event (legacy)
  userRsvpStatus?: RsvpStatus; // User's RSVP status from API
  isBookmarked?: boolean; // User's bookmark status from API
  connectionsGoing?: { count: number; names: string[] }; // Connections (following) who RSVP'd going
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

// Format category for display: "bible_study" -> "Bible Study"
function formatCategory(category: string | null | undefined): string {
  if (!category) return 'Event';
  // Replace underscores with spaces and capitalize each word
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Simplify location display: extract venue name and city only
function formatLocationDisplay(location: string | null | undefined): string {
  if (!location) return '';

  // Split by comma and take relevant parts
  const parts = location.split(',').map(p => p.trim());

  if (parts.length <= 2) {
    return location; // Already short enough
  }

  // Try to get venue name (first part) and city (usually 3rd or 4th part)
  const venueName = parts[0];

  // Skip parts that look like street numbers or county names
  const cityPart = parts.find((part, index) => {
    if (index === 0) return false; // Skip venue name
    // Skip if it's just a number (like "45271")
    if (/^\d+$/.test(part)) return false;
    // Skip if it contains "Street", "Road", "Ave", etc.
    if (/\b(Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b/i.test(part)) return false;
    // Skip if it contains "County", "Township", "Charter"
    if (/\b(County|Township|Charter)\b/i.test(part)) return false;
    return true;
  });

  if (cityPart) {
    return `${venueName}, ${cityPart}`;
  }

  // Fallback: just use first two parts
  return parts.slice(0, 2).join(', ');
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

// Default gradient colors for event types - each category has unique color
const EVENT_TYPE_GRADIENTS: Record<string, [string, string]> = {
  'Sunday Service': ['#4A5568', '#2D3748'],      // Slate gray
  'Worship': ['#805AD5', '#553C9A'],             // Purple
  'Bible Study': ['#5C6B5E', '#3D4A3F'],         // Muted sage green
  'Prayer Meeting': ['#9F7AEA', '#805AD5'],      // Light purple
  'Prayer': ['#9F7AEA', '#805AD5'],              // Light purple (alias)
  'Fellowship Social': ['#48BB78', '#38A169'],   // Green
  'Fellowship/Social': ['#48BB78', '#38A169'],   // Green (alias)
  'Social': ['#48BB78', '#38A169'],              // Green (alias)
  'Service Outreach': ['#E07C4F', '#C4623A'],    // Terracotta/burnt orange
  'Service/Outreach': ['#E07C4F', '#C4623A'],    // Terracotta (alias)
  'Service': ['#ED8936', '#DD6B20'],             // Orange (legacy)
  'Activity': ['#3B82F6', '#2563EB'],            // Blue
  'Conference': ['#EC4899', '#DB2777'],          // Pink
  'Youth Event': ['#14B8A6', '#0D9488'],         // Teal
  'Youth': ['#14B8A6', '#0D9488'],               // Teal (alias)
  'Other': ['#6B7280', '#4B5563'],               // Gray
};

// RSVP status colors - matches backend values
const RSVP_COLORS: Record<string, string> = {
  going: '#22C55E',     // Green
  maybe: '#EAB308',     // Yellow
  not_going: '#EF4444', // Red
};

function EventCard({
  item,
  colors,
  onPress,
  rsvpStatus,
  onRsvpPress,
  onBookmarkPress,
  isBookmarked,
  onConnectionsPress,
}: {
  item: EventItem;
  colors: any;
  onPress: () => void;
  rsvpStatus?: RsvpStatus;
  onRsvpPress?: () => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  onConnectionsPress?: () => void;
}) {
  // Handle both isOnline and isVirtual flags
  const isOnlineEvent = item.isOnline || item.isVirtual;

  // Use location field first, then fall back to city/state
  const locationLine = isOnlineEvent
    ? "Online"
    : formatLocationDisplay(item.location) || [item.city, item.state].filter(Boolean).join(", ");

  const distance =
    !item.isOnline && typeof item.distanceMiles === "number"
      ? `${item.distanceMiles.toFixed(1)} mi`
      : null;

  const eventType = formatCategory(item.category) || 'Sunday Service';
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
      {/* Poster block with custom flyer image or default gradient */}
      <View
        style={[
          styles.poster,
          (item.imageUrl || item.posterUrl)
            ? { backgroundColor: colors.surfaceNested, borderColor: colors.borderSubtle }
            : { backgroundColor: gradientStart, borderColor: colors.borderSubtle }
        ]}
      >
        {(item.imageUrl || item.posterUrl) ? (
          <Image
            source={{ uri: item.imageUrl || item.posterUrl || '' }}
            style={styles.posterImage}
            resizeMode="cover"
          />
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

        {/* Private badge */}
        {item.isPrivate ? (
          <View style={[styles.badge, { borderColor: colors.borderSubtle, backgroundColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.textPrimary }]}>
              Private
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {item.title}
      </Text>

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
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

          {/* Connections Going pill - tappable to show names */}
          {item.connectionsGoing && item.connectionsGoing.count > 0 && (
            <Pressable
              onPress={onConnectionsPress}
              style={[
                styles.connectionsChip,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
              ]}
            >
              <Ionicons name="people" size={11} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.connectionsText, { color: colors.primary }]} numberOfLines={1}>
                {item.connectionsGoing.count} {item.connectionsGoing.count === 1 ? 'Connection' : 'Connections'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
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
        </View>
      </View>
    </Pressable>
  );
}

// Cluster events by location to prevent flickering when multiple events share coordinates
interface ClusteredLocation {
  key: string;
  latitude: number;
  longitude: number;
  events: EventItem[];
}

function clusterEventsByLocation(events: EventItem[]): ClusteredLocation[] {
  const clusters = new Map<string, ClusteredLocation>();

  for (const event of events) {
    if (!event.latitude || !event.longitude || event.isOnline) {
      continue;
    }

    // Round coordinates to group nearby events (within ~10m)
    const lat = Math.round(event.latitude * 10000) / 10000;
    const lng = Math.round(event.longitude * 10000) / 10000;
    const key = `${lat},${lng}`;

    if (clusters.has(key)) {
      clusters.get(key)!.events.push(event);
    } else {
      clusters.set(key, {
        key,
        latitude: event.latitude,
        longitude: event.longitude,
        events: [event],
      });
    }
  }

  return Array.from(clusters.values());
}

// Separate map component to handle clustering
function EventMapView({
  data,
  userLocation,
  locationPermissionGranted,
  theme,
  colors,
  router,
}: {
  data: EventItem[] | undefined;
  userLocation: UserLocation | null;
  locationPermissionGranted: boolean;
  theme: string;
  colors: any;
  router: any;
}) {
  const [selectedCluster, setSelectedCluster] = useState<ClusteredLocation | null>(null);

  const clusters = useMemo(() => {
    if (!data) return [];
    return clusterEventsByLocation(data);
  }, [data]);

  const handleClusterPress = (cluster: ClusteredLocation) => {
    if (cluster.events.length === 1) {
      // Single event - navigate directly
      router.push({
        pathname: "/events/[id]",
        params: { id: String(cluster.events[0].id) },
      });
    } else {
      // Multiple events - show selection modal
      setSelectedCluster(cluster);
    }
  };

  const handleEventSelect = (event: EventItem) => {
    setSelectedCluster(null);
    router.push({
      pathname: "/events/[id]",
      params: { id: String(event.id) },
    });
  };

  return (
    <>
      <MapView
        style={styles.map}
        // Use Apple Maps on iOS (works without API key), Google Maps on Android
        provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
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
        {clusters.map((cluster) => {
          const primaryEvent = cluster.events[0];
          const eventType = formatCategory(primaryEvent.category) || 'Sunday Service';
          const eventIcon = getEventIcon(eventType);
          const [markerColor] = EVENT_TYPE_GRADIENTS[eventType] || ['#3B82F6'];
          const isSundayService = eventType === 'Sunday Service';
          const eventCount = cluster.events.length;

          return (
            <Marker
              key={cluster.key}
              coordinate={{
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              }}
              title={eventCount > 1 ? `${eventCount} events` : primaryEvent.title}
              description={eventCount > 1 ? 'Tap to see all events' : formatWhen(primaryEvent)}
              onPress={() => handleClusterPress(cluster)}
              tracksViewChanges={false}
            >
              {/* Custom marker with event type icon */}
              <View style={[styles.customMarker, { backgroundColor: markerColor }]}>
                {isSundayService ? (
                  <Image source={ChurchIcon} style={styles.markerIconImage} />
                ) : (
                  <Ionicons name={eventIcon || 'calendar-outline'} size={18} color="#FFFFFF" />
                )}
                {/* Badge for multiple events */}
                {eventCount > 1 && (
                  <View style={styles.clusterBadge}>
                    <Text style={styles.clusterBadgeText}>{eventCount}</Text>
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Event Selection Modal for clustered locations */}
      {selectedCluster && (
        <View style={[styles.clusterModal, { backgroundColor: colors.surface }]}>
          <View style={styles.clusterModalHeader}>
            <Text style={[styles.clusterModalTitle, { color: colors.textPrimary }]}>
              {selectedCluster.events.length} Events at this Location
            </Text>
            <Pressable onPress={() => setSelectedCluster(null)} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.clusterModalList}>
            {selectedCluster.events.map((event) => {
              const eventType = formatCategory(event.category) || 'Sunday Service';
              const [bgColor] = EVENT_TYPE_GRADIENTS[eventType] || ['#3B82F6'];

              return (
                <Pressable
                  key={event.id}
                  style={[styles.clusterEventItem, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => handleEventSelect(event)}
                >
                  <View style={[styles.clusterEventDot, { backgroundColor: bgColor }]} />
                  <View style={styles.clusterEventInfo}>
                    <Text style={[styles.clusterEventTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={[styles.clusterEventTime, { color: colors.textSecondary }]}>
                      {formatWhen(event)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
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
  const { user } = useAuth();

  const [view, setView] = useState<"list" | "map">("list");
  const [range, setRange] = useState<Range>("week");
  const [mode, setMode] = useState<Mode>("all");
  const [distance, setDistance] = useState<DistanceFilter>("all");
  const [eventType, setEventType] = useState<EventType>("all");
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

  // Connections modal state
  const [connectionsModalVisible, setConnectionsModalVisible] = useState(false);
  const [selectedEventConnections, setSelectedEventConnections] = useState<{
    eventTitle: string;
    names: string[];
  } | null>(null);

  // Handle connections pill press - show modal with connection names
  const handleConnectionsPress = (eventTitle: string, names: string[]) => {
    setSelectedEventConnections({ eventTitle, names });
    setConnectionsModalVisible(true);
  };

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: number; status: string }) => {
      return eventsAPI.rsvp(eventId, status);
    },
    onSuccess: (_, { eventId, status }) => {
      setRsvpStatuses(prev => ({
        ...prev,
        [eventId]: status as RsvpStatus,
      }));
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
            // Clear RSVP
            setRsvpStatuses(prev => {
              const newStatuses = { ...prev };
              delete newStatuses[eventId];
              return newStatuses;
            });
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
            setRsvpStatuses(prev => {
              const newStatuses = { ...prev };
              delete newStatuses[eventId];
              return newStatuses;
            });
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

  const { data: rawData, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["events", { view, range, mode, distance, q, city, userLocation }],
    queryFn: () => fetchEvents({ range, mode, distance, q, city, userLocation }),
    staleTime: 2 * 60 * 1000, // 2 minutes - fresher data for better UX
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer (formerly cacheTime)
    refetchOnMount: 'always', // Always check for fresh data when mounting
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

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
    if (!rawData) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    return rawData.filter((event) => {
      // Only filter out explicitly private events
      if (event.isPrivate === true) {
        return false;
      }

      // Event type filter
      if (eventType !== "all") {
        const eventCategory = event.category || 'Sunday Service';
        if (eventCategory !== eventType) {
          return false;
        }
      }

      // "My Events" filter - show bookmarked OR events where user RSVP'd "going" or "maybe"
      // (not "not_going" - declining an event shouldn't add it to My Events)
      if (showMyEvents) {
        const isBookmarked = bookmarkedEvents.has(event.id);
        const rsvpStatus = rsvpStatuses[event.id];
        const isAttending = rsvpStatus === 'going' || rsvpStatus === 'maybe';
        if (!isBookmarked && !isAttending) {
          return false;
        }
      }

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
  }, [rawData, showMyEvents, bookmarkedEvents, rsvpStatuses, eventType]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (range !== "week") count++;
    if (mode !== "all") count++;
    if (distance !== "all") count++;
    if (eventType !== "all") count++;
    if (q.trim()) count++;
    if (city.trim()) count++;
    return count;
  }, [range, mode, distance, eventType, q, city]);

  const clearAllFilters = () => {
    setRange("week");
    setMode("all");
    setDistance("all");
    setEventType("all");
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
            style={{ maxHeight: 40 }}
            contentContainerStyle={styles.activeFiltersRow}
          >
            {range !== "week" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {range === "today" ? "Today" : range === "weekend" ? "Weekend" : range === "next" ? "Next Week" : "All"}
                </Text>
                <Pressable onPress={() => setRange("week")} hitSlop={8}>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {eventType !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{eventType}</Text>
                <Pressable onPress={() => setEventType("all")} hitSlop={8}>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {mode !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                  {mode === "inPerson" ? "In-Person" : "Online"}
                </Text>
                <Pressable onPress={() => setMode("all")} hitSlop={8}>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {distance !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{distance} mi</Text>
                <Pressable onPress={() => setDistance("all")} hitSlop={8}>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            {city.trim() && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{city}</Text>
                <Pressable onPress={() => setCity("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </Pressable>
              </View>
            )}
            <Pressable onPress={clearAllFilters} style={[styles.clearAllBtn, { borderColor: colors.textMuted }]}>
              <Text style={[styles.clearAllText, { color: colors.textMuted }]}>Clear</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Expanded Filters Panel - Compact Layout */}
        {filtersExpanded && (
          <View style={[styles.filtersPanel, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Row 1: Date Range */}
              <View style={styles.filterRow}>
                <Text style={[styles.filterRowLabel, { color: colors.textSecondary }]}>When</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                  {[
                    { key: "today", label: "Today" },
                    { key: "week", label: "This Week" },
                    { key: "weekend", label: "Weekend" },
                    { key: "next", label: "Next Week" },
                    { key: "all", label: "All" },
                  ].map((item) => (
                    <FilterChip
                      key={item.key}
                      label={item.label}
                      active={range === item.key}
                      onPress={() => setRange(item.key as Range)}
                      colors={colors}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Row 2: Event Type */}
              <View style={styles.filterRow}>
                <Text style={[styles.filterRowLabel, { color: colors.textSecondary }]}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                  {[
                    { key: "all", label: "All Types" },
                    { key: "Sunday Service", label: "Sunday Service" },
                    { key: "Worship", label: "Worship" },
                    { key: "Bible Study", label: "Bible Study" },
                    { key: "Social", label: "Social" },
                    { key: "Service", label: "Service" },
                    { key: "Prayer", label: "Prayer" },
                  ].map((item) => (
                    <FilterChip
                      key={item.key}
                      label={item.label}
                      active={eventType === item.key}
                      onPress={() => setEventType(item.key as EventType)}
                      colors={colors}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Row 3: Format & Distance combined */}
              <View style={styles.filterRow}>
                <Text style={[styles.filterRowLabel, { color: colors.textSecondary }]}>Format</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                  <FilterChip label="All" active={mode === "all"} onPress={() => setMode("all")} colors={colors} />
                  <FilterChip label="In-Person" active={mode === "inPerson"} onPress={() => setMode("inPerson")} icon="location-outline" colors={colors} />
                  <FilterChip label="Online" active={mode === "online"} onPress={() => setMode("online")} icon="videocam-outline" colors={colors} />
                </ScrollView>
              </View>

              {/* Row 4: Distance */}
              <View style={styles.filterRow}>
                <Text style={[styles.filterRowLabel, { color: colors.textSecondary }]}>Distance</Text>
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 12 }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                    <FilterChip label="Any" active={distance === "all"} onPress={() => setDistance("all")} colors={colors} />
                    <FilterChip label="5 mi" active={distance === "5"} onPress={() => handleDistanceFilterChange("5")} colors={colors} />
                    <FilterChip label="10 mi" active={distance === "10"} onPress={() => handleDistanceFilterChange("10")} colors={colors} />
                    <FilterChip label="25 mi" active={distance === "25"} onPress={() => handleDistanceFilterChange("25")} colors={colors} />
                    <FilterChip label="50 mi" active={distance === "50"} onPress={() => handleDistanceFilterChange("50")} colors={colors} />
                  </ScrollView>
                )}
              </View>

              {/* Row 5: City Search */}
              <View style={styles.filterRow}>
                <Text style={[styles.filterRowLabel, { color: colors.textSecondary }]}>City</Text>
                <View
                  style={[
                    styles.compactInputWrap,
                    { backgroundColor: colors.background, borderColor: colors.borderSubtle },
                  ]}
                >
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="Search city..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.compactInput, { color: colors.textPrimary }]}
                    returnKeyType="done"
                    onSubmitEditing={() => refetch()}
                  />
                  {city.length > 0 && (
                    <Pressable onPress={() => setCity("")} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.filterActionsCompact}>
                <Pressable
                  onPress={clearAllFilters}
                  style={[styles.filterActionBtnCompact, { borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.filterActionTextCompact, { color: colors.textSecondary }]}>Clear</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setFiltersExpanded(false);
                    refetch();
                  }}
                  style={[styles.filterActionBtnCompact, styles.filterActionBtnPrimaryCompact, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.filterActionTextCompact, { color: colors.primaryForeground }]}>Apply</Text>
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
          <EventMapView
            data={data}
            userLocation={userLocation}
            locationPermissionGranted={locationPermissionGranted}
            theme={theme}
            colors={colors}
            router={router}
          />
        ) : isLoading && !rawData ? (
          // Initial loading state - show loading indicator
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading events...
            </Text>
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingBottom: 18, flexGrow: 1 }}
            ListEmptyComponent={
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
            }
            renderItem={({ item }) => (
              <EventCard
                item={item}
                colors={colors}
                onPress={() => router.push({ pathname: "/events/[id]", params: { id: String(item.id) } })}
                rsvpStatus={rsvpStatuses[item.id]}
                onRsvpPress={() => handleRsvpPress(item.id)}
                isBookmarked={bookmarkedEvents.has(item.id)}
                onBookmarkPress={() => handleBookmarkPress(item.id)}
                onConnectionsPress={
                  item.connectionsGoing?.count
                    ? () => handleConnectionsPress(item.title, item.connectionsGoing?.names || [])
                    : undefined
                }
              />
            )}
            refreshing={isFetching && !!rawData}
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
      </View>

      {/* Connections Going Modal */}
      <Modal
        visible={connectionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConnectionsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setConnectionsModalVisible(false)}
        >
          <Pressable
            style={[styles.connectionsModal, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.connectionsModalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.connectionsModalTitle, { color: colors.textPrimary }]}>
                  Connections Going
                </Text>
                {selectedEventConnections && (
                  <Text style={[styles.connectionsModalSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                    {selectedEventConnections.eventTitle}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setConnectionsModalVisible(false)}
                hitSlop={12}
                style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Connection List */}
            <ScrollView style={styles.connectionsModalList}>
              {selectedEventConnections?.names.map((name, index) => (
                <View
                  key={index}
                  style={[
                    styles.connectionItem,
                    { borderBottomColor: colors.borderSubtle },
                    index === selectedEventConnections.names.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.connectionAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.connectionName, { color: colors.textPrimary }]}>
                    {name}
                  </Text>
                  <View style={[styles.goingBadge, { backgroundColor: '#22C55E20' }]}>
                    <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                    <Text style={[styles.goingBadgeText, { color: '#22C55E' }]}>Going</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Empty state */}
            {(!selectedEventConnections?.names || selectedEventConnections.names.length === 0) && (
              <View style={styles.emptyConnections}>
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyConnectionsText, { color: colors.textSecondary }]}>
                  No connections going yet
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 8,
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
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Filters Panel (expanded state) - Compact Layout
  filtersPanel: {
    maxHeight: 320,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 16,
  },
  filterRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    width: 56,
  },
  filterScrollContent: {
    paddingRight: 16,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  compactInputWrap: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  compactInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  filterActionsCompact: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  filterActionBtnCompact: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActionBtnPrimaryCompact: {
    borderWidth: 0,
  },
  filterActionTextCompact: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Legacy styles (kept for compatibility)
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
    paddingVertical: 8,
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
  posterImage: {
    width: '100%',
    height: '100%',
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
  connectionsChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  connectionsText: { fontSize: 10, fontWeight: "600" },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '500',
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
  clusterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  clusterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clusterModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  clusterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  clusterModalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  clusterModalList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  clusterEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  clusterEventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  clusterEventInfo: {
    flex: 1,
  },
  clusterEventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  clusterEventTime: {
    fontSize: 13,
    marginTop: 2,
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

  // Connections Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  connectionsModal: {
    maxHeight: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  connectionsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  connectionsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  connectionsModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionsModalList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  connectionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectionName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  goingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  goingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyConnections: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyConnectionsText: {
    fontSize: 15,
    marginTop: 12,
  },
});
