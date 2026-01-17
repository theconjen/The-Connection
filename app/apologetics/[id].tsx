/**
 * Apologetics Question Detail Screen
 * Shows full Q&A with sources and metadata
 */

import React from "react";
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
import { useTheme } from "../../src/theme";
import { AppHeader } from "../../src/screens/AppHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiClient } from "../../src/lib/apiClient";

type QADetail = {
  id: string;
  question: string;
  areaName: string;
  tagName?: string;
  answer: string;
  sources?: string[];
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get(path);
  return res.data as T;
}

export default function ApologeticsDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["apologetics-question", id],
    queryFn: () => apiGet<QADetail>(`/api/apologetics/questions/${id}`),
    staleTime: 60_000,
  });

  const styles = getStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
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
          <Text style={styles.loadingText}>Loading question...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
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
          <Text style={styles.errorTitle}>Question not found</Text>
          <Text style={styles.errorBody}>
            This question may have been removed or doesn't exist.
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

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Back to Apologetics</Text>
        </Pressable>

        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>{data.areaName}</Text>
          {data.tagName && (
            <>
              <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
              <Text style={styles.breadcrumbText}>{data.tagName}</Text>
            </>
          )}
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question</Text>
          <Text style={styles.questionText}>{data.question}</Text>
        </View>

        {/* Answer */}
        <View style={styles.answerCard}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerLabel}>Answer from verified sources</Text>
          </View>

          <Text style={styles.answerText}>{data.answer}</Text>

          {/* Author Attribution */}
          <View style={styles.authorLine}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.authorText}>Connection Research Team</Text>
          </View>
        </View>

        {/* Sources */}
        {data.sources && data.sources.length > 0 && (
          <View style={styles.sourcesCard}>
            <Text style={styles.sourcesTitle}>Sources</Text>
            {data.sources.map((source, idx) => (
              <View key={idx} style={styles.sourceItem}>
                <Text style={styles.sourceBullet}>•</Text>
                <Text style={styles.sourceText}>{source}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ask Question CTA */}
        <View style={styles.ctaCard}>
          <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
          <Text style={styles.ctaTitle}>Have a question?</Text>
          <Text style={styles.ctaBody}>
            Submit your apologetics question and get answers from our research team.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/questions/ask" as any)}
          >
            <Text style={styles.primaryButtonText}>Ask a Question</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
      marginBottom: 20,
    },
    breadcrumbText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500",
    },
    questionCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    questionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    questionText: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      lineHeight: 30,
    },
    answerCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    answerHeader: {
      marginBottom: 16,
    },
    answerLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    answerText: {
      fontSize: 16,
      color: colors.textPrimary,
      lineHeight: 24,
      marginBottom: 16,
    },
    authorLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    authorText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    sourcesCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    sourcesTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    sourceItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    sourceBullet: {
      fontSize: 14,
      color: colors.textMuted,
      marginRight: 10,
      marginTop: 2,
    },
    sourceText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    ctaCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.primary,
      borderWidth: 2,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 12,
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
  });
}
