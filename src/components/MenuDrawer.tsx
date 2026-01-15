import React from 'react';
import { Modal, View, Pressable, StyleSheet, Animated } from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onApologetics: () => void;
  onBookmarks: () => void;
}

export function MenuDrawer({ visible, onClose, onSettings, onNotifications, onApologetics, onBookmarks }: MenuDrawerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['top', 'right', 'bottom']} style={styles.drawerContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Menu</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#0F1419" />
              </Pressable>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onSettings();
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onNotifications();
                }}
              >
                <Ionicons name="notifications-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Notification Center</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onBookmarks();
                }}
              >
                <Ionicons name="bookmark-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Bookmarks</Text>
                <Ionicons name="chevron-forward" size={20} color="#536471" />
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  onApologetics();
                }}
              >
                <Ionicons name="book-outline" size={24} color="#0F1419" />
                <Text style={styles.menuItemText}>Apologetics</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 0,
  },
  drawer: {
    width: 280,
    flex: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderTopLeftRadius: 12,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF3F4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1419',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F1419',
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
});
