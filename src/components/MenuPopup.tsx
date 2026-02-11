/**
 * MenuPopup - Dropdown menu for navigation
 * Settings, Direct Messages, Prayers, Apologetics
 */

import React, { useState } from 'react';
import { View, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MenuPopupProps {
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
}

export function MenuPopup({
  onSettingsPress,
  onNotificationsPress,
  unreadCount = 0,
}: MenuPopupProps) {
  const { colors, spacing, radii } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'notifications',
      label: 'Notifications',
      iconName: 'notifications-outline' as const,
      onPress: onNotificationsPress,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'settings',
      label: 'Settings',
      iconName: 'settings-outline' as const,
      onPress: onSettingsPress,
    },
  ];

  const handleMenuItemPress = (onPress?: () => void) => {
    setIsOpen(false);
    onPress?.();
  };

  return (
    <>
      {/* Menu Button */}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.full,
          backgroundColor: pressed ? colors.muted : 'transparent',
        })}
      >
        <Ionicons name="menu" size={24} color={colors.foreground} />
      </Pressable>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  position: 'absolute',
                  top: 60,
                  right: spacing.lg,
                  backgroundColor: colors.card,
                  borderRadius: radii.xl,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minWidth: 220,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 8,
                  overflow: 'hidden',
                }}
              >
                {menuItems.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleMenuItemPress(item.onPress)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      backgroundColor: pressed ? colors.muted : 'transparent',
                      borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    })}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: radii.md,
                        backgroundColor: colors.background,
                      }}
                    >
                      <Ionicons name={item.iconName} size={20} color={colors.foreground} />
                      {item.badge != null && item.badge > 0 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#EF4444',
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: '#FFFFFF',
                            }}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      variant="bodySmall"
                      style={{
                        fontWeight: '600',
                        color: colors.foreground,
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
