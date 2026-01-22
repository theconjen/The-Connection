/**
 * TopicChips Component
 * Horizontal scrollable chips for filtering feed by topic
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { MicroblogTopic, MICROBLOG_TOPICS } from '../lib/apiClient';

// Topic display configuration - Simplified for cleaner UX
const TOPIC_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  ALL: { label: 'All', icon: 'apps', color: '#6366F1' },
  OBSERVATION: { label: 'Discussions', icon: 'chatbubbles', color: '#8B5CF6' },
  QUESTION: { label: 'Questions', icon: 'help-circle', color: '#EC4899' },
  POLL: { label: 'Polls', icon: 'bar-chart', color: '#14B8A6' },
  TESTIMONY: { label: 'Testimony', icon: 'heart', color: '#EF4444' },
  // Legacy configs kept for compatibility
  NEWS: { label: 'News', icon: 'newspaper', color: '#3B82F6' },
  CULTURE: { label: 'Culture', icon: 'globe', color: '#10B981' },
  ENTERTAINMENT: { label: 'Entertainment', icon: 'film', color: '#F59E0B' },
  SCRIPTURE: { label: 'Scripture', icon: 'book', color: '#8B5CF6' },
  PRAYER: { label: 'Prayer', icon: 'hand-left', color: '#6366F1' },
  OTHER: { label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
};

interface TopicChipsProps {
  selectedTopic: MicroblogTopic | 'ALL' | 'POLL';
  onSelectTopic: (topic: MicroblogTopic | 'ALL' | 'POLL') => void;
  showPollFilter?: boolean;
}

export function TopicChips({ selectedTopic, onSelectTopic, showPollFilter = true }: TopicChipsProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Build the list of chips to show - Simplified to 5 key filters
  const chipItems: (MicroblogTopic | 'ALL' | 'POLL')[] = [
    'ALL',
    'OBSERVATION', // Displays as "Discussions"
    'QUESTION',
    'POLL',
    'TESTIMONY',
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chipItems.map((topic) => {
          const config = TOPIC_CONFIG[topic] || TOPIC_CONFIG.OTHER;
          const isSelected = selectedTopic === topic;

          return (
            <TouchableOpacity
              key={topic}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                isSelected && { borderColor: config.color },
              ]}
              onPress={() => onSelectTopic(topic)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={config.icon as any}
                size={14}
                color={isSelected ? config.color : colors.textSecondary}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                  isSelected && { color: config.color },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    scrollContent: {
      paddingHorizontal: 12,
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    chipSelected: {
      backgroundColor: colors.surface,
    },
    chipIcon: {
      marginRight: 4,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    chipTextSelected: {
      fontWeight: '600',
    },
  });

export default TopicChips;
