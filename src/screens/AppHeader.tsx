import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
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
  leftElement,
  rightElement,
  transparent = false,
}: AppHeaderProps) {
  const { colors, spacing, radii } = useTheme();

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

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          backgroundColor: transparent ? 'transparent' : colors.header,
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: transparent ? 'transparent' : colors.headerBorder,
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
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable
                onPress={onProfilePress}
                style={({ pressed }) => [
                  styles.avatarButton,
                  {
                    backgroundColor: userAvatar ? 'transparent' : colors.primary,
                    borderRadius: radii.full,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {userAvatar ? (
                  <Image source={{ uri: userAvatar }} style={styles.avatar} />
                ) : (
                  <Text style={{ color: colors.headerForeground, fontSize: 16, fontWeight: '600' }}>
                    {getUserInitials()}
                  </Text>
                )}
              </Pressable>
            )}
            {leftElement}
          </View>

          {/* Center: Logo */}
          <View style={styles.centerSection}>
            <Image
              source={require('../../assets/tc-logo-hd.png')}
              style={styles.centeredLogo}
              resizeMode="contain"
            />
          </View>

          {/* Right: Action Buttons */}
          <View style={styles.rightSection}>
            {showMessages && (
              <Pressable
                onPress={onMessagesPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
              </Pressable>
            )}

            {showMenu && (
              <Pressable
                onPress={onMenuPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
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
                <Ionicons name="chatbubble-outline" size={20} color={colors.headerForeground} />
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
                <Ionicons name="menu-outline" size={24} color={colors.headerForeground} />
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
  const { colors, spacing, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.header,
          borderBottomWidth: 1,
          borderBottomColor: colors.headerBorder,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBackPress}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            borderRadius: radii.full,
            marginLeft: -spacing.sm,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={24} color={colors.headerForeground} />
      </Pressable>

      {showLogo ? (
        <Image
          source={require('../../assets/tc-logo-lightmode.png')}
          style={{ width: 120, height: 32, flex: 1 }}
          resizeMode="contain"
        />
      ) : (
        <Text variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'center', color: colors.headerForeground }}>
          {title}
        </Text>
      )}

      {rightElement ?? <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
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
    gap: 4,
    zIndex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
  },
  centeredLogo: {
    width: 800,
    height: 140,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
