/**
 * CreateHubSheet - Modern Bottom Sheet Create Menu
 * Instagram/Reddit/Notion style create hub with clear labeled actions
 * No emojis, premium feel, accessible, theme-aware
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

interface CreateOption {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CreateHubSheetProps {
  open: boolean;
  onClose: () => void;
}

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: 'advice',
    title: 'Ask for Advice',
    subtitle: 'Get anonymous support from the community',
    route: '/create/advice',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'community',
    title: 'Create a Community',
    subtitle: 'Build a space around a topic or interest',
    route: '/create/community',
    icon: 'people-outline',
  },
  {
    id: 'event',
    title: 'Create an Event',
    subtitle: 'Post a meetup, study, or service',
    route: '/create/event',
    icon: 'calendar-outline',
  },
];

// Note: Posts and discussions can only be created within a community.
// Navigate to a community first to create content.

export function CreateHubSheet({ open, onClose }: CreateHubSheetProps) {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const styles = useMemo(() => getStyles(colors, spacing, radii), [colors, spacing, radii]);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['45%'], []);

  // Handle sheet changes (closed state)
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Custom backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle option press
  const handleOptionPress = useCallback((route: string) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Close sheet
    bottomSheetRef.current?.close();

    // Small delay to allow sheet to close smoothly
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  }, [router]);

  // Open/close sheet when open prop changes
  React.useEffect(() => {
    if (open) {
      bottomSheetRef.current?.snapToIndex(0);
      // Haptic feedback on open
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [open]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleIndicatorStyle={{
        backgroundColor: colors.borderSoft,
        width: 40,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: colors.surface,
      }}
      style={styles.sheet}
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create</Text>
          <Pressable
            onPress={() => bottomSheetRef.current?.close()}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {CREATE_OPTIONS.map((option, index) => (
            <React.Fragment key={option.id}>
              <Pressable
                onPress={() => handleOptionPress(option.route)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && styles.optionRowPressed,
                ]}
              >
                <View style={styles.optionIcon}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={colors.textPrimary}
                  />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={styles.optionChevron}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
              </Pressable>
              {index < CREATE_OPTIONS.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

function getStyles(colors: any, spacing: any, radii: any) {
  return StyleSheet.create({
    sheet: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg, // iOS safe area
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'Figtree_700Bold',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonPressed: {
      backgroundColor: colors.surfaceMuted,
    },
    optionsList: {
      gap: 0,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.md,
      minHeight: 64,
    },
    optionRowPressed: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
    },
    optionIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionContent: {
      flex: 1,
      gap: 4,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Figtree_600SemiBold',
      lineHeight: 20,
    },
    optionSubtitle: {
      fontSize: 13,
      fontWeight: '400',
      color: colors.textMuted,
      fontFamily: 'Figtree_400Regular',
      lineHeight: 18,
    },
    optionChevron: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSubtle,
      marginLeft: 60, // Align with text, not icon
    },
  });
}
