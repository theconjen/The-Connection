/**
 * Apologist Scholar Application Page - Mobile
 * Allows users to apply to become an Apologist Scholar contributor
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTheme } from "../../src/theme";
import { useAuth } from "../../src/contexts/AuthContext";
import apiClient from "../../src/lib/apiClient";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface ExistingApplication {
  status: ApplicationStatus;
  reviewNotes?: string;
}

export default function ApologistScholarApplyScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    academicCredentials: "",
    educationalBackground: "",
    theologicalPerspective: "",
    statementOfFaith: "",
    areasOfExpertise: "",
    publishedWorks: "",
    priorApologeticsExperience: "",
    writingSample: "",
    onlineSocialHandles: "",
    referenceName: "",
    referenceContact: "",
    referenceInstitution: "",
    motivation: "",
    weeklyTimeCommitment: "",
    agreedToGuidelines: false,
  });

  // Check for existing application
  const { data: existingApplication, isLoading: isCheckingApplication } = useQuery<ExistingApplication | null>({
    queryKey: ["apologist-scholar-application"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/apologist-scholar-application");
        return res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user,
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/api/apologist-scholar-application", data);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert(
        "Application Submitted!",
        "Your application has been submitted successfully. We'll review it shortly.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to submit application. Please try again.");
    },
  });

  const steps = [
    { title: "Personal Info", icon: "person-outline" },
    { title: "Expertise", icon: "school-outline" },
    { title: "References", icon: "people-outline" },
    { title: "Commitment", icon: "checkmark-circle-outline" },
  ];

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    if (!formData.agreedToGuidelines) {
      Alert.alert("Error", "Please agree to the community guidelines before submitting.");
      return;
    }
    submitMutation.mutate(formData);
  };

  // Require login
  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.centeredTitle, { color: colors.textPrimary }]}>
            Login Required
          </Text>
          <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
            Please log in to apply as an Apologist Scholar.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/auth" as any)}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Log In
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading
  if (isCheckingApplication) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Show pending application
  if (existingApplication?.status === "pending") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Application Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContainer}>
          <View style={[styles.statusIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="time-outline" size={32} color="#D97706" />
          </View>
          <Text style={[styles.centeredTitle, { color: colors.textPrimary }]}>
            Application In Review
          </Text>
          <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
            Your application is currently being reviewed. You'll be notified once a decision has been made.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show approved
  if (existingApplication?.status === "approved") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Application Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContainer}>
          <View style={[styles.statusIcon, { backgroundColor: "#D1FAE5" }]}>
            <Ionicons name="checkmark-circle" size={32} color="#059669" />
          </View>
          <Text style={[styles.centeredTitle, { color: colors.textPrimary }]}>
            Application Approved!
          </Text>
          <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
            Congratulations! You can now contribute content to our apologetics section.
          </Text>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/apologetics" as any)}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
              Go to Apologetics
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Show rejected
  if (existingApplication?.status === "rejected") {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Application Status</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredContainer}>
          <View style={[styles.statusIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="close-circle" size={32} color="#DC2626" />
          </View>
          <Text style={[styles.centeredTitle, { color: colors.textPrimary }]}>
            Application Not Approved
          </Text>
          <Text style={[styles.centeredText, { color: colors.textSecondary }]}>
            {existingApplication.reviewNotes || "We appreciate your interest, but we are unable to approve your application at this time."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Application form
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.header, borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={goBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Apologist Application</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Steps */}
      <View style={[styles.stepsContainer, { borderBottomColor: colors.borderSubtle }]}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                {
                  backgroundColor: index <= currentStep ? colors.primary : colors.surfaceMuted,
                },
              ]}
            >
              <Ionicons
                name={step.icon as any}
                size={16}
                color={index <= currentStep ? colors.primaryForeground : colors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.stepLabel,
                { color: index <= currentStep ? colors.textPrimary : colors.textMuted },
              ]}
            >
              {step.title}
            </Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Personal Information</Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.fullName}
                  onChangeText={(v) => updateField("fullName", v)}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Academic Credentials *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.academicCredentials}
                  onChangeText={(v) => updateField("academicCredentials", v)}
                  placeholder="List your degrees, certifications, etc."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Educational Background *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.educationalBackground}
                  onChangeText={(v) => updateField("educationalBackground", v)}
                  placeholder="Describe your educational journey"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Theological Perspective *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.theologicalPerspective}
                  onChangeText={(v) => updateField("theologicalPerspective", v)}
                  placeholder="Describe your theological background and perspective"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Step 2: Expertise */}
          {currentStep === 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Expertise & Experience</Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Statement of Faith *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle, minHeight: 120 }]}
                  value={formData.statementOfFaith}
                  onChangeText={(v) => updateField("statementOfFaith", v)}
                  placeholder="Share your personal statement of faith"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Areas of Expertise *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.areasOfExpertise}
                  onChangeText={(v) => updateField("areasOfExpertise", v)}
                  placeholder="List your areas of apologetics expertise"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Writing Sample *</Text>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Provide a sample answer to: "How can a good God allow evil and suffering?"
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle, minHeight: 150 }]}
                  value={formData.writingSample}
                  onChangeText={(v) => updateField("writingSample", v)}
                  placeholder="Your sample answer..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Prior Apologetics Experience</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.priorApologeticsExperience}
                  onChangeText={(v) => updateField("priorApologeticsExperience", v)}
                  placeholder="Describe your experience in apologetics ministry"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Step 3: References */}
          {currentStep === 2 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>References</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Provide a reference who can vouch for your theological knowledge and character.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Reference Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.referenceName}
                  onChangeText={(v) => updateField("referenceName", v)}
                  placeholder="Name of your reference"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Reference Contact</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.referenceContact}
                  onChangeText={(v) => updateField("referenceContact", v)}
                  placeholder="Email or phone number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Reference Institution</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.referenceInstitution}
                  onChangeText={(v) => updateField("referenceInstitution", v)}
                  placeholder="Church, seminary, university, etc."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Published Works (Optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.publishedWorks}
                  onChangeText={(v) => updateField("publishedWorks", v)}
                  placeholder="List any books, articles, blog posts you've published"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          )}

          {/* Step 4: Commitment */}
          {currentStep === 3 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Commitment</Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Motivation *</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle, minHeight: 120 }]}
                  value={formData.motivation}
                  onChangeText={(v) => updateField("motivation", v)}
                  placeholder="Why do you want to be an Apologist Scholar?"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Weekly Time Commitment *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  value={formData.weeklyTimeCommitment}
                  onChangeText={(v) => updateField("weeklyTimeCommitment", v)}
                  placeholder="Hours per week you can commit"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Guidelines */}
              <View style={[styles.guidelinesBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.guidelinesTitle, { color: colors.textPrimary }]}>Community Guidelines</Text>
                <Text style={[styles.guidelinesText, { color: colors.textSecondary }]}>
                  As an Apologist Scholar, you agree to:{"\n"}
                  {"\n"}• Respond with grace, respect, and theological accuracy
                  {"\n"}• Provide biblically-based answers
                  {"\n"}• Cite sources when appropriate
                  {"\n"}• Maintain a charitable tone
                  {"\n"}• Respond to questions within one week
                  {"\n"}• Create at least one piece of content per month
                </Text>
              </View>

              {/* Checkbox */}
              <Pressable
                style={styles.checkboxRow}
                onPress={() => updateField("agreedToGuidelines", !formData.agreedToGuidelines)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: formData.agreedToGuidelines ? colors.primary : "transparent",
                      borderColor: formData.agreedToGuidelines ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                >
                  {formData.agreedToGuidelines && (
                    <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                  I agree to follow the Apologist Scholar community guidelines
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.bottomButtons, { borderTopColor: colors.borderSubtle }]}>
          {currentStep > 0 ? (
            <Pressable style={[styles.secondaryButton, { borderColor: colors.borderSubtle }]} onPress={goBack}>
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {currentStep < steps.length - 1 ? (
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={goNext}>
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryButton, { backgroundColor: "#D97706" }]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>Submit Application</Text>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  guidelinesBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  centeredTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  centeredText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
