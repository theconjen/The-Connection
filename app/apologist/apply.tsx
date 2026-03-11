/**
 * Apologist Application Screen
 * Users can apply to become a verified apologist for a specific tradition.
 */

import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme";
import { AppHeader } from "../../src/screens/AppHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { MenuDrawer } from "../../src/components/MenuDrawer";
import { perspectivesAPI } from "../../src/lib/apiClient";

const TRADITIONS = ['Catholic', 'Orthodox', 'Protestant'] as const;

export default function ApologistApplyScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  const [tradition, setTradition] = useState<string>('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');

  const applyMutation = useMutation({
    mutationFn: () => perspectivesAPI.apply({ tradition, credentials, bio }),
    onSuccess: () => {
      Alert.alert(
        "Application Submitted",
        "Thank you for applying! The Connection Research Team will review your application and get back to you.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Could not submit application. Please try again.";
      Alert.alert("Error", msg);
    },
  });

  const canSubmit = tradition && credentials.trim().length >= 20 && bio.trim().length >= 20;

  const styles = getStyles(colors);

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={[styles.backLinkText, { color: colors.primary }]}>Back</Text>
          </Pressable>

          {/* Header */}
          <View style={styles.headerCard}>
            <Ionicons name="school" size={36} color={colors.primary} />
            <Text style={styles.headerTitle}>Apply to Be an Apologist</Text>
            <Text style={styles.headerBody}>
              Verified apologists can contribute tradition-specific perspective articles to the Apologetics Library. Your application will be reviewed by the Connection Research Team.
            </Text>
          </View>

          {/* Tradition Selection */}
          <Text style={styles.label}>Your Tradition *</Text>
          <View style={styles.traditionGrid}>
            {TRADITIONS.map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.traditionOption,
                  { borderColor: tradition === t ? colors.primary : colors.borderSubtle },
                  tradition === t && { backgroundColor: colors.primary + '12' },
                ]}
                onPress={() => setTradition(t)}
              >
                <Ionicons
                  name={tradition === t ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={tradition === t ? colors.primary : colors.textMuted}
                />
                <Text style={[
                  styles.traditionOptionText,
                  { color: tradition === t ? colors.primary : colors.textPrimary },
                ]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Credentials */}
          <Text style={styles.label}>Credentials & Qualifications *</Text>
          <Text style={styles.hint}>
            Education, ordination, published works, teaching experience, etc.
          </Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.borderSubtle, color: colors.textPrimary, backgroundColor: colors.backgroundSoft }]}
            placeholder="e.g., M.Div from Seminary, 10 years teaching apologetics..."
            placeholderTextColor={colors.textMuted}
            value={credentials}
            onChangeText={setCredentials}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Bio */}
          <Text style={styles.label}>Bio *</Text>
          <Text style={styles.hint}>
            A brief introduction about yourself and your approach to apologetics.
          </Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.borderSubtle, color: colors.textPrimary, backgroundColor: colors.backgroundSoft }]}
            placeholder="Tell us about your background and passion for apologetics..."
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit */}
          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: canSubmit ? colors.buttonPrimaryBg : colors.surfaceMuted },
            ]}
            onPress={() => applyMutation.mutate()}
            disabled={!canSubmit || applyMutation.isPending}
          >
            {applyMutation.isPending ? (
              <Text style={[styles.submitButtonText, { color: colors.textMuted }]}>Submitting...</Text>
            ) : (
              <Text style={[styles.submitButtonText, { color: canSubmit ? colors.buttonPrimaryText : colors.textMuted }]}>
                Submit Application
              </Text>
            )}
          </Pressable>

          {/* Info note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoNoteText}>
              Applications are typically reviewed within 3-5 business days. You'll receive a notification when your application is approved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

function getStyles(colors: any) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    screen: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    backLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 16,
    },
    backLinkText: { fontSize: 14, fontWeight: "500" },
    headerCard: {
      backgroundColor: colors.backgroundSoft,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
    },
    headerBody: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 6,
      marginTop: 16,
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 10,
      lineHeight: 18,
    },
    traditionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 8,
    },
    traditionOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      minWidth: '45%',
    },
    traditionOptionText: {
      fontSize: 14,
      fontWeight: "500",
    },
    textArea: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      lineHeight: 22,
      minHeight: 100,
    },
    submitButton: {
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    infoNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 16,
      paddingHorizontal: 4,
    },
    infoNoteText: {
      flex: 1,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
}
