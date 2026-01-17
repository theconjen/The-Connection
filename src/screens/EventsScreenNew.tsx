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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { AppHeader } from "./AppHeader";
import apiClient from "../lib/apiClient";
import { getCurrentLocation, hasLocationPermission, requestLocationPermission, type UserLocation } from "../services/locationService";

// Custom church icon
const ChurchIcon = require("../../assets/church-icon.png");

type Range = "today" | "week" | "weekend" | "next" | "all";
type Mode = "all" | "inPerson" | "online";
type DistanceFilter = "all" | "5" | "10" | "20" | "50" | "100";

type EventItem = {
  id: number | string;
  title: string;
  startsAt: string; // ISO
  city?: string | null;
  state?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isOnline?: boolean;
  distanceMiles?: number | null;
  posterUrl?: string | null;
  category?: string | null; // "Worship", "Bible Study", "Apologetics"
  isPrivate?: boolean;
  attendingCount?: number | null;
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

function formatWhen(iso: string) {
  if (!iso) return "Date TBD";

  const d = new Date(iso);

  // Check if date is valid
  if (isNaN(d.getTime())) return "Date TBD";

  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  try {
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  } catch {
    return "Date TBD";
  }
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

function EventCard({
  item,
  colors,
  onPress,
}: {
  item: EventItem;
  colors: any;
  onPress: () => void;
}) {
  const locationLine = item.isOnline
    ? "Online"
    : [item.city, item.state].filter(Boolean).join(", ");

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
          {formatWhen(item.startsAt)}
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
          <Pressable
            hitSlop={10}
            onPress={() => {
              // TODO: save action
            }}
            style={[
              styles.iconAction,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
            ]}
          >
            <Ionicons name="bookmark-outline" size={15} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => {
              // TODO: going action
            }}
            style={[
              styles.iconAction,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSoft },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function EventsScreenNew() {
  const router = useRouter();
  const { colors, theme, radii } = useTheme();
  const { user } = useAuth();

  const [view, setView] = useState<"list" | "map">("list");
  const [range, setRange] = useState<Range>("week");
  const [mode, setMode] = useState<Mode>("all");
  const [distance, setDistance] = useState<DistanceFilter>("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // Navigation handlers
  const onProfilePress = () => router.push("/(tabs)/profile");
  const onMessagesPress = () => router.push("/messages");
  const onMenuPress = () => {
    // Menu will be handled by parent or context
  };

  const userName = user?.displayName || user?.username || "";
  const userAvatar = user?.profileImageUrl || null;

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

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", { view, range, mode, distance, q, city, userLocation }],
    queryFn: () => fetchEvents({ range, mode, distance, q, city, userLocation }),
    staleTime: 30_000,
  });

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
      <StatusBar barStyle="light-content" />

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
        leftElement={
          <Pressable
            onPress={() => router.push("/events/create")}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
              borderRadius: radii.full,
            })}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>
        }
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
              <View style={[styles.activeFilterPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
                  {range === "today" ? "Today" : range === "weekend" ? "Weekend" : range === "next" ? "Next Week" : "All"}
                </Text>
                <Pressable onPress={() => setRange("week")} hitSlop={4}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            )}
            {mode !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
                  {mode === "inPerson" ? "In-Person" : "Online"}
                </Text>
                <Pressable onPress={() => setMode("all")} hitSlop={4}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            )}
            {distance !== "all" && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
                <Ionicons name="navigate-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>
                  Within {distance} mi
                </Text>
                <Pressable onPress={() => setDistance("all")} hitSlop={4} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            )}
            {city.trim() && (
              <View style={[styles.activeFilterPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
                <Ionicons name="location-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.activeFilterText, { color: colors.textPrimary }]}>{city}</Text>
                <Pressable onPress={() => setCity("")} hitSlop={4} style={{ marginLeft: 4 }}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            )}
            <Pressable onPress={clearAllFilters} style={[styles.clearAllBtn, { borderColor: colors.borderSubtle }]}>
              <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>Clear All</Text>
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

        {/* View Toggle */}
        <View style={styles.viewToggleRow}>
          <ToggleTabs value={view} onChange={setView} leftLabel="List" rightLabel="Map" colors={colors} />

          {/* Results count */}
          {!isLoading && data && (
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {data.length} {data.length === 1 ? 'event' : 'events'}
            </Text>
          )}
        </View>

        {/* Body */}
        {view === "map" ? (
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
                  description={formatWhen(event.startsAt)}
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
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingBottom: 18 }}
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
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
    paddingVertical: 8,
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
});
