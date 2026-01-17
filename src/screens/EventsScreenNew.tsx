import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import apiClient from "../lib/apiClient";

type Range = "today" | "week" | "weekend" | "next" | "all";
type Mode = "all" | "inPerson" | "online" | "local";

type EventItem = {
  id: number | string;
  title: string;
  startsAt: string; // ISO
  city?: string | null;
  state?: string | null;
  address?: string | null;
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
  q: string;
  city: string;
}) {
  const qs = new URLSearchParams();
  qs.set("range", params.range);
  qs.set("mode", params.mode);
  if (params.q.trim()) qs.set("q", params.q.trim());
  if (params.city.trim()) qs.set("city", params.city.trim());

  const res = await apiClient.get(`/api/events?${qs.toString()}`);
  return (res.data?.events ?? res.data ?? []) as EventItem[];
}

// ----- UI PIECES -----
function ChipRow<T extends string>({
  value,
  onChange,
  items,
  colors,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  colors: any;
}) {
  return (
    <View style={styles.chipRow}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <Pressable
            key={it.value}
            onPress={() => onChange(it.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.pillActiveBg : colors.pillInactiveBg,
                borderColor: active ? colors.pillActiveBorder : colors.pillInactiveBorder,
              },
            ]}
          >
            {it.icon ? (
              <Ionicons
                name={it.icon}
                size={14}
                color={active ? colors.pillActiveText : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
            ) : null}
            <Text
              style={[
                styles.chipText,
                { color: active ? colors.pillActiveText : colors.text },
              ]}
              numberOfLines={1}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
        { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
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
                ? { backgroundColor: colors.pillActiveBg }
                : { backgroundColor: "transparent" },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                { color: active ? colors.pillActiveText : colors.textSecondary },
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
  const d = new Date(iso);
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
    return d.toLocaleString();
  }
}

// Event type icon mapping
const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Sunday Service': 'church-outline',
  'Worship': 'musical-notes-outline',
  'Social': 'people-outline',
  'Service': 'hand-left-outline',
  'Bible Study': 'book-outline',
  'Prayer': 'prism-outline',
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
  const eventIcon = EVENT_TYPE_ICONS[eventType] || 'calendar-outline';
  const [gradientStart, gradientEnd] = EVENT_TYPE_GRADIENTS[eventType] || ['#4A5568', '#2D3748'];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Poster block with default gradient */}
      <View
        style={[
          styles.poster,
          item.posterUrl
            ? { backgroundColor: colors.cardNested, borderColor: colors.border }
            : { backgroundColor: gradientStart, borderColor: colors.border }
        ]}
      >
        {item.posterUrl ? (
          <View style={styles.posterImagePlaceholder}>
            <Text style={{ color: colors.textTertiary, fontWeight: "700" }}>
              Poster
            </Text>
          </View>
        ) : (
          <View style={styles.posterFallback}>
            {/* Event type icon */}
            <View style={styles.posterIconContainer}>
              <Ionicons name={eventIcon} size={32} color="rgba(255,255,255,0.9)" />
            </View>

            {/* Event type badge */}
            <View style={styles.posterTypeBadge}>
              <Text style={styles.posterTypeText}>{eventType}</Text>
            </View>
          </View>
        )}

        {/* Private badge */}
        {item.isPrivate ? (
          <View style={[styles.badge, { borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.9)' }]}>
            <Text style={[styles.badgeText, { color: '#1A1A1A' }]}>
              Private
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
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
            { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
          ]}
        >
          <Ionicons name={eventIcon} size={11} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[styles.categoryText, { color: colors.text }]} numberOfLines={1}>
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
              { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
            ]}
          >
            <Ionicons name="bookmark-outline" size={15} color={colors.text} />
          </Pressable>

          <Pressable
            hitSlop={10}
            onPress={() => {
              // TODO: going action
            }}
            style={[
              styles.iconAction,
              { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
            ]}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function EventsScreenNew() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [view, setView] = useState<"list" | "map">("list");
  const [range, setRange] = useState<Range>("week");
  const [mode, setMode] = useState<Mode>("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["events", { view, range, mode, q, city }],
    queryFn: () => fetchEvents({ range, mode, q, city }),
    staleTime: 30_000,
  });

  const rangeItems = useMemo(
    () => [
      { value: "today" as const, label: "Today" },
      { value: "week" as const, label: "This Week" },
      { value: "weekend" as const, label: "Weekend" },
      { value: "next" as const, label: "Next Week" },
      { value: "all" as const, label: "All" },
    ],
    []
  );

  const modeItems = useMemo(
    () => [
      { value: "all" as const, label: "All" },
      { value: "inPerson" as const, label: "In-person", icon: "location-outline" as const },
      { value: "online" as const, label: "Online", icon: "videocam-outline" as const },
      { value: "local" as const, label: "Local", icon: "navigate-outline" as const },
    ],
    []
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Events</Text>
        <Pressable
          onPress={() => router.push("/events/create")}
          style={[
            styles.headerBtn,
            { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
          ]}
        >
          <Ionicons name="add" size={16} color={colors.text} />
        </Pressable>
      </View>

      {/* Search row */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchInputWrap,
            { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
          ]}
        >
          <Ionicons name="search-outline" size={14} color={colors.textSecondary} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search events"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={() => refetch()}
          />
        </View>

        <View
          style={[
            styles.searchInputWrap,
            { backgroundColor: colors.pillInactiveBg, borderColor: colors.pillInactiveBorder },
          ]}
        >
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text }]}
            returnKeyType="done"
            onSubmitEditing={() => refetch()}
          />
        </View>
      </View>

      {/* Range chips + List/Map toggle */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <ChipRow value={range} onChange={setRange} items={rangeItems} colors={colors} />
        </View>
        <ToggleTabs value={view} onChange={setView} leftLabel="List" rightLabel="Map" colors={colors} />
      </View>

      {/* Mode filters */}
      <ChipRow value={mode} onChange={setMode} items={modeItems} colors={colors} />

      {/* Body */}
      {view === "map" ? (
        <View
          style={[
            styles.mapPlaceholder,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>
            Map view goes here (full screen map with pins)
          </Text>
          <Text style={{ color: colors.textTertiary, marginTop: 6 }}>
            Keep list as default. Map should be a deliberate toggle.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingBottom: 18 }}
          ListEmptyComponent={
            <View
              style={[
                styles.empty,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
                No events found
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6, lineHeight: 18 }}>
                Try changing the date range, removing filters, or searching a nearby city.
              </Text>
              <Pressable
                onPress={() => router.push("/events/create")}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: "900" }}>Create an event</Text>
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchInputWrap: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Platform.select({ ios: 8, android: 6, default: 6 }),
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 2,
  },

  chipRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    paddingVertical: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "800" },

  toggleWrap: {
    width: 120,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: { fontSize: 12, fontWeight: "900" },

  card: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },

  poster: {
    height: 100,
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
  posterTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  posterTypeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  posterTitle: { fontSize: 16, fontWeight: "900", lineHeight: 20 },

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
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  metaText: { fontSize: 12, fontWeight: "600" },

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
  categoryText: { fontSize: 10, fontWeight: "900" },

  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  mapPlaceholder: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    height: 240,
    justifyContent: "center",
  },

  empty: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
