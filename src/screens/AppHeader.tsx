import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  showLogo?: boolean;
  showBrandText?: boolean;
  showCenteredLogo?: boolean; // New: Show logo in center instead of left
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
  rightElement?: ReactNode;
  transparent?: boolean;
}

export function AppHeader({
  showLogo = true,
  showBrandText = true,
  showCenteredLogo = false,
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
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : '#7B9CAF', // Earth-toned blue
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: transparent ? 'transparent' : '#6A8B9D',
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      {/* Centered Logo Layout */}
      {showCenteredLogo ? (
        <>
          {/* Left: Profile Avatar */}
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
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                {getUserInitials()}
              </Text>
            )}
          </Pressable>

          {/* Center: Logo with theme-aware background */}
          <View style={styles.centerSection}>
            <View style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 20,
              paddingVertical: 6,
              borderRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Image
                source={require('../../assets/tc-logo-hd.png')}
                style={styles.centeredLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Right: Action Buttons */}
          <View style={styles.rightSection}>
            {showMessages && (
              <Pressable
                onPress={onMessagesPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
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
                <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
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
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.brandContainer}>
                {showLogo && <View style={styles.logo} />}
                {showBrandText && (
                  <Text variant="title" style={[styles.brandText, { color: '#FFFFFF' }]}>
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
                <Ionicons name="search-outline" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            {showNotifications && (
              <Pressable onPress={onNotificationsPress} style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radii.full, backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }]}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            {showMessages && (
              <Pressable
                onPress={onMessagesPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.muted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
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
                <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
              </Pressable>
            )}

            {rightElement}
          </View>
        </>
      )}
    </View>
  );
}

export function PageHeader({ title, onBackPress, rightElement }: { title: string; onBackPress?: () => void; rightElement?: ReactNode }) {
  const { colors, spacing, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#7B9CAF', // Earth-toned blue to match AppHeader
          borderBottomWidth: 1,
          borderBottomColor: '#6A8B9D',
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
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </Pressable>

      <Text variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'center', color: '#FFFFFF' }}>
        {title}
      </Text>

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
