/**
 * Edit Apologetics Library Post Screen
 * Allows admins and verified apologists to edit library post content
 */

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../src/theme";
import { useAuth } from "../../../src/contexts/AuthContext";
import apiClient from "../../../src/lib/apiClient";

type LibraryPost = {
  id: number;
  domain: "apologetics" | "polemics";
  title: string;
  tldr: string | null;
  keyPoints: string[];
  scriptureRefs: string[];
  bodyMarkdown: string;
  perspectives: string[];
  sources: Array<{
    author: string;
    title: string;
    publisher?: string;
    year?: number;
    url?: string;
  }>;
  authorDisplayName: string;
  status: string;
  area?: { id: number; name: string };
  tag?: { id: number; name: string };
};

async function apiGet<T>(path: string): Promise<T> {
  const res = await apiClient.get(path);
  return res.data as T;
}

export default function EditApologeticsPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [tldr, setTldr] = useState("");
  const [keyPointsText, setKeyPointsText] = useState("");
  const [scriptureRefsText, setScriptureRefsText] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [perspectivesText, setPerspectivesText] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Fetch existing post
  const { data, isLoading, error } = useQuery({
    queryKey: ["library-post", id],
    queryFn: () => apiGet<LibraryPost>(`/api/library/posts/${id}`),
  });

  // Initialize form when data loads
  useEffect(() => {
    if (data && !initialized) {
      setTitle(data.title);
      setTldr(data.tldr || "");
      setKeyPointsText(
        Array.isArray(data.keyPoints) ? data.keyPoints.join("\n") : ""
      );
      setScriptureRefsText(
        Array.isArray(data.scriptureRefs) ? data.scriptureRefs.join(", ") : ""
      );
      setBodyMarkdown(data.bodyMarkdown || "");
      setPerspectivesText(
        Array.isArray(data.perspectives) ? data.perspectives.join(", ") : ""
      );
      setInitialized(true);
    }
  }, [data, initialized]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: any) => {
      const res = await apiClient.patch(`/api/library/posts/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-post", id] });
      queryClient.invalidateQueries({ queryKey: ["library-posts"] });
      Alert.alert("Saved", "Post updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.error || err?.message || "Failed to save";
      Alert.alert("Error", message);
    },
  });

  const handleSave = () => {
    const keyPoints = keyPointsText
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const scriptureRefs = scriptureRefsText
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const perspectives = perspectivesText
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (!title.trim()) {
      Alert.alert("Validation", "Title is required.");
      return;
    }
    if (!bodyMarkdown.trim()) {
      Alert.alert("Validation", "Detailed answer is required.");
      return;
    }
    if (keyPoints.length < 3) {
      Alert.alert("Validation", "At least 3 key points are required (one per line).");
      return;
    }

    saveMutation.mutate({
      title: title.trim(),
      tldr: tldr.trim() || null,
      keyPoints,
      scriptureRefs,
      bodyMarkdown: bodyMarkdown.trim(),
      perspectives,
    });
  };

  const styles = getStyles(colors);

  // Permission check
  if (user && user.role !== "admin" && !user.isVerifiedApologeticsAnswerer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorBody}>
            You need admin or verified apologist permissions to edit posts.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View style={styles.centerContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.textMuted}
          />
          <Text style={styles.errorTitle}>Post not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Edit Post
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={saveMutation.isPending}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.7 },
            saveMutation.isPending && { opacity: 0.5 },
          ]}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Domain & Area info */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>
                {data.domain === "apologetics" ? "Apologetics" : "Polemics"}
              </Text>
            </View>
            {data.area && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{data.area.name}</Text>
              </View>
            )}
            {data.tag && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{data.tag.name}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Question title"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          {/* TL;DR */}
          <Text style={styles.label}>Quick Answer (TL;DR)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={tldr}
            onChangeText={setTldr}
            placeholder="2-3 sentence quick answer"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Key Points */}
          <Text style={styles.label}>Key Points (one per line, min 3)</Text>
          <TextInput
            style={[styles.input, styles.tallInput]}
            value={keyPointsText}
            onChangeText={setKeyPointsText}
            placeholder={"Point 1\nPoint 2\nPoint 3"}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Scripture References */}
          <Text style={styles.label}>
            Scripture References (comma-separated)
          </Text>
          <TextInput
            style={styles.input}
            value={scriptureRefsText}
            onChangeText={setScriptureRefsText}
            placeholder="Romans 8:28, John 3:16, Psalm 23:4"
            placeholderTextColor={colors.textMuted}
          />

          {/* Body Markdown */}
          <Text style={styles.label}>Detailed Answer (Markdown)</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={bodyMarkdown}
            onChangeText={setBodyMarkdown}
            placeholder="Full article content in Markdown..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Perspectives */}
          <Text style={styles.label}>Perspectives (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={perspectivesText}
            onChangeText={setPerspectivesText}
            placeholder="Catholic, Orthodox, Evangelical, Reformed"
            placeholderTextColor={colors.textMuted}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    errorBody: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      marginHorizontal: 12,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 8,
      minWidth: 70,
      alignItems: "center",
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 60,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    metaBadge: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    metaBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 6,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    multilineInput: {
      minHeight: 80,
    },
    tallInput: {
      minHeight: 140,
    },
    bodyInput: {
      minHeight: 300,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
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
