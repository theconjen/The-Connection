/**
 * Church Profile Screen
 * View church details, leaders, and sermons
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Linking,
  RefreshControl,
  ActionSheetIOS,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Text } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { churchesAPI, ChurchLeader, ChurchSermon } from '../queries/churches';

interface ChurchProfileScreenProps {
  slug: string;
  onBack: () => void;
}

export function ChurchProfileScreen({ slug, onBack }: ChurchProfileScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAffiliationModal, setShowAffiliationModal] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['church', slug],
    queryFn: () => churchesAPI.getBySlug(slug),
  });

  // Get user's current church affiliation
  const { data: affiliationData } = useQuery({
    queryKey: ['my-church-affiliation'],
    queryFn: () => churchesAPI.getMyAffiliation(),
  });

  // Get connections who attend this church
  const { data: connectionsData } = useQuery({
    queryKey: ['church-connections', data?.organization?.id],
    queryFn: () => churchesAPI.getConnectionsAttending(data!.organization!.id),
    enabled: !!data?.organization?.id,
  });

  const church = data?.organization;
  const leaders = data?.leaders ?? [];
  const sermons = data?.sermons ?? [];

  // Check if user is affiliated with THIS church
  const myAffiliation = affiliationData?.affiliation;
  const isAffiliatedWithThisChurch = myAffiliation?.organizationId === church?.id;
  const currentAffiliationType = isAffiliatedWithThisChurch ? myAffiliation?.affiliationType : null;

  // Affiliation mutations
  const setAffiliationMutation = useMutation({
    mutationFn: (affiliationType: 'attending' | 'member') =>
      churchesAPI.setAffiliation({
        organizationId: church?.id,
        affiliationType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-church-affiliation'] });
      setShowAffiliationModal(false);
    },
  });

  const removeAffiliationMutation = useMutation({
    mutationFn: () => churchesAPI.removeAffiliation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-church-affiliation'] });
      setShowAffiliationModal(false);
    },
  });

  const handleOpenWebsite = () => {
    if (church?.website) {
      const url = church.website.startsWith('http') ? church.website : `https://${church.website}`;
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (church?.publicPhone) {
      Linking.openURL(`tel:${church.publicPhone}`);
    }
  };

  const handleOpenMaps = () => {
    if (church?.publicAddress) {
      const address = encodeURIComponent(
        [church.publicAddress, church.city, church.state, church.publicZipCode]
          .filter(Boolean)
          .join(', ')
      );

      const openAppleMaps = () => {
        Linking.openURL(`maps://maps.apple.com/?q=${address}`);
      };

      const openGoogleMaps = () => {
        Linking.openURL(`https://maps.google.com/?q=${address}`);
      };

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Apple Maps', 'Google Maps'],
            cancelButtonIndex: 0,
            title: 'Open in Maps',
          },
          (buttonIndex) => {
            if (buttonIndex === 1) {
              openAppleMaps();
            } else if (buttonIndex === 2) {
              openGoogleMaps();
            }
          }
        );
      } else {
        // Android - show Alert with options
        Alert.alert(
          'Open in Maps',
          'Choose your preferred maps app',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Google Maps', onPress: openGoogleMaps },
          ]
        );
      }
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const renderLeaderCard = (leader: ChurchLeader) => (
    <View
      key={leader.id}
      style={[styles.leaderCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
    >
      {leader.photoUrl ? (
        <Image source={{ uri: leader.photoUrl }} style={styles.leaderPhoto} />
      ) : (
        <View style={[styles.leaderPhotoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
      )}
      <Text style={[styles.leaderName, { color: colors.textPrimary }]}>{leader.name}</Text>
      {leader.title && (
        <Text style={[styles.leaderTitle, { color: colors.textSecondary }]}>{leader.title}</Text>
      )}
    </View>
  );

  const renderSermonCard = (sermon: ChurchSermon) => (
    <Pressable
      key={sermon.id}
      style={[styles.sermonCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
      onPress={() => router.push(`/sermons/${sermon.id}`)}
    >
      <View style={styles.sermonContent}>
        {sermon.thumbnailUrl ? (
          <Image source={{ uri: sermon.thumbnailUrl }} style={styles.sermonThumbnail} />
        ) : (
          <View style={[styles.sermonThumbnailPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="play-circle" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.sermonInfo}>
          <Text style={[styles.sermonTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {sermon.title}
          </Text>
          {sermon.speaker && (
            <Text style={[styles.sermonSpeaker, { color: colors.textSecondary }]}>{sermon.speaker}</Text>
          )}
          <View style={styles.sermonMeta}>
            {sermon.sermonDate && (
              <Text style={[styles.sermonDate, { color: colors.textMuted }]}>
                {new Date(sermon.sermonDate).toLocaleDateString()}
              </Text>
            )}
            {sermon.duration && (
              <Text style={[styles.sermonDuration, { color: colors.textMuted }]}>
                {formatDuration(sermon.duration)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Church</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !church) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Church</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>Church not found</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground }]}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {church.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Church Header */}
        <View style={styles.profileHeader}>
          {church.logoUrl ? (
            <Image source={{ uri: church.logoUrl }} style={styles.logo} />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Image
                source={require('../../assets/church-icon.png')}
                style={{ width: 56, height: 56, tintColor: colors.primary }}
                resizeMode="contain"
              />
            </View>
          )}
          <Text style={[styles.churchName, { color: colors.textPrimary }]}>{church.name}</Text>
          {church.denomination && (
            <Text style={[styles.denomination, { color: colors.textSecondary }]}>{church.denomination}</Text>
          )}
          {(church.city || church.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {[church.city, church.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {church.website && (
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleOpenWebsite}>
              <Ionicons name="globe-outline" size={20} color={colors.primaryForeground} />
              <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Website</Text>
            </Pressable>
          )}
          {church.publicPhone && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1 }]}
              onPress={handleCall}
            >
              <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Call</Text>
            </Pressable>
          )}
          {church.publicAddress && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1 }]}
              onPress={handleOpenMaps}
            >
              <Ionicons name="navigate-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Directions</Text>
            </Pressable>
          )}
        </View>

        {/* Church Affiliation Section */}
        <Pressable
          style={[
            styles.affiliationCard,
            {
              backgroundColor: isAffiliatedWithThisChurch ? colors.primary + '10' : colors.surface,
              borderColor: isAffiliatedWithThisChurch ? colors.primary : colors.borderSubtle,
            }
          ]}
          onPress={() => setShowAffiliationModal(true)}
        >
          <View style={styles.affiliationContent}>
            <View style={[
              styles.affiliationIconContainer,
              { backgroundColor: isAffiliatedWithThisChurch ? colors.primary + '20' : colors.surfaceMuted }
            ]}>
              <Ionicons
                name={isAffiliatedWithThisChurch ? "checkmark-circle" : "add-circle-outline"}
                size={24}
                color={isAffiliatedWithThisChurch ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={styles.affiliationTextContainer}>
              {isAffiliatedWithThisChurch ? (
                <>
                  <Text style={[styles.affiliationTitle, { color: colors.primary }]}>
                    {currentAffiliationType === 'member' ? "I'm a Member" : "I Attend Here"}
                  </Text>
                  <Text style={[styles.affiliationSubtitle, { color: colors.textSecondary }]}>
                    Tap to update your status
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.affiliationTitle, { color: colors.textPrimary }]}>
                    This is my church
                  </Text>
                  <Text style={[styles.affiliationSubtitle, { color: colors.textSecondary }]}>
                    Let others know you attend here
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Pressable>

        {/* Connections Attending Section */}
        {connectionsData && connectionsData.count > 0 && (
          <View style={[styles.connectionsCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.connectionsContent}>
              <View style={styles.connectionsAvatars}>
                {connectionsData.connections.slice(0, 3).map((connection, index) => (
                  <View
                    key={connection.id}
                    style={[
                      styles.connectionAvatar,
                      { marginLeft: index > 0 ? -12 : 0, zIndex: 3 - index },
                    ]}
                  >
                    {connection.avatarUrl ? (
                      <Image
                        source={{ uri: connection.avatarUrl }}
                        style={[styles.connectionAvatarImage, { borderColor: colors.surface }]}
                      />
                    ) : (
                      <View style={[styles.connectionAvatarPlaceholder, { backgroundColor: colors.primary + '20', borderColor: colors.surface }]}>
                        <Text style={[styles.connectionAvatarInitial, { color: colors.primary }]}>
                          {(connection.displayName || connection.username)[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.connectionsTextContainer}>
                <Text style={[styles.connectionsText, { color: colors.textPrimary }]}>
                  {connectionsData.count === 1 ? (
                    <Text>
                      <Text style={{ fontWeight: '600' }}>{connectionsData.connections[0].displayName || connectionsData.connections[0].username}</Text>
                      {' attends here'}
                    </Text>
                  ) : connectionsData.count <= 3 ? (
                    <Text>
                      <Text style={{ fontWeight: '600' }}>{connectionsData.count} of your connections</Text>
                      {' attend here'}
                    </Text>
                  ) : (
                    <Text>
                      <Text style={{ fontWeight: '600' }}>{connectionsData.connections[0].displayName || connectionsData.connections[0].username}</Text>
                      {` and ${connectionsData.count - 1} other connections attend here`}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* About Section */}
        {(church.description || church.mission) && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About</Text>
            {church.mission && (
              <Text style={[styles.missionText, { color: colors.textSecondary }]}>{church.mission}</Text>
            )}
            {church.description && (
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{church.description}</Text>
            )}
          </View>
        )}

        {/* Service Times */}
        {church.serviceTimes && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service Times</Text>
            </View>
            <Text style={[styles.serviceTimesText, { color: colors.textSecondary }]}>{church.serviceTimes}</Text>
          </View>
        )}

        {/* Address */}
        {church.publicAddress && (
          <Pressable
            style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={handleOpenMaps}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address</Text>
            </View>
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {church.publicAddress}
            </Text>
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>
              {[church.city, church.state, church.publicZipCode].filter(Boolean).join(', ')}
            </Text>
          </Pressable>
        )}

        {/* Leaders Section */}
        {leaders.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitleLarge, { color: colors.textPrimary }]}>Leadership</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leadersScroll}>
              {leaders.map(renderLeaderCard)}
            </ScrollView>
          </View>
        )}

        {/* Sermons Section */}
        {sermons.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitleLarge, { color: colors.textPrimary }]}>Sermons</Text>
            {sermons.slice(0, 5).map(renderSermonCard)}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Affiliation Modal */}
      <Modal
        visible={showAffiliationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAffiliationModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
            <Pressable onPress={() => setShowAffiliationModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>My Church</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalChurchInfo}>
              {church?.logoUrl ? (
                <Image source={{ uri: church.logoUrl }} style={styles.modalChurchLogo} />
              ) : (
                <View style={[styles.modalChurchLogoPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                  <Image
                    source={require('../../assets/church-icon.png')}
                    style={{ width: 32, height: 32, tintColor: colors.primary }}
                    resizeMode="contain"
                  />
                </View>
              )}
              <Text style={[styles.modalChurchName, { color: colors.textPrimary }]}>{church?.name}</Text>
            </View>

            <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
              Select your relationship with this church
            </Text>

            {/* Attending Option */}
            <Pressable
              style={[
                styles.affiliationOption,
                {
                  backgroundColor: currentAffiliationType === 'attending' ? colors.primary + '10' : colors.surface,
                  borderColor: currentAffiliationType === 'attending' ? colors.primary : colors.borderSubtle,
                }
              ]}
              onPress={() => setAffiliationMutation.mutate('attending')}
              disabled={setAffiliationMutation.isPending}
            >
              <View style={styles.affiliationOptionContent}>
                <Ionicons
                  name={currentAffiliationType === 'attending' ? "checkmark-circle" : "people-outline"}
                  size={24}
                  color={currentAffiliationType === 'attending' ? colors.primary : colors.textSecondary}
                />
                <View style={styles.affiliationOptionText}>
                  <Text style={[styles.affiliationOptionTitle, { color: colors.textPrimary }]}>
                    I Attend Here
                  </Text>
                  <Text style={[styles.affiliationOptionDescription, { color: colors.textSecondary }]}>
                    I regularly visit this church for services
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Member Option */}
            <Pressable
              style={[
                styles.affiliationOption,
                {
                  backgroundColor: currentAffiliationType === 'member' ? colors.primary + '10' : colors.surface,
                  borderColor: currentAffiliationType === 'member' ? colors.primary : colors.borderSubtle,
                }
              ]}
              onPress={() => setAffiliationMutation.mutate('member')}
              disabled={setAffiliationMutation.isPending}
            >
              <View style={styles.affiliationOptionContent}>
                <Ionicons
                  name={currentAffiliationType === 'member' ? "checkmark-circle" : "ribbon-outline"}
                  size={24}
                  color={currentAffiliationType === 'member' ? colors.primary : colors.textSecondary}
                />
                <View style={styles.affiliationOptionText}>
                  <Text style={[styles.affiliationOptionTitle, { color: colors.textPrimary }]}>
                    I'm a Member
                  </Text>
                  <Text style={[styles.affiliationOptionDescription, { color: colors.textSecondary }]}>
                    I am an official member of this church
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Remove affiliation button */}
            {isAffiliatedWithThisChurch && (
              <Pressable
                style={[styles.removeAffiliationButton, { borderColor: colors.destructive }]}
                onPress={() => {
                  Alert.alert(
                    'Remove Affiliation',
                    'Are you sure you want to remove your affiliation with this church?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeAffiliationMutation.mutate(),
                      },
                    ]
                  );
                }}
                disabled={removeAffiliationMutation.isPending}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.destructive} />
                <Text style={[styles.removeAffiliationText, { color: colors.destructive }]}>
                  Remove my affiliation
                </Text>
              </Pressable>
            )}

            {(setAffiliationMutation.isPending || removeAffiliationMutation.isPending) && (
              <ActivityIndicator style={{ marginTop: 16 }} color={colors.primary} />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  churchName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  denomination: {
    fontSize: 15,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  missionText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  serviceTimesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  leadersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  leaderCard: {
    width: 120,
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaderPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  leaderPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  leaderName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  leaderTitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  sermonCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sermonContent: {
    flexDirection: 'row',
    padding: 12,
  },
  sermonThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  sermonThumbnailPlaceholder: {
    width: 80,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sermonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sermonTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sermonSpeaker: {
    fontSize: 13,
    marginBottom: 4,
  },
  sermonMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  sermonDate: {
    fontSize: 12,
  },
  sermonDuration: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 40,
  },
  // Affiliation styles
  affiliationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  affiliationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affiliationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affiliationTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  affiliationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  affiliationSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // Connections attending styles
  connectionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  connectionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionsAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionAvatar: {
    width: 32,
    height: 32,
  },
  connectionAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  connectionAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionAvatarInitial: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectionsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  connectionsText: {
    fontSize: 14,
    lineHeight: 20,
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
  modalContent: {
    padding: 20,
  },
  modalChurchInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalChurchLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalChurchLogoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalChurchName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSectionLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  affiliationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  affiliationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  affiliationOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  affiliationOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  affiliationOptionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  removeAffiliationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeAffiliationText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ChurchProfileScreen;
