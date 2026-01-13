import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { Text, useTheme } from '../theme';

// Icons
const BackIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>←</Text>
);
const SearchIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>🔍</Text>
);
const BellIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>🔔</Text>
);
const MenuIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>☰</Text>
);
const MessageIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>💬</Text>
);

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
          backgroundColor: transparent ? 'transparent' : colors.card,
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: colors.border,
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
              <Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: '600' }}>
                {getUserInitials()}
              </Text>
            )}
          </Pressable>

          {/* Center: Logo */}
          <View style={styles.centerSection}>
            <Image
              source={require('../../assets/tc-logo-lightmode.png')}
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
                    backgroundColor: pressed ? colors.muted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <MessageIcon color={colors.foreground} />
              </Pressable>
            )}

            {showMenu && (
              <Pressable
                onPress={onMenuPress}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: pressed ? colors.muted : 'transparent',
                    borderRadius: radii.full,
                  },
                ]}
              >
                <MenuIcon color={colors.foreground} />
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
                  { backgroundColor: pressed ? colors.muted : 'transparent', borderRadius: radii.full },
                ]}
              >
                <BackIcon color={colors.foreground} />
              </Pressable>
            ) : (
              <View style={styles.brandContainer}>
                {showLogo && <View style={styles.logo} />}
                {showBrandText && (
                  <Text variant="title" style={styles.brandText}>
                    The Connection
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Original Layout: Right Section */}
          <View style={styles.rightSection}>
            {showSearch && (
              <Pressable onPress={onSearchPress} style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radii.full, backgroundColor: pressed ? colors.muted : 'transparent' }]}>
                <SearchIcon color={colors.mutedForeground} />
              </Pressable>
            )}

            {showNotifications && (
              <Pressable onPress={onNotificationsPress} style={({ pressed }) => [{ padding: spacing.sm, borderRadius: radii.full, backgroundColor: pressed ? colors.muted : 'transparent' }]}>
                <BellIcon color={colors.mutedForeground} />
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
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onBackPress}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? colors.muted : 'transparent',
            borderRadius: radii.full,
            marginLeft: -spacing.sm,
          },
        ]}
      >
        <BackIcon color={colors.foreground} />
      </Pressable>

      <Text variant="body" style={{ fontWeight: '600', flex: 1, textAlign: 'center' }}>
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
    zIndex: -1, // Place behind left/right sections
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    width: 140,
    height: 36,
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
