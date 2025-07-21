import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface ProfileSetting {
  id: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
}

const EditProfileModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  user: any;
}> = ({ visible, onClose, user }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');

  const handleSave = () => {
    Alert.alert('Success', 'Profile updated successfully!');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSaveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself..."
              multiline
              maxLength={250}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Your city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="Your state"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const profileSettings: ProfileSetting[] = [
    {
      id: 'edit',
      title: 'Edit Profile',
      subtitle: 'Update your information and preferences',
      onPress: () => setShowEditModal(true),
      showArrow: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon!'),
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      subtitle: 'Control who can see your information',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
      showArrow: true,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help or contact support',
      onPress: () => Alert.alert('Support', 'For support, please email: support@theconnection.app'),
      showArrow: true,
    },
    {
      id: 'about',
      title: 'About The Connection',
      subtitle: 'Learn more about our mission',
      onPress: () => Alert.alert(
        'About The Connection',
        'The Connection is a faith-based social platform designed to bring believers together through meaningful conversations, prayer, and community support.'
      ),
      showArrow: true,
    },
  ];

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Sign In Required</Text>
          <Text style={styles.guestDescription}>
            Please sign in to view and manage your profile.
          </Text>
          <TouchableOpacity style={styles.signInButton}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.displayName}>{user.displayName || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          
          {user.bio && (
            <Text style={styles.bio}>{user.bio}</Text>
          )}
          
          {user.city && user.state && (
            <Text style={styles.location}>📍 {user.city}, {user.state}</Text>
          )}

          <View style={styles.badgeContainer}>
            {user.isAdmin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}
            {user.isVerifiedApologeticsAnswerer && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Text style={[styles.badgeText, styles.verifiedBadgeText]}>Verified Answerer</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Communities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>Prayers</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {profileSettings.map((setting, index) => (
            <TouchableOpacity
              key={setting.id}
              style={[
                styles.settingItem,
                index === profileSettings.length - 1 && styles.lastSettingItem
              ]}
              onPress={setting.onPress}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                {setting.subtitle && (
                  <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                )}
              </View>
              {setting.showArrow && (
                <Text style={styles.settingArrow}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </ScrollView>

      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E73AA4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: '#1A1D29',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  verifiedBadgeText: {
    color: '#16A34A',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1D29',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1D29',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  settingArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 12,
  },
  guestDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#E73AA4',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1D29',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});