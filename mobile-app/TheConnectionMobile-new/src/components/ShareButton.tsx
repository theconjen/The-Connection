/**
 * ShareButton Component
 *
 * A reusable share button that uses the native share sheet.
 * Can be used as an icon button or full button with label.
 */

import React, { useCallback, useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shareContent, ShareContent, ShareContentType } from '../lib/shareUrls';

interface ShareButtonProps {
  /** The type of content being shared */
  contentType: ShareContentType;
  /** The ID of the content (post ID, event ID, username, etc.) */
  contentId: string | number;
  /** The title of the content */
  title: string;
  /** Optional custom message for sharing */
  message?: string;
  /** Style variant: 'icon' for just the icon, 'button' for full button */
  variant?: 'icon' | 'button';
  /** Size of the icon (default: 24) */
  iconSize?: number;
  /** Color of the icon/button */
  color?: string;
  /** Show label next to icon (only for button variant) */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional styles for the container */
  style?: StyleProp<ViewStyle>;
  /** Additional styles for the text */
  textStyle?: StyleProp<TextStyle>;
  /** Callback when share is successful */
  onShareSuccess?: () => void;
  /** Callback when share fails */
  onShareError?: (error: string) => void;
}

export function ShareButton({
  contentType,
  contentId,
  title,
  message,
  variant = 'icon',
  iconSize = 24,
  color = '#6366f1',
  showLabel = true,
  label = 'Share',
  style,
  textStyle,
  onShareSuccess,
  onShareError,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);

    const content: ShareContent = {
      type: contentType,
      id: contentId,
      title,
      message,
    };

    try {
      const result = await shareContent(content);

      if (result.success) {
        onShareSuccess?.();
      } else if (result.error && result.error !== 'Share dismissed') {
        onShareError?.(result.error);
        Alert.alert('Share Failed', result.error);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to share';
      onShareError?.(errorMessage);
      Alert.alert('Share Failed', errorMessage);
    } finally {
      setIsSharing(false);
    }
  }, [contentType, contentId, title, message, isSharing, onShareSuccess, onShareError]);

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handleShare}
        disabled={isSharing}
        style={[styles.iconButton, style]}
        accessibilityLabel={`Share ${title}`}
        accessibilityRole="button"
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name="share-outline" size={iconSize} color={color} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={isSharing}
      style={[styles.button, { borderColor: color }, style]}
      accessibilityLabel={`Share ${title}`}
      accessibilityRole="button"
    >
      {isSharing ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          <Ionicons name="share-outline" size={iconSize - 4} color={color} />
          {showLabel && (
            <Text style={[styles.buttonText, { color }, textStyle]}>
              {label}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * ShareIconButton - Convenience component for icon-only share button
 */
export function ShareIconButton(props: Omit<ShareButtonProps, 'variant'>) {
  return <ShareButton {...props} variant="icon" />;
}

/**
 * ShareTextButton - Convenience component for text share button
 */
export function ShareTextButton(props: Omit<ShareButtonProps, 'variant'>) {
  return <ShareButton {...props} variant="button" />;
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ShareButton;
