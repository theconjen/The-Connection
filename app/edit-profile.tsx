/**
 * EDIT PROFILE SCREEN - The Connection Mobile App
 * -----------------------------------------------
 * Edit user profile with Christian-focused fields
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useUserProfile } from '../src/queries/follow';
import apiClient from '../src/lib/apiClient';
import * as ImagePicker from 'expo-image-picker';
import { churchesAPI, ChurchListItem } from '../src/queries/churches';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // Fetch full profile data including Christian fields
  const { data: profileData, isLoading: isLoadingProfile } = useUserProfile(user?.id || 0);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    denomination: '',
    homeChurch: '',
    favoriteBibleVerse: '',
    testimony: '',
    interests: '',
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Church affiliation state
  const [showChurchModal, setShowChurchModal] = useState(false);
  const [churchSearchQuery, setChurchSearchQuery] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<ChurchListItem | null>(null);
  const [affiliationType, setAffiliationType] = useState<'attending' | 'member'>('attending');
  const [customChurchName, setCustomChurchName] = useState('');

  // Fetch user's current church affiliation
  const { data: affiliationData } = useQuery({
    queryKey: ['church-affiliation'],
    queryFn: () => churchesAPI.getMyAffiliation(),
  });

  // Search churches
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['church-search', churchSearchQuery],
    queryFn: () => churchesAPI.search(churchSearchQuery),
    enabled: churchSearchQuery.length >= 2,
  });

  // Update church affiliation mutation
  const updateAffiliationMutation = useMutation({
    mutationFn: churchesAPI.setAffiliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-affiliation'] });
    },
  });

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profileData?.user) {
      const userData = profileData.user;
      setFormData({
        displayName: userData.displayName || '',
        bio: userData.bio || '',
        location: userData.location || '',
        denomination: userData.denomination || '',
        homeChurch: userData.homeChurch || '',
        favoriteBibleVerse: userData.favoriteBibleVerse || '',
        testimony: userData.testimony || '',
        interests: userData.interests || '',
      });
      setProfileImage(userData.profileImageUrl || null);
    }
  }, [profileData]);

  // Update church affiliation state when data is loaded
  useEffect(() => {
    if (affiliationData?.affiliation) {
      const aff = affiliationData.affiliation;
      setAffiliationType(aff.affiliationType);
      if (aff.organization) {
        setSelectedChurch({
          id: aff.organization.id,
          name: aff.organization.name,
          slug: aff.organization.slug,
          description: null,
          logoUrl: aff.organization.logoUrl,
          city: aff.organization.city,
          state: aff.organization.state,
          denomination: aff.organization.denomination,
          congregationSize: null,
        });
        setCustomChurchName('');
      } else if (aff.customChurchName) {
        setSelectedChurch(null);
        setCustomChurchName(aff.customChurchName);
      }
    }
  }, [affiliationData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.patch('/user/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
    },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      // TODO: Upload image to server
    }
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Required Field', 'Please enter your display name');
      return;
    }

    // Save church affiliation if changed
    if (selectedChurch || customChurchName) {
      try {
        await updateAffiliationMutation.mutateAsync({
          organizationId: selectedChurch?.id || null,
          customChurchName: selectedChurch ? null : customChurchName,
          affiliationType,
        });
        // Update homeChurch in form data to match
        formData.homeChurch = selectedChurch?.name || customChurchName;
      } catch (error) {
        console.error('Failed to update church affiliation:', error);
      }
    }

    updateProfileMutation.mutate(formData);
  };

  const handleSelectChurch = (church: ChurchListItem) => {
    setSelectedChurch(church);
    setCustomChurchName('');
    setShowChurchModal(false);
    setChurchSearchQuery('');
  };

  const handleUseCustomChurch = () => {
    if (churchSearchQuery.trim()) {
      setCustomChurchName(churchSearchQuery.trim());
      setSelectedChurch(null);
      setShowChurchModal(false);
      setChurchSearchQuery('');
    }
  };

  const clearChurchSelection = () => {
    setSelectedChurch(null);
    setCustomChurchName('');
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const styles = getStyles(colors);

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.hint, { marginTop: 16 }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          style={styles.headerButton}
          disabled={updateProfileMutation.isPending}
        >
          <Text style={[styles.saveText, updateProfileMutation.isPending && styles.saveTextDisabled]}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <Pressable onPress={handlePickImage} style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={48} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.photoOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.photoLabel}>Change Photo</Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={formData.displayName}
              onChangeText={(text) => updateField('displayName', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={formData.bio}
              onChangeText={(text) => updateField('bio', text)}
              maxLength={200}
            />
            <Text style={styles.hint}>{formData.bio.length}/200 characters</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="City, State"
              placeholderTextColor={colors.textMuted}
              value={formData.location}
              onChangeText={(text) => updateField('location', text)}
            />
            <Text style={styles.hint}>Help others connect with you locally</Text>
          </View>
        </View>

        {/* Faith Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faith Journey</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Denomination/Tradition</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Baptist, Presbyterian, Non-denominational"
              placeholderTextColor={colors.textMuted}
              value={formData.denomination}
              onChangeText={(text) => updateField('denomination', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Home Church</Text>
            <Pressable
              style={[styles.input, styles.churchSelector]}
              onPress={() => setShowChurchModal(true)}
            >
              {selectedChurch ? (
                <View style={styles.selectedChurchRow}>
                  <View style={styles.selectedChurchInfo}>
                    <Text style={[styles.selectedChurchName, { color: colors.textPrimary }]}>
                      {selectedChurch.name}
                    </Text>
                    {(selectedChurch.city || selectedChurch.state) && (
                      <Text style={[styles.selectedChurchLocation, { color: colors.textSecondary }]}>
                        {[selectedChurch.city, selectedChurch.state].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={clearChurchSelection} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : customChurchName ? (
                <View style={styles.selectedChurchRow}>
                  <View style={styles.selectedChurchInfo}>
                    <Text style={[styles.selectedChurchName, { color: colors.textPrimary }]}>
                      {customChurchName}
                    </Text>
                    <Text style={[styles.selectedChurchLocation, { color: colors.textMuted }]}>
                      (Not on platform yet)
                    </Text>
                  </View>
                  <Pressable onPress={clearChurchSelection} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Text style={{ color: colors.textMuted }}>Search or enter your church</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>

            {/* Affiliation Type Toggle */}
            {(selectedChurch || customChurchName) && (
              <View style={styles.affiliationToggle}>
                <Text style={[styles.affiliationLabel, { color: colors.textSecondary }]}>I am:</Text>
                <View style={styles.affiliationButtons}>
                  <Pressable
                    style={[
                      styles.affiliationButton,
                      { borderColor: affiliationType === 'attending' ? colors.primary : colors.borderSubtle },
                      affiliationType === 'attending' && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setAffiliationType('attending')}
                  >
                    <Text style={{ color: affiliationType === 'attending' ? colors.primary : colors.textSecondary, fontWeight: '500' }}>
                      Attending
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.affiliationButton,
                      { borderColor: affiliationType === 'member' ? colors.primary : colors.borderSubtle },
                      affiliationType === 'member' && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setAffiliationType('member')}
                  >
                    <Text style={{ color: affiliationType === 'member' ? colors.primary : colors.textSecondary, fontWeight: '500' }}>
                      Member
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Favorite Bible Verse</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., John 3:16"
              placeholderTextColor={colors.textMuted}
              value={formData.favoriteBibleVerse}
              onChangeText={(text) => updateField('favoriteBibleVerse', text)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Brief Testimony</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Share your faith journey..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={formData.testimony}
              onChangeText={(text) => updateField('testimony', text)}
              maxLength={500}
            />
            <Text style={styles.hint}>{formData.testimony.length}/500 characters</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests & Hobbies</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Interests</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Bible study, worship, missions, hiking"
              placeholderTextColor={colors.textMuted}
              value={formData.interests}
              onChangeText={(text) => updateField('interests', text)}
            />
            <Text style={styles.hint}>Separate with commas</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your profile helps other believers find and connect with you for fellowship, prayer, and service.
            All fields except Display Name are optional.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Church Search Modal */}
      <Modal
        visible={showChurchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChurchModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
            <Pressable onPress={() => setShowChurchModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Find Your Church</Text>
            <View style={styles.modalCloseButton} />
          </View>

          {/* Search Input */}
          <View style={[styles.modalSearchContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.modalSearchInput, { color: colors.textPrimary }]}
              placeholder="Search churches..."
              placeholderTextColor={colors.textMuted}
              value={churchSearchQuery}
              onChangeText={setChurchSearchQuery}
              autoFocus
            />
            {churchSearchQuery.length > 0 && (
              <Pressable onPress={() => setChurchSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Results */}
          {isSearching ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.churchResultItem, { borderBottomColor: colors.borderSubtle }]}
                  onPress={() => handleSelectChurch(item)}
                >
                  <View style={styles.churchResultInfo}>
                    <Text style={[styles.churchResultName, { color: colors.textPrimary }]}>{item.name}</Text>
                    {(item.city || item.state) && (
                      <Text style={[styles.churchResultLocation, { color: colors.textSecondary }]}>
                        {[item.city, item.state].filter(Boolean).join(', ')}
                      </Text>
                    )}
                    {item.denomination && (
                      <Text style={[styles.churchResultDenom, { color: colors.textMuted }]}>{item.denomination}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </Pressable>
              )}
              contentContainerStyle={styles.modalResultsList}
            />
          ) : churchSearchQuery.length >= 2 ? (
            <View style={styles.modalEmpty}>
              <Ionicons name="business-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                No churches found for "{churchSearchQuery}"
              </Text>
              <Pressable
                style={[styles.useCustomButton, { backgroundColor: colors.primary }]}
                onPress={handleUseCustomChurch}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Use "{churchSearchQuery}" anyway</Text>
              </Pressable>
              <Text style={[styles.modalHint, { color: colors.textMuted }]}>
                Your church may not be on the platform yet
              </Text>
            </View>
          ) : (
            <View style={styles.modalEmpty}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                Type at least 2 characters to search
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerButton: {
      minWidth: 60,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cancelText: {
      fontSize: 16,
      color: colors.textMuted,
    },
    saveText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'right',
    },
    saveTextDisabled: {
      color: colors.textMuted,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    photoSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    photoContainer: {
      position: 'relative',
    },
    photo: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    photoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surfaceMuted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.background,
    },
    photoLabel: {
      marginTop: 8,
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    field: {
      marginBottom: 20,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: colors.surfaceMuted,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    // Church selector styles
    churchSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedChurchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    selectedChurchInfo: {
      flex: 1,
    },
    selectedChurchName: {
      fontSize: 15,
      fontWeight: '500',
    },
    selectedChurchLocation: {
      fontSize: 13,
      marginTop: 2,
    },
    affiliationToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 12,
    },
    affiliationLabel: {
      fontSize: 14,
    },
    affiliationButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    affiliationButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 4,
    },
    modalLoading: {
      padding: 40,
      alignItems: 'center',
    },
    modalResultsList: {
      paddingHorizontal: 16,
    },
    churchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    churchResultInfo: {
      flex: 1,
    },
    churchResultName: {
      fontSize: 16,
      fontWeight: '500',
    },
    churchResultLocation: {
      fontSize: 14,
      marginTop: 2,
    },
    churchResultDenom: {
      fontSize: 13,
      marginTop: 2,
    },
    modalEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 12,
    },
    modalEmptyText: {
      fontSize: 15,
      textAlign: 'center',
    },
    useCustomButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    modalHint: {
      fontSize: 13,
      textAlign: 'center',
    },
  });
