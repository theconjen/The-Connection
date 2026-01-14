/**
 * FAN MENU - The Connection Mobile App
 * -------------------------------------
 * Animated fan menu that opens from center tab button
 * Shows options to create Feed, Community, and Forum posts
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface FanMenuProps {
  visible: boolean;
  onClose: () => void;
  onCreateFeed: () => void;
  onCreateCommunity: () => void;
  onCreateForum: () => void;
}

export function FanMenu({
  visible,
  onClose,
  onCreateFeed,
  onCreateCommunity,
  onCreateForum,
}: FanMenuProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show menu with animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.stagger(50, [
          Animated.spring(scale1, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale2, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale3, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Hide menu
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale1, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale2, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scale3, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale1, scale2, scale3]);

  const handleAction = (action: () => void) => {
    onClose();
    // Small delay to allow menu to close before navigating
    setTimeout(() => {
      action();
    }, 100);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity,
          },
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Fan Menu Items */}
      <View style={styles.menuContainer} pointerEvents="box-none">
        {/* Feed Post Button */}
        <Animated.View
          style={[
            styles.menuItemContainer,
            {
              transform: [{ scale: scale1 }, { translateY: -140 }],
            },
          ]}
        >
          <Pressable
            style={styles.menuButton}
            onPress={() => handleAction(onCreateFeed)}
          >
            <Ionicons name="chatbubble" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.menuLabel}>Feed</Text>
        </Animated.View>

        {/* Community Button */}
        <Animated.View
          style={[
            styles.menuItemContainer,
            {
              transform: [
                { scale: scale2 },
                { translateY: -100 },
                { translateX: -80 },
              ],
            },
          ]}
        >
          <Pressable
            style={[styles.menuButton, { backgroundColor: '#9B59B6' }]}
            onPress={() => handleAction(onCreateCommunity)}
          >
            <Ionicons name="people" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.menuLabel}>Community</Text>
        </Animated.View>

        {/* Forum Post Button */}
        <Animated.View
          style={[
            styles.menuItemContainer,
            {
              transform: [
                { scale: scale3 },
                { translateY: -100 },
                { translateX: 80 },
              ],
            },
          ]}
        >
          <Pressable
            style={[styles.menuButton, { backgroundColor: '#E67E22' }]}
            onPress={() => handleAction(onCreateForum)}
          >
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.menuLabel}>Forum</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 90, // Just above the tab bar
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  menuItemContainer: {
    position: 'absolute',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
