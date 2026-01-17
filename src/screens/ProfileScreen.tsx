/**
 * ProfileScreen - User Profile with Edit Capabilities
 * View and edit profile information, customize avatar, bio, etc.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Text,  } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { PageHeader } from './AppHeader';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onBackPress?: () => void;
  userName?: string;
  userAvatar?: string;
  userBio?: string;
  userEmail?: string;
  userLocation?: string;
  userDenomination?: string;
  onSaveProfile?: (data: ProfileData) => void;
}

export interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  denomination: string;
}

export function ProfileScreen({
  onBackPress,
  userName = 'User',
  userAvatar,
  userBio = '',
  userEmail = '',
  userLocation = '',
  userDenomination = '',
  onSaveProfile,
}: ProfileScreenProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [displayName, setDisplayName] = useState(userName);
  const [bio, setBio] = useState(userBio);
  const [location, setLocation] = useState(userLocation);
  const [denomination, setDenomination] = useState(userDenomination);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSave = () => {
    onSaveProfile?.({
      displayName,
      bio,
      location,
      denomination,
    });
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    // Reset to original values
    setDisplayName(userName);
    setBio(userBio);
    setLocation(userLocation);
    setDenomination(userDenomination);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar barStyle="light-content" />

      <PageHeader
        title="Profile"
        onBackPress={onBackPress}
        rightElement={
          <Pressable
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
            style={({ pressed }) => ({
              padding: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.secondary, fontWeight: '600' }}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: spacing.xl,
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {/* Avatar */}
          <Pressable
            onPress={() => {
              if (isEditing) {
                Alert.alert('Change Avatar', 'Avatar upload coming soon!');
              }
            }}
            style={{ position: 'relative' }}
          >
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.muted,
                }}
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.primaryForeground, fontSize: 36, fontWeight: '700' }}>
                  {getInitials(displayName)}
                </Text>
              </View>
            )}
            {isEditing && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.secondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: colors.card,
                }}
              >
                <Ionicons name="camera" size={16} color={colors.secondaryForeground} />
              </View>
            )}
          </Pressable>

          {/* Name */}
          <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
            {isEditing ? (
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.foreground,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.md,
                  textAlign: 'center',
                  minWidth: 200,
                }}
                placeholder="Display Name"
                placeholderTextColor={colors.mutedForeground}
              />
            ) : (
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
                {displayName}
              </Text>
            )}
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>
              {userEmail}
            </Text>
          </View>

          {/* Stats */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.xl,
              marginTop: spacing.lg,
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                42
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Posts
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                156
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Followers
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>
                89
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Following
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Details */}
        <View style={{ padding: spacing.lg }}>
          {/* Bio Section */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                About
              </Text>
            </View>
            {isEditing ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  fontSize: 14,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                placeholder="Tell us about yourself..."
                placeholderTextColor={colors.mutedForeground}
              />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {bio || 'No bio added yet'}
              </Text>
            )}
          </View>

          {/* Location */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name="location-outline" size={20} color={colors.mutedForeground} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                Location
              </Text>
            </View>
            {isEditing ? (
              <TextInput
                value={location}
                onChangeText={setLocation}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  fontSize: 14,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="City, State"
                placeholderTextColor={colors.mutedForeground}
              />
            ) : (
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                {location || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Denomination */}
          <View style={{ marginBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name="bookmarks-outline" size={20} color={colors.mutedForeground} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                Denomination
              </Text>
            </View>
            {isEditing ? (
              <TextInput
                value={denomination}
                onChangeText={setDenomination}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  fontSize: 14,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="e.g., Baptist, Catholic, Non-denominational"
                placeholderTextColor={colors.mutedForeground}
              />
            ) : (
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                {denomination || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Cancel Button (only show when editing) */}
          {isEditing && (
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => ({
                backgroundColor: colors.muted,
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                Cancel
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;
