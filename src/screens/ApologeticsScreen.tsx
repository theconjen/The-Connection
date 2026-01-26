/* =========================================
   Apologetics Screen - GotQuestions UX
   GOAL: User gets a reliable answer in under 60 seconds

   LIST SCREEN:
   - Dominant search bar (debounced)
   - Domain toggle: Apologetics | Polemics
   - Area chips, Tag chips (conditional on area)
   - Suggested Searches (8-12 buttons) when empty
   - Result cards: Title, TL;DR preview, Breadcrumb, "Verified Sources", "Connection Research Team"
   - "Ask the Connection Research Team" CTA when no results
   ========================================= */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/apiClient";
import { shareApologetics } from "../lib/shareUrls";

type Domain = "apologetics" | "polemics";

type QaArea = {
  id: number;
  name: string;
  slug: string;
  domain: Domain;
};

type QaTag = {
  id: number;
  name: string;
  slug: string;
  areaId: number;
};

type LibraryPostListItem = {
  id: number;
  domain: Domain;
  title: string;
  tldr: string | null;
  perspectives: string[];
  authorDisplayName: string;
  publishedAt: string | null;
  area?: { id: number; name: string; slug: string };
  tag?: { id: number; name: string; slug: string };
};

// Suggested searches for GotQuestions UX
const SUGGESTED_SEARCHES = {
  apologetics: [
    "Evidence for the Resurrection",
    "Historical reliability of the Bible",
    "Problem of evil",
    "Is faith rational?",
    "Did Jesus claim to be God?",
    "Trinity explained",
    "Science and Christianity",
    "Prophecies fulfilled by Jesus",
    "Reliability of Gospel accounts",
    "Archaeological evidence for the Bible",
    "Moral argument for God",
    "Near-death experiences",
  ],
  polemics: [
    "Problem of evil",
    "Moral relativism",
    "Allah vs Yahweh",
    "Biblical contradictions",
    "Crusades and violence",
    "Old Testament genocide",
    "Hell and justice",
    "Exclusivity of Christianity",
    "Evolution and creation",
    "Suffering and God's goodness",
    "Religious pluralism",
    "Science vs faith",
  ],
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get(path);
  return res.data as T;
}

interface ApologeticsScreenProps {
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
  onMenuPress?: () => void;
  userName?: string;
  userAvatar?: string | null;
  unreadNotificationCount?: number;
  unreadMessageCount?: number;
}

export default function ApologeticsScreen({
  onProfilePress,
  onMessagesPress,
  onMenuPress,
  userName,
  userAvatar,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
}: ApologeticsScreenProps = {}) {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();

  const [domain, setDomain] = useState<Domain>("apologetics");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  const styles = useMemo(() => getStyles(colors), [colors]);
  const queryClient = useQueryClient();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch areas (gracefully handle 404 if endpoint not deployed)
  const areasQ = useQuery({
    queryKey: ["qa-areas", domain],
    queryFn: async () => {
      try {
        return await apiGet<QaArea[]>(`/api/qa-areas?domain=${domain}`);
      } catch (err: any) {
        // Silently return empty if endpoint doesn't exist
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  // Fetch tags for selected area (gracefully handle 404 if endpoint not deployed)
  const tagsQ = useQuery({
    queryKey: ["qa-tags", selectedAreaId],
    queryFn: async () => {
      if (!selectedAreaId) return [] as QaTag[];
      try {
        return await apiGet<QaTag[]>(`/api/qa-tags?areaId=${selectedAreaId}`);
      } catch (err: any) {
        // Silently return empty if endpoint doesn't exist
        if (err?.response?.status === 404) return [];
        throw err;
      }
    },
    enabled: !!selectedAreaId,
    staleTime: 60_000,
    retry: false,
  });

  // Fetch library posts (GotQuestions data)
  const postsQ = useQuery({
    queryKey: ["library-posts", domain, debouncedQuery, selectedAreaId, selectedTagId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("domain", domain);
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (selectedAreaId) params.set("areaId", selectedAreaId.toString());
      if (selectedTagId) params.set("tagId", selectedTagId.toString());
      params.set("status", "published");
      params.set("limit", "50");

      const result = await apiGet<{ posts: { items: LibraryPostListItem[]; total: number } }>(
        `/api/library/posts?${params.toString()}`
      );
      // API returns { posts: { items: [...], total: N } }
      return result.posts?.items ?? [];
    },
    staleTime: 15_000,
  });

  const areas = areasQ.data ?? [];
  const tags = tagsQ.data ?? [];
  const posts = postsQ.data ?? [];

  function onSelectDomain(next: Domain) {
    setDomain(next);
    setSelectedAreaId(null);
    setSelectedTagId(null);
  }

  function onSelectArea(areaId: number) {
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
    setSelectedTagId(null);
  }

  function onSelectTag(tagId: number) {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }

  function onSuggestedSearch(searchTerm: string) {
    setQuery(searchTerm);
    setDebouncedQuery(searchTerm);
  }

  const showSuggestedSearches = !query.trim() && posts.length === 0 && !postsQ.isLoading;
  const suggestedSearches = SUGGESTED_SEARCHES[domain];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <AppHeader
        showCenteredLogo={true}
        userName={userName || user?.displayName || user?.username}
        userAvatar={userAvatar || user?.profileImageUrl || user?.avatarUrl}
        onProfilePress={onProfilePress}
        showMessages={true}
        onMessagesPress={onMessagesPress}
        showMenu={true}
        onMenuPress={onMenuPress}
        unreadNotificationCount={unreadNotificationCount}
        unreadMessageCount={unreadMessageCount}
      />

      <View style={styles.screen}>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions, topics, or Scripture passages..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!query && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Domain toggle */}
        <View style={styles.toggleWrap}>
          <SegmentButton
            label="Apologetics"
            active={domain === "apologetics"}
            onPress={() => onSelectDomain("apologetics")}
            colors={colors}
          />
          <SegmentButton
            label="Polemics"
            active={domain === "polemics"}
            onPress={() => onSelectDomain("polemics")}
            colors={colors}
          />
        </View>

        {/* Area chips */}
        {areas.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScrollView}
          >
            {areas.map((a) => (
              <Chip
                key={a.id}
                label={a.name}
                active={selectedAreaId === a.id}
                onPress={() => onSelectArea(a.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}

        {/* Tag chips (conditional on area) */}
        {selectedAreaId && tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScrollViewTags}
          >
            {tags.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                active={selectedTagId === t.id}
                onPress={() => onSelectTag(t.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}

        {/* Suggested Searches (when search empty) */}
        {showSuggestedSearches && (
          <View style={styles.suggestedWrap}>
            <Text style={styles.suggestedTitle}>Suggested Searches</Text>
            <View style={styles.suggestedGrid}>
              {suggestedSearches.slice(0, 12).map((term, idx) => (
                <Pressable
                  key={idx}
                  style={styles.suggestedButton}
                  onPress={() => onSuggestedSearch(term)}
                >
                  <Text style={styles.suggestedText}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        <FlatList
          data={posts}
          keyExtractor={(it) => it.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={postsQ.isFetching}
          onRefresh={() => postsQ.refetch()}
          ListEmptyComponent={
            !showSuggestedSearches ? (
              <View style={styles.empty}>
                <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>
                  {postsQ.error ? "Error loading" : "No results found"}
                </Text>
                <Text style={styles.emptyBody}>
                  {postsQ.error
                    ? `Failed to load: ${postsQ.error instanceof Error ? postsQ.error.message : 'Unknown error'}`
                    : "Try different keywords, or explore our suggested searches above."}
                </Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: '#0B132B' }]}
                  onPress={() => postsQ.error ? postsQ.refetch() : router.push("/questions/ask" as any)}
                >
                  <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                  <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>
                    {postsQ.error ? "Retry" : "Ask the Connection Research Team"}
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <LibraryPostCard
              item={item}
              colors={colors}
              onPress={() => router.push({ pathname: "/apologetics/[id]" as any, params: { id: item.id.toString() } })}
              onShare={async () => {
                const result = await shareApologetics(item.id, item.title, item.tldr || undefined);
                if (!result.success && result.error && result.error !== 'Share dismissed') {
                  Alert.alert('Share Failed', result.error);
                }
              }}
            />
          )}
        />

        {/* Sticky CTA */}
        {posts.length > 0 && (
          <View style={styles.stickyCtaWrap}>
            <Pressable
              style={[styles.stickyCta, { backgroundColor: '#0B132B' }]}
              onPress={() => router.push("/questions/ask" as any)}
            >
              <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
              <Text style={[styles.stickyCtaText, { color: '#FFFFFF' }]}>
                Ask the Connection Research Team
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Segment Button Component
function SegmentButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  // Active: dark filled, Inactive: white/transparent with border
  const activeBg = '#0B132B';
  const activeText = '#FFFFFF';
  const inactiveBg = '#FFFFFF';
  const inactiveText = '#0B132B';
  const inactiveBorder = '#DDD8D0';

  return (
    <Pressable
      onPress={onPress}
      style={[
        segStyles.btn,
        {
          backgroundColor: active ? activeBg : inactiveBg,
          borderColor: active ? activeBg : inactiveBorder,
        },
      ]}
    >
      <Text
        style={[
          segStyles.text,
          { color: active ? activeText : inactiveText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const segStyles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 14, fontWeight: '600' },
});

// Chip Component
function Chip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: colors.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          color: active ? colors.primaryForeground : colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Library Post Card (GotQuestions style)
function LibraryPostCard({
  item,
  colors,
  onPress,
  onShare,
}: {
  item: LibraryPostListItem;
  colors: any;
  onPress: () => void;
  onShare: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.backgroundSoft,
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Title */}
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          lineHeight: 24,
          fontWeight: '600',
        }}
        numberOfLines={3}
      >
        {item.title}
      </Text>

      {/* Breadcrumb */}
      {(item.area || item.tag) && (
        <Text
          style={{
            marginTop: 6,
            color: colors.textMuted,
            fontSize: 12,
          }}
          numberOfLines={1}
        >
          {item.area?.name}
          {item.tag && ` • ${item.tag.name}`}
        </Text>
      )}

      {/* TL;DR Preview */}
      {item.tldr && (
        <>
          <View style={{ marginTop: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text
              style={{
                color: colors.primary,
                fontSize: 12,
                fontWeight: '600',
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              Quick Answer
            </Text>
          </View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 15,
              lineHeight: 21,
            }}
            numberOfLines={4}
          >
            {item.tldr}
          </Text>
        </>
      )}

      {/* Footer */}
      <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
            Verified Sources
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>
            {item.authorDisplayName}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onShare();
            }}
            hitSlop={8}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
            })}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Perspectives badge (if multiple) */}
      {item.perspectives.length > 1 && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="people-outline" size={14} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {item.perspectives.length} perspectives included
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.header, // Match header color to extend to top of screen
    },
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 16,
    },

    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 48,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
    },

    toggleWrap: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
      marginBottom: 8,
    },

    chipsScrollView: {
      marginTop: 10,
      marginHorizontal: -16, // Extend to screen edges
    },
    chipsScrollViewTags: {
      marginTop: 6,
      marginHorizontal: -16, // Extend to screen edges
    },

    chipsRow: {
      paddingTop: 4,
      paddingBottom: 8, // Increased to show full chip border
      paddingLeft: 16,
      paddingRight: 24,
    },

    suggestedWrap: {
      marginTop: 20,
      marginBottom: 10,
    },
    suggestedTitle: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
      letterSpacing: 0.2,
    },
    suggestedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    suggestedButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 12,
    },
    suggestedText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '500',
    },

    listContent: {
      paddingTop: 16,
      paddingBottom: 120,
    },

    empty: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 24,
      marginTop: 20,
      alignItems: 'center',
    },
    emptyTitle: {
      marginTop: 12,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyBody: {
      marginTop: 8,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    primaryButton: {
      marginTop: 16,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    stickyCtaWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 16,
    },
    stickyCta: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    stickyCtaText: {
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
