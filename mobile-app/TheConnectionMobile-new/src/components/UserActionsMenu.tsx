import React, { useState } from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { ReportUserModal } from './ReportUserModal';
import { BlockUserModal } from './BlockUserModal';

interface UserActionsMenuProps {
  userId: number;
  username: string;
  trigger?: React.ReactNode;
}

export function UserActionsMenu({ userId, username, trigger }: UserActionsMenuProps) {
  const { colors, spacing } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  const handleReportPress = () => {
    setMenuVisible(false);
    setTimeout(() => setReportModalVisible(true), 300);
  };

  const handleBlockPress = () => {
    setMenuVisible(false);
    setTimeout(() => setBlockModalVisible(true), 300);
  };

  return (
    <>
      {/* Trigger */}
      {trigger ? (
        <Pressable onPress={() => setMenuVisible(true)}>{trigger}</Pressable>
      ) : (
        <Pressable
          onPress={() => setMenuVisible(true)}
          style={({ pressed }) => ({
            padding: spacing.sm,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.foreground} />
        </Pressable>
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.card,
                borderRadius: spacing.md,
                marginHorizontal: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text variant="caption" color="mutedForeground">
                User: @{username}
              </Text>
            </View>

            {/* Report Option */}
            <Pressable
              onPress={handleReportPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.md,
                gap: spacing.md,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${colors.destructive}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="flag-outline" size={18} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Report User
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Report for inappropriate behavior
                </Text>
              </View>
            </Pressable>

            {/* Block Option */}
            <Pressable
              onPress={handleBlockPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.md,
                gap: spacing.md,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: `${colors.destructive}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="ban-outline" size={18} color={colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontWeight: '600' }}>
                  Block User
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Hide posts and prevent messages
                </Text>
              </View>
            </Pressable>

            {/* Cancel */}
            <Pressable
              onPress={() => setMenuVisible(false)}
              style={({ pressed }) => ({
                padding: spacing.md,
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <Text variant="body" style={{ fontWeight: '600', color: colors.mutedForeground }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <ReportUserModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        userId={userId}
        username={username}
      />

      {/* Block Modal */}
      <BlockUserModal
        visible={blockModalVisible}
        onClose={() => setBlockModalVisible(false)}
        userId={userId}
        username={username}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: '85%',
    maxWidth: 400,
  },
});
