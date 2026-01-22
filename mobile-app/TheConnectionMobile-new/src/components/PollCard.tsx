/**
 * PollCard Component
 * Renders a poll with options, voting capability, and results display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pollsAPI } from '../lib/apiClient';

interface PollOption {
  id: number;
  text: string;
  voteCount: number;
  percentage: number;
  isVotedByUser: boolean;
}

interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  isExpired: boolean;
  endsAt?: string;
  allowMultiple: boolean;
}

interface PollCardProps {
  poll: Poll;
  onVoteSuccess?: () => void;
}

export function PollCard({ poll, onVoteSuccess }: PollCardProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const voteMutation = useMutation({
    mutationFn: async (optionIds: number[]) => {
      if (poll.allowMultiple) {
        return pollsAPI.voteMultiple(poll.id, optionIds);
      } else {
        return pollsAPI.vote(poll.id, optionIds[0]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feed/explore'] });
      queryClient.invalidateQueries({ queryKey: ['/api/microblogs'] });
      onVoteSuccess?.();
    },
  });

  const handleOptionPress = (optionId: number) => {
    if (poll.hasVoted || poll.isExpired) return;

    if (poll.allowMultiple) {
      // Toggle selection for multiple choice
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single choice - vote immediately
      voteMutation.mutate([optionId]);
    }
  };

  const handleSubmitVote = () => {
    if (selectedOptions.length === 0) return;
    voteMutation.mutate(selectedOptions);
  };

  const showResults = poll.hasVoted || poll.isExpired;

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Poll Question */}
      <Text style={styles.question}>{poll.question}</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id) || option.isVotedByUser;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.option,
                showResults && styles.optionWithResults,
                isSelected && !showResults && styles.optionSelected,
              ]}
              onPress={() => handleOptionPress(option.id)}
              disabled={poll.hasVoted || poll.isExpired || voteMutation.isPending}
              activeOpacity={0.7}
            >
              {/* Progress bar for results */}
              {showResults && (
                <View
                  style={[
                    styles.progressBar,
                    { width: `${option.percentage}%` },
                    option.isVotedByUser && styles.progressBarVoted,
                  ]}
                />
              )}

              <View style={styles.optionContent}>
                {/* Checkbox/Radio indicator */}
                {!showResults && (
                  <View style={styles.checkboxContainer}>
                    {poll.allowMultiple ? (
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    ) : (
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    )}
                  </View>
                )}

                {/* Option text */}
                <Text
                  style={[
                    styles.optionText,
                    option.isVotedByUser && styles.optionTextVoted,
                  ]}
                  numberOfLines={2}
                >
                  {option.text}
                </Text>

                {/* Vote count & percentage (only show in results) */}
                {showResults && (
                  <View style={styles.resultInfo}>
                    {option.isVotedByUser && (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                        style={styles.votedIcon}
                      />
                    )}
                    <Text style={styles.percentage}>{option.percentage}%</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit button for multiple choice polls */}
      {poll.allowMultiple && !poll.hasVoted && !poll.isExpired && selectedOptions.length > 0 && (
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitVote}
          disabled={voteMutation.isPending}
        >
          {voteMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Vote</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Poll metadata */}
      <View style={styles.metadata}>
        <Text style={styles.totalVotes}>
          {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </Text>
        {poll.isExpired ? (
          <Text style={styles.expired}>Poll ended</Text>
        ) : poll.endsAt ? (
          <Text style={styles.endsAt}>
            Ends {new Date(poll.endsAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {/* Loading overlay */}
      {voteMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      position: 'relative',
    },
    question: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    optionsContainer: {
      gap: 8,
    },
    option: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    optionWithResults: {
      backgroundColor: colors.surface,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    progressBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.primary + '20',
      borderRadius: 7,
    },
    progressBarVoted: {
      backgroundColor: colors.primary + '30',
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      zIndex: 1,
    },
    checkboxContainer: {
      marginRight: 10,
    },
    optionText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
    },
    optionTextVoted: {
      fontWeight: '600',
    },
    resultInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    votedIcon: {
      marginRight: 4,
    },
    percentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 40,
      textAlign: 'right',
    },
    submitButton: {
      marginTop: 12,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    metadata: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    totalVotes: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    expired: {
      fontSize: 13,
      color: colors.error || '#EF4444',
      fontWeight: '500',
    },
    endsAt: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
  });

export default PollCard;
