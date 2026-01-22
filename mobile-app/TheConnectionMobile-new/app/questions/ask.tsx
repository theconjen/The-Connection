import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/apiClient';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/theme';

interface Area {
  id: number;
  name: string;
  slug: string;
  description: string;
  domain: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  areaId: number;
}

// Styles function - defined before component
const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 70,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  domainButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  domainButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    alignItems: 'center',
  },
  domainButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  domainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  domainButtonTextActive: {
    color: colors.primaryForeground,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  pickerItemActive: {
    backgroundColor: colors.surfaceMuted,
  },
  pickerItemContent: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerItemTextActive: {
    color: colors.primary,
  },
  pickerItemDescription: {
    fontSize: 13,
    color: colors.textMuted,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default function AskQuestionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [domain, setDomain] = useState<'apologetics' | 'polemics'>('apologetics');
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [questionText, setQuestionText] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch areas when domain changes
  useEffect(() => {
    fetchAreas();
  }, [domain]);

  // Fetch tags when area changes
  useEffect(() => {
    if (selectedArea) {
      fetchTags(selectedArea.id);
    } else {
      setTags([]);
      setSelectedTag(null);
    }
  }, [selectedArea]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/qa/areas?domain=${domain}`);
      setAreas(response.data);
      setSelectedArea(null);
      setSelectedTag(null);
    } catch (error) {
      console.error('Error fetching areas:', error);
      Alert.alert('Error', 'Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async (areaId: number) => {
    try {
      const response = await apiClient.get(`/api/qa/areas/${areaId}/tags`);
      setTags(response.data);
      setSelectedTag(null);
    } catch (error) {
      console.error('Error fetching tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    }
  };

  const handleSubmit = async () => {
    if (!selectedArea || !questionText.trim()) {
      Alert.alert('Missing Information', 'Please select an area and enter your question');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/api/questions', {
        domain,
        areaId: selectedArea.id,
        tagId: selectedTag?.id || null,
        questionText: questionText.trim(),
      });

      const question = response.data;
      Alert.alert(
        'Question Submitted',
        'Your question has been submitted to our research team. You will be notified when you receive a response.',
        [
          {
            text: 'View Thread',
            onPress: () => router.push(`/questions/${question.id}`),
          },
          {
            text: 'My Questions',
            onPress: () => router.push('/questions/my-questions'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ask a Question</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Domain Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Domain *</Text>
          <View style={styles.domainButtons}>
            <Pressable
              style={[
                styles.domainButton,
                domain === 'apologetics' && styles.domainButtonActive,
              ]}
              onPress={() => setDomain('apologetics')}
            >
              <Text
                style={[
                  styles.domainButtonText,
                  domain === 'apologetics' && styles.domainButtonTextActive,
                ]}
              >
                Apologetics
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.domainButton,
                domain === 'polemics' && styles.domainButtonActive,
              ]}
              onPress={() => setDomain('polemics')}
            >
              <Text
                style={[
                  styles.domainButtonText,
                  domain === 'polemics' && styles.domainButtonTextActive,
                ]}
              >
                Polemics
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Area Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Area *</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.sage} />
          ) : (
            <View style={styles.picker}>
              {areas.map((area) => (
                <Pressable
                  key={area.id}
                  style={[
                    styles.pickerItem,
                    selectedArea?.id === area.id && styles.pickerItemActive,
                  ]}
                  onPress={() => setSelectedArea(area)}
                >
                  <View style={styles.pickerItemContent}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedArea?.id === area.id && styles.pickerItemTextActive,
                      ]}
                    >
                      {area.name}
                    </Text>
                    <Text style={styles.pickerItemDescription}>{area.description}</Text>
                  </View>
                  {selectedArea?.id === area.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.sage} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Tag Selector */}
        {selectedArea && tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Tag (optional)</Text>
            <View style={styles.picker}>
              {tags.map((tag) => (
                <Pressable
                  key={tag.id}
                  style={[
                    styles.pickerItem,
                    selectedTag?.id === tag.id && styles.pickerItemActive,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <View style={styles.pickerItemContent}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedTag?.id === tag.id && styles.pickerItemTextActive,
                      ]}
                    >
                      {tag.name}
                    </Text>
                    <Text style={styles.pickerItemDescription}>{tag.description}</Text>
                  </View>
                  {selectedTag?.id === tag.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.sage} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Question Text */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Question *</Text>
          <TextInput
            style={styles.textInput}
            value={questionText}
            onChangeText={setQuestionText}
            placeholder="Describe your question in detail..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            (!selectedArea || !questionText.trim() || submitting) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedArea || !questionText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Question</Text>
          )}
        </Pressable>

        {/* Help Text */}
        <View style={styles.helpBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.sage} />
          <Text style={styles.helpText}>
            Your question will be privately reviewed by our Connection Research Team. You'll
            receive a notification when they respond.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
