/**
 * Apologetics Library Post Detail Screen - GotQuestions UX
 * GOAL: User gets a reliable answer in under 60 seconds
 *
 * Structured content order:
 * 1. TL;DR (quick answer at top)
 * 2. Key Points (3-5 bullets)
 * 3. Scripture References (if any)
 * 4. Short Answer (full bodyMarkdown)
 * 5. Perspectives (collapsed/expandable)
 * 6. Sources (collapsed/expandable)
 */

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
import { AppHeader } from "../../src/screens/AppHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import apiClient from "../../src/lib/apiClient";
import Markdown from "react-native-markdown-display";
import { fetchBiblePassage, looksLikeBibleReference } from "../../src/lib/bibleApi";

type LibraryPostSource = {
  author: string;
  title: string;
  publisher?: string;
  year?: number;
  url?: string;
};

type LibraryPost = {
  id: number;
  domain: "apologetics" | "polemics";
  title: string;
  tldr: string | null;
  keyPoints: string[];
  scriptureRefs: string[];
  bodyMarkdown: string;
  perspectives: string[];
  sources: LibraryPostSource[];
  authorDisplayName: string;
  area?: { id: number; name: string };
  tag?: { id: number; name: string };
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get(path);
  return res.data as T;
}

export default function ApologeticsDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();

  const [perspectivesExpanded, setPerspectivesExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [showVerseModal, setShowVerseModal] = useState(false);
  const [verseData, setVerseData] = useState<{ reference: string; text: string; translation: string } | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  // Handle scripture reference press
  const handleScripturePress = useCallback(async (reference: string) => {
    setShowVerseModal(true);
    setVerseLoading(true);
    setVerseData(null);

    const result = await fetchBiblePassage(reference);
    setVerseData({
      reference: result.reference,
      text: result.text,
      translation: result.translation || 'WEB',
    });
    setVerseLoading(false);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["library-post", id],
    queryFn: () => apiGet<LibraryPost>(`/api/library/posts/${id}`),
    staleTime: 60_000,
  });

  const styles = getStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Article not found</Text>
          <Text style={styles.errorBody}>
            This article may have been removed or doesn't exist.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

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

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/apologetics" as any)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Apologetics</Text>
        </Pressable>

        {/* Breadcrumb */}
        {(data.area || data.tag) && (
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>{data.area?.name}</Text>
            {data.tag && (
              <>
                <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                <Text style={styles.breadcrumbText}>{data.tag.name}</Text>
              </>
            )}
          </View>
        )}

        {/* Title */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>{data.title}</Text>
          <View style={styles.authorMeta}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.authorText}>{data.authorDisplayName}</Text>
          </View>
        </View>

        {/* 1. TL;DR (Quick Answer) */}
        {data.tldr && (
          <View style={styles.tldrCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Quick Answer</Text>
            </View>
            <Text style={styles.tldrText}>{data.tldr}</Text>
          </View>
        )}

        {/* 2. Key Points */}
        {data.keyPoints && data.keyPoints.length > 0 && (
          <View style={styles.keyPointsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Key Points</Text>
            </View>
            {data.keyPoints.map((point, idx) => (
              <View key={idx} style={styles.keyPointItem}>
                <View style={styles.keyPointBullet}>
                  <Text style={styles.keyPointBulletText}>{idx + 1}</Text>
                </View>
                <Text style={styles.keyPointText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 3. Scripture References - Tappable */}
        {data.scriptureRefs && data.scriptureRefs.length > 0 && (
          <View style={styles.scriptureCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Scripture References</Text>
            </View>
            <View style={styles.scriptureList}>
              {data.scriptureRefs.map((ref, idx) => (
                <Pressable
                  key={idx}
                  style={({ pressed }) => [
                    styles.scriptureBadge,
                    pressed && { opacity: 0.7, backgroundColor: colors.surfaceMuted },
                  ]}
                  onPress={() => handleScripturePress(ref)}
                >
                  <Text style={styles.scriptureText}>{ref}</Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* 4. Short Answer (Full Content) */}
        <View style={styles.answerCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Detailed Answer</Text>
          </View>
          <Markdown style={markdownStyles(colors)}>
            {data.bodyMarkdown}
          </Markdown>
        </View>

        {/* 5. Perspectives (Collapsible) */}
        {data.perspectives && data.perspectives.length > 0 && (
          <View style={styles.collapsibleCard}>
            <Pressable
              style={styles.collapsibleHeader}
              onPress={() => setPerspectivesExpanded(!perspectivesExpanded)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="people" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Perspectives ({data.perspectives.length})</Text>
              </View>
              <Ionicons
                name={perspectivesExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
            {perspectivesExpanded && (
              <View style={styles.collapsibleContent}>
                {data.perspectives.map((perspective, idx) => (
                  <View key={idx} style={styles.perspectiveItem}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                    <Text style={styles.perspectiveText}>{perspective}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 6. Sources (Collapsible) */}
        {data.sources && data.sources.length > 0 && (
          <View style={styles.collapsibleCard}>
            <Pressable
              style={styles.collapsibleHeader}
              onPress={() => setSourcesExpanded(!sourcesExpanded)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="library" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Sources ({data.sources.length})</Text>
              </View>
              <Ionicons
                name={sourcesExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
            {sourcesExpanded && (
              <View style={styles.collapsibleContent}>
                {data.sources.map((source, idx) => (
                  <View key={idx} style={styles.sourceItem}>
                    <View style={styles.sourceBullet}>
                      <Text style={styles.sourceBulletText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.sourceContent}>
                      <Text style={styles.sourceTitle}>{source.title}</Text>
                      <Text style={styles.sourceAuthor}>
                        {source.author}
                        {source.year && ` (${source.year})`}
                        {source.publisher && ` • ${source.publisher}`}
                      </Text>
                      {source.url && (
                        <Text style={styles.sourceUrl} numberOfLines={1}>
                          {source.url}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Ask Question CTA */}
        <View style={styles.ctaCard}>
          <Ionicons name="mail-outline" size={32} color={colors.primary} />
          <Text style={styles.ctaTitle}>Have a question?</Text>
          <Text style={styles.ctaBody}>
            Submit your apologetics question and get answers from the Connection Research Team.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/questions/ask" as any)}
          >
            <Text style={styles.primaryButtonText}>Ask the Connection Research Team</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Verse Modal */}
      <Modal
        visible={showVerseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerseModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowVerseModal(false)}
        >
          <Pressable style={[styles.verseModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.verseModalHeader}>
              <Ionicons name="book" size={20} color={colors.primary} />
              <Text style={[styles.verseModalTitle, { color: colors.textPrimary }]}>
                {verseData?.reference || 'Loading...'}
              </Text>
              <Pressable
                onPress={() => setShowVerseModal(false)}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {verseLoading ? (
              <View style={styles.verseModalLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.verseModalLoadingText, { color: colors.textMuted }]}>
                  Loading passage...
                </Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.verseModalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.verseModalText, { color: colors.textPrimary }]}>
                    {verseData?.text}
                  </Text>
                </ScrollView>
                {verseData?.translation && (
                  <Text style={[styles.verseModalAttribution, { color: colors.textMuted }]}>
                    {verseData.translation}
                  </Text>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function markdownStyles(colors: any) {
  return StyleSheet.create({
    body: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 12,
    },
    heading2: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginTop: 18,
      marginBottom: 10,
    },
    heading3: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      marginBottom: 12,
    },
    listUnorderedItemIcon: {
      color: colors.primary,
    },
    listOrderedItemIcon: {
      color: colors.primary,
    },
    strong: {
      fontWeight: '700',
      color: colors.textPrimary,
    },
    em: {
      fontStyle: 'italic',
    },
    code_inline: {
      backgroundColor: colors.surfaceMuted,
      color: colors.primary,
      fontFamily: 'monospace',
      fontSize: 14,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
  });
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
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
    },
    errorBody: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    breadcrumb: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
    },
    breadcrumbText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500",
    },
    titleCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      lineHeight: 32,
      marginBottom: 12,
    },
    authorMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    authorText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tldrCard: {
      backgroundColor: colors.backgroundSoft,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    tldrText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    keyPointsCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    keyPointItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 14,
    },
    keyPointBullet: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    keyPointBulletText: {
      color: colors.primaryForeground,
      fontSize: 12,
      fontWeight: "700",
    },
    keyPointText: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    scriptureCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    scriptureList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    scriptureBadge: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    scriptureText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    answerCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    collapsibleCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      marginBottom: 16,
      overflow: "hidden",
    },
    collapsibleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    collapsibleContent: {
      padding: 16,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    perspectiveItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    perspectiveText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    sourceItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    sourceBullet: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      marginTop: 2,
    },
    sourceBulletText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },
    sourceContent: {
      flex: 1,
    },
    sourceTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    sourceAuthor: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    sourceUrl: {
      fontSize: 12,
      color: colors.primary,
    },
    ctaCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.primary,
      borderWidth: 2,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 12,
      marginTop: 8,
    },
    ctaTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    ctaBody: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    primaryButton: {
      backgroundColor: colors.buttonPrimaryBg,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 8,
    },
    primaryButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: 14,
      fontWeight: "600",
    },
    // Verse Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    verseModalContent: {
      width: '100%',
      maxWidth: 360,
      maxHeight: '70%',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    verseModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    verseModalTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
    },
    verseModalScroll: {
      maxHeight: 300,
    },
    verseModalText: {
      fontSize: 16,
      lineHeight: 26,
      fontStyle: 'italic',
    },
    verseModalAttribution: {
      fontSize: 12,
      marginTop: 16,
      textAlign: 'right',
      fontWeight: '500',
    },
    verseModalLoading: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 12,
    },
    verseModalLoadingText: {
      fontSize: 14,
    },
  });
}
