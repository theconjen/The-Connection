/**
 * Perspective Article Detail Screen
 * Shows a tradition-specific perspective on an apologetics library post.
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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/theme";
import { AppHeader } from "../../../src/screens/AppHeader";
import { useAuth } from "../../../src/contexts/AuthContext";
import { MenuDrawer } from "../../../src/components/MenuDrawer";
import { perspectivesAPI } from "../../../src/lib/apiClient";
import Markdown from "react-native-markdown-display";

type PerspectiveDetail = {
  id: number;
  tradition: string;
  authorDisplayName: string;
  bodyMarkdown: string;
  scriptureRefs: string[];
  sources: Array<{ author: string; title: string; publisher?: string; year?: number; url?: string }>;
  publishedAt: string | null;
  parentPostId: number;
  parentPostTitle: string;
  authorProfile?: {
    credentials: string;
    bio: string;
  };
};

export default function PerspectiveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const { data, isLoading, error } = useQuery<PerspectiveDetail>({
    queryKey: ["perspective", id],
    queryFn: () => perspectivesAPI.getById(Number(id)),
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
          userAvatar={user?.profileImageUrl || user?.avatarUrl}
          onProfilePress={() => router.push("/profile" as any)}
          showMessages={true}
          onMessagesPress={() => router.push("/messages" as any)}
          showMenu={true}
          onMenuPress={() => setMenuVisible(true)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading perspective...</Text>
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
          userAvatar={user?.profileImageUrl || user?.avatarUrl}
          onProfilePress={() => router.push("/profile" as any)}
          showMessages={true}
          onMessagesPress={() => router.push("/messages" as any)}
          showMenu={true}
          onMenuPress={() => setMenuVisible(true)}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Perspective not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <AppHeader
        showCenteredLogo={true}
        userName={user?.displayName || user?.username}
        userAvatar={user?.profileImageUrl || user?.avatarUrl}
        onProfilePress={() => router.push("/profile" as any)}
        showMessages={true}
        onMessagesPress={() => router.push("/messages" as any)}
        showMenu={true}
        onMenuPress={() => setMenuVisible(true)}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back link to parent article */}
        <Pressable
          style={styles.backLink}
          onPress={() => router.push(`/apologetics/${data.parentPostId}` as any)}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary} />
          <Text style={[styles.backLinkText, { color: colors.primary }]} numberOfLines={1}>
            {data.parentPostTitle}
          </Text>
        </Pressable>

        {/* Tradition badge + Title */}
        <View style={styles.titleCard}>
          <View style={[styles.traditionBadge, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.traditionBadgeText, { color: colors.primary }]}>
              {data.tradition} Perspective
            </Text>
          </View>
          <Text style={styles.title}>{data.parentPostTitle}</Text>
          <View style={styles.authorRow}>
            <Ionicons name="person-circle" size={18} color={colors.textSecondary} />
            <View>
              <Text style={styles.authorName}>{data.authorDisplayName}</Text>
              {data.authorProfile?.credentials && (
                <Text style={styles.authorCredentials}>{data.authorProfile.credentials}</Text>
              )}
            </View>
          </View>
          {data.publishedAt && (
            <Text style={styles.publishedDate}>
              Published {new Date(data.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          )}
        </View>

        {/* Scripture References */}
        {data.scriptureRefs && data.scriptureRefs.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Scripture References</Text>
            </View>
            <View style={styles.scriptureList}>
              {data.scriptureRefs.map((ref, idx) => (
                <View key={idx} style={styles.scriptureBadge}>
                  <Text style={styles.scriptureText}>{ref}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Body */}
        <View style={styles.card}>
          <Markdown style={markdownStyles(colors)}>
            {data.bodyMarkdown}
          </Markdown>
        </View>

        {/* Sources */}
        {data.sources && data.sources.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="library" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Sources</Text>
            </View>
            {data.sources.map((source, idx) => (
              <View key={idx} style={styles.sourceItem}>
                <Text style={styles.sourceTitle}>{source.title}</Text>
                <Text style={styles.sourceAuthor}>
                  {source.author}
                  {source.year && ` (${source.year})`}
                  {source.publisher && ` - ${source.publisher}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            This perspective represents the {data.tradition} tradition and is written by a verified apologist. The Connection presents multiple perspectives as an encyclopedia for study.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={styles.bottomBarBackButton}
          onPress={() => router.push(`/apologetics/${data.parentPostId}` as any)}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.bottomBarButtonText, { color: colors.primary }]}>Article</Text>
        </Pressable>
        <Pressable
          style={[styles.bottomBarMainButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/apologetics" as any)}
        >
          <Ionicons name="library-outline" size={20} color={colors.primaryForeground || '#FFFFFF'} />
          <Text style={[styles.bottomBarButtonText, { color: colors.primaryForeground || '#FFFFFF' }]}>Library</Text>
        </Pressable>
      </View>

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSettings={() => router.push("/settings")}
        onNotifications={() => router.push("/notifications")}
        onBookmarks={() => router.push("/bookmarks")}
        onChurches={() => router.push("/churches")}
      />
    </SafeAreaView>
  );
}

function markdownStyles(colors: any) {
  return StyleSheet.create({
    body: { color: colors.textPrimary, fontSize: 16, lineHeight: 24 },
    heading2: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 18, marginBottom: 10 },
    heading3: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    paragraph: { marginBottom: 12 },
    strong: { fontWeight: '700', color: colors.textPrimary },
    em: { fontStyle: 'italic' },
    listUnorderedItemIcon: { color: colors.primary },
    listOrderedItemIcon: { color: colors.primary },
  });
}

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 100 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
    loadingText: { color: colors.textSecondary, fontSize: 14 },
    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16 },
    errorTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
    primaryButton: {
      backgroundColor: colors.buttonPrimaryBg,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 8,
    },
    primaryButtonText: { color: colors.buttonPrimaryText, fontSize: 14, fontWeight: "600" },
    backLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
    },
    backLinkText: { fontSize: 14, fontWeight: "500", flex: 1 },
    titleCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    traditionBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12,
    },
    traditionBadgeText: { fontSize: 13, fontWeight: "600" },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      lineHeight: 30,
      marginBottom: 12,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    authorName: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    authorCredentials: { fontSize: 12, color: colors.textSecondary },
    publishedDate: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
    card: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
    scriptureList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    scriptureBadge: {
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    scriptureText: { fontSize: 13, fontWeight: "600", color: colors.primary },
    sourceItem: { marginBottom: 12 },
    sourceTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 2 },
    sourceAuthor: { fontSize: 13, color: colors.textSecondary },
    disclaimerCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    disclaimerText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      paddingBottom: 28,
      borderTopWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 4,
    },
    bottomBarBackButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    bottomBarMainButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    bottomBarButtonText: { fontSize: 15, fontWeight: '600' },
  });
}
