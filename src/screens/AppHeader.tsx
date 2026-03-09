import React, { ReactNode, useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  showLogo?: boolean;
  showBrandText?: boolean;
  showCenteredLogo?: boolean; // New: Show logo in center instead of left
  showBackInCenteredMode?: boolean; // New: Show back button instead of profile avatar when using centered logo
  userAvatar?: string | null;
  userName?: string;
  onProfilePress?: () => void;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  showMessages?: boolean;
  onMessagesPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  unreadNotificationCount?: number; // Badge count for menu icon (notifications)
  unreadMessageCount?: number; // Badge count for message icon (DMs)
  leftElement?: ReactNode; // New: Additional element to show next to avatar/back button
  rightElement?: ReactNode;
  transparent?: boolean;
}

export function AppHeader({
  showLogo = true,
  showBrandText = true,
  showCenteredLogo = false,
  showBackInCenteredMode = false,
  userAvatar,
  userName,
  onProfilePress,
  title,
  showBack = false,
  onBackPress,
  showSearch = false,
  onSearchPress,
  showNotifications = false,
  onNotificationsPress,
  showMessages = false,
  onMessagesPress,
  showMenu = false,
  onMenuPress,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
  leftElement,
  rightElement,
  transparent = false,
}: AppHeaderProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const [avatarError, setAvatarError] = useState(false);

  // Reset error state when avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [userAvatar]);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!userName) return '?';
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if avatar should be shown (has URL and hasn't failed to load)
  const showAvatarImage = userAvatar && !avatarError;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          backgroundColor: transparent ? 'transparent' : colors.background,
          borderBottomWidth: 0,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      {/* Centered Logo Layout */}
      {showCenteredLogo ? (
        <>
          {/* Left: Back Button/Profile Avatar + Optional Left Element */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 }}>
            {showBackInCenteredMode ? (
              <Pressable
                onPress={onBackPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.headerForeground} />
              </Pressable>
            ) : (
              <Pressable
                onPress={onProfilePress}
                style={({ pressed }) => [
                  styles.avatarButton,
                  {
                    backgroundColor: showAvatarImage ? 'transparent' : colors.primary,
                    borderRadius: radii.full,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {showAvatarImage ? (
                  <Image
                    source={{ uri: userAvatar }}
                    style={styles.avatar}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '600' }}>
                    {getUserInitials()}
                  </Text>
                )}
              </Pressable>
            )}
            {leftElement}
          </View>

          {/* Center: Logo Text */}
          <View style={styles.centerSection}>
            <Text
              style={{
                fontFamily: 'PlayfairDisplay-Bold',
                fontSize: 17,
                color: colorScheme === 'dark' ? colors.headerForeground : '#1E3A5F',
                letterSpacing: 0.5,
              }}
            >
              The Connection
            </Text>
          </View>

          {/* Right: Action Buttons */}
          <View style={styles.rightSection}>
            {showMessages && (
              <Pressable
                onPress={onMessagesPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.headerForeground} />
                  {unreadMessageCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#EF4444',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}

            {showMenu && (
              <Pressable
                onPress={onMenuPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons name="menu-outline" size={24} color={colors.headerForeground} />
                  {unreadNotificationCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#EF4444',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}

            {rightElement}
          </View>
        </>
      ) : (
        <>
          {/* Original Layout: Left Section */}
          <View style={styles.leftSection}>
            {showBack ? (
              <Pressable
                onPress={onBackPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent', borderRadius: radii.full },
                ]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.headerForeground} />
              </Pressable>
            ) : (
              <View style={styles.brandContainer}>
                {showLogo && <View style={styles.logo} />}
                {showBrandText && (
                  <Text variant="title" style={[styles.brandText, { color: colors.headerForeground }]}>
                    The Connection
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Original Layout: Right Section */}
          <View style={styles.rightSection}>
            {showSearch && (
              <Pressable onPress={onSearchPress} style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radii.full, backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }]}>
                <Ionicons name="search-outline" size={20} color={colors.headerForeground} />
              </Pressable>
            )}

            {showNotifications && (
              <Pressable onPress={onNotificationsPress} style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radii.full, backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.headerForeground} />
              </Pressable>
            )}

            {showMessages && (
              <Pressable
                onPress={onMessagesPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.headerForeground} />
                  {unreadMessageCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#EF4444',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}

            {showMenu && (
              <Pressable
                onPress={onMenuPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <View style={{ position: 'relative' }}>
                  <Ionicons name="menu-outline" size={24} color={colors.headerForeground} />
                  {unreadNotificationCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: '#EF4444',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            )}

            {rightElement}
          </View>
        </>
      )}
    </View>
  );
}

export function PageHeader({ title, onBackPress, rightElement, showLogo }: { title?: string; onBackPress?: () => void; rightElement?: ReactNode; showLogo?: boolean }) {
  const { colors, spacing, radii, colorScheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBackPress}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? (colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
            borderRadius: radii.full,
            marginLeft: -spacing.sm,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={24} color={colors.headerForeground} />
      </Pressable>

      {showLogo ? (
        <Text
          style={{
            fontFamily: 'PlayfairDisplay-Bold',
            fontSize: 17,
            flex: 1,
            textAlign: 'center',
            color: colorScheme === 'dark' ? colors.headerForeground : '#1E3A5F',
            letterSpacing: 0.5,
          }}
        >
          The Connection
        </Text>
      ) : (
        <Text variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'center', color: colors.headerForeground }}>
          {title}
        </Text>
      )}

      {rightElement ?? <View style={{ width: 36 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    pointerEvents: 'none', // Allow touches to pass through to buttons
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 28,
    height: 28,
    backgroundColor: 'transparent',
  },
  centeredLogo: {
    width: 800,
    height: 140,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
