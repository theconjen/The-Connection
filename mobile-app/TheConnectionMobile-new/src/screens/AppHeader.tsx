import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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

interface AppHeaderProps {
  showLogo?: boolean;
  showBrandText?: boolean;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  rightElement?: ReactNode;
  transparent?: boolean;
}

export function AppHeader({
  showLogo = true,
  showBrandText = true,
  title,
  showBack = false,
  onBackPress,
  showSearch = false,
  onSearchPress,
  showNotifications = false,
  onNotificationsPress,
  rightElement,
  transparent = false,
}: AppHeaderProps) {
  const { colors, spacing, radii } = useTheme();

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
      {/* Left Section */}
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
            {/* Replace with actual logo image if available */}
            {showLogo && <View style={styles.logo} />}
            {showBrandText && (
              <Text variant="title" style={styles.brandText}>
                The Connection
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right Section */}
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
});
