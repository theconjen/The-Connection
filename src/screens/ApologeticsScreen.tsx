/* =========================================
   Apologetics Screen (Layout B)
   - No custom hero header (uses your standard header)
   - Search under header
   - Domain toggle: Apologetics | Polemics
   - Area chips (scroll)
   - Tag chips (dependent on selected area)
   - Wikipedia-style Q&A cards
   - Author line ALWAYS: "Connection Research Team"
   - Uses useTheme() pattern
   - Uses TanStack Query
   ========================================= */

import React, { useMemo, useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/apiClient";

type Domain = "apologetics" | "polemics";

type Area = { id: string; name: string; domain: Domain };
type Tag = { id: string; name: string; areaId: string };

type QAItem = {
  id: string;
  question: string;
  areaName: string;
  tagName: string;
  answer: string;
  sources: string[]; // short strings for now
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get(path);
  return res.data as T;
}

/**
 * Expected endpoints (adjust to match your server):
 * - GET /api/qa/areas?domain=apologetics|polemics  -> Area[]
 * - GET /api/qa/areas/:id/tags                    -> Tag[]
 * - GET /api/apologetics/feed?...                 -> QAItem[]
 */
function buildFeedUrl(params: {
  domain: Domain;
  q: string;
  areaId?: string | null;
  tagId?: string | null;
}) {
  const qs = new URLSearchParams();
  qs.set("domain", params.domain);
  if (params.q.trim()) qs.set("q", params.q.trim());
  if (params.areaId) qs.set("areaId", params.areaId);
  // Tags disabled until refined
  // if (params.tagId) qs.set("tagId", params.tagId);
  return `/api/apologetics/feed?${qs.toString()}`;
}

export default function ApologeticsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [domain, setDomain] = useState<Domain>("apologetics");
  const [query, setQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const styles = useMemo(() => getStyles(colors), [colors]);

  const areasQ = useQuery({
    queryKey: ["qa-areas", domain],
    queryFn: () => apiGet<Area[]>(`/api/qa/areas?domain=${domain}`),
    staleTime: 60_000,
  });

  const tagsQ = useQuery({
    queryKey: ["qa-tags", selectedAreaId],
    queryFn: () =>
      selectedAreaId
        ? apiGet<Tag[]>(`/api/qa/areas/${selectedAreaId}/tags`)
        : Promise.resolve([] as Tag[]),
    enabled: !!selectedAreaId,
    staleTime: 60_000,
  });

  const feedUrl = useMemo(
    () =>
      buildFeedUrl({
        domain,
        q: query,
        areaId: selectedAreaId,
        tagId: selectedTagId,
      }),
    [domain, query, selectedAreaId, selectedTagId]
  );

  const feedQ = useQuery({
    queryKey: ["apologetics-feed", feedUrl],
    queryFn: () => apiGet<QAItem[]>(feedUrl),
    staleTime: 15_000,
  });

  const areas = areasQ.data ?? [];
  const tags = tagsQ.data ?? [];
  const feed = feedQ.data ?? [];

  function onSelectDomain(next: Domain) {
    setDomain(next);
    setSelectedAreaId(null);
    setSelectedTagId(null);
  }

  function onSelectArea(areaId: string) {
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
    setSelectedTagId(null);
  }

  function onSelectTag(tagId: string) {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <AppHeader
        showCenteredLogo={true}
        userName={user?.displayName || user?.username}
        userAvatar={user?.profileImageUrl}
        onProfilePress={() => router.push("/profile" as any)}
        showMessages={true}
        onMessagesPress={() => router.push("/messages" as any)}
        showMenu={true}
        onMenuPress={() => router.push("/menu" as any)}
      />

      <View style={styles.screen}>
        {/* Search (first element under header) */}
        <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search questions, topics, or passages…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
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

      {/* Tag chips (dependent on area) - HIDDEN UNTIL REFINED */}
      {/* {selectedAreaId ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
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
      ) : null} */}

      {/* Cards */}
      <FlatList
        data={feed}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        refreshing={feedQ.isFetching}
        onRefresh={() => feedQ.refetch()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {feedQ.error ? "Error loading" : "No results"}
            </Text>
            <Text style={styles.emptyBody}>
              {feedQ.error
                ? `Failed to load: ${feedQ.error instanceof Error ? feedQ.error.message : 'Unknown error'}`
                : "Try different keywords, or pick an Area to narrow your search."}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => feedQ.error ? feedQ.refetch() : router.push("/questions/ask" as any)}
            >
              <Text style={styles.primaryButtonText}>
                {feedQ.error ? "Retry" : "Ask a question"}
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <AnswerCard
            item={item}
            colors={colors}
            onPress={() => router.push({ pathname: "/apologetics/[id]" as any, params: { id: item.id } })}
          />
        )}
      />

      {/* Sticky CTA */}
      <View style={styles.stickyCtaWrap}>
        <Pressable
          style={styles.stickyCta}
          onPress={() => router.push("/questions/ask" as any)}
        >
          <Ionicons name="help-circle-outline" size={18} color={colors.textInverse} />
          <Text style={styles.stickyCtaText}>Ask an Apologetics Question</Text>
        </Pressable>
      </View>
      </View>
    </SafeAreaView>
  );
}

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
  return (
    <Pressable
      onPress={onPress}
      style={[
        segStyles.btn,
        {
          backgroundColor: active ? colors.buttonPrimaryBg : colors.surfaceMuted,
          borderColor: active ? colors.buttonPrimaryBg : colors.borderSubtle,
        },
      ]}
    >
      <Text
        style={[
          segStyles.text,
          { color: active ? colors.buttonPrimaryText : colors.textPrimary },
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
  text: { fontSize: 13, fontWeight: '600' },
});

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
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.buttonPrimaryBg : colors.borderSubtle,
        backgroundColor: active ? colors.buttonPrimaryBg : colors.surfaceMuted,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? colors.buttonPrimaryText : colors.textPrimary,
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

function AnswerCard({
  item,
  colors,
  onPress,
}: {
  item: QAItem;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.backgroundSoft,
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      {/* Question */}
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          lineHeight: 24,
          fontWeight: '600',
        }}
        numberOfLines={3}
      >
        {item.question}
      </Text>

      {/* Breadcrumb */}
      <Text
        style={{
          marginTop: 6,
          color: colors.textMuted,
          fontSize: 12,
        }}
        numberOfLines={1}
      >
        {item.areaName}
      </Text>

      {/* Answer label */}
      <Text
        style={{
          marginTop: 12,
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.2,
        }}
      >
        Answer from verified sources
      </Text>

      {/* Answer preview */}
      <Text
        style={{
          marginTop: 6,
          color: colors.textPrimary,
          fontSize: 15,
          lineHeight: 21,
        }}
        numberOfLines={5}
      >
        {item.answer}
      </Text>

      {/* Author line (hardcoded per your requirement) */}
      <Text
        style={{
          marginTop: 10,
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
        }}
      >
        — Connection Research Team
      </Text>

      {/* Sources */}
      {item.sources?.length ? (
        <View style={{ marginTop: 10 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            Sources
          </Text>
          {item.sources.slice(0, 3).map((s, idx) => (
            <Text
              key={`${item.id}-src-${idx}`}
              style={{
                marginTop: 4,
                color: colors.textMuted,
                fontSize: 12,
                lineHeight: 16,
              }}
              numberOfLines={2}
            >
              • {s}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
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
      gap: 8,
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
    },

    toggleWrap: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      marginBottom: 6,
    },

    chipsScrollView: {
      marginTop: 8,
    },

    chipsRow: {
      paddingTop: 12,
      paddingBottom: 12,
      paddingRight: 16,
    },

    listContent: {
      paddingTop: 6,
      paddingBottom: 110, // space for sticky CTA
    },

    empty: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginTop: 12,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyBody: {
      marginTop: 6,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    primaryButton: {
      marginTop: 12,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.buttonPrimaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: colors.buttonPrimaryText,
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
      backgroundColor: colors.buttonPrimaryBg,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 14,
    },
    stickyCtaText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
