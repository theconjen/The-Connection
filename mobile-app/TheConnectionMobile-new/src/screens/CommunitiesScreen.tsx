/**
 * CommunitiesScreen - Optimized Christian Communities Discovery
 * Features: Icon-only design, advanced filters, search functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, useTheme } from '../theme';
import { AppHeader } from './AppHeader';
import { ChannelCard, AddChannelCard, Channel } from './ChannelCard';
import { fetchCommunities } from '../services/communitiesService';
import { getCurrentLocation, formatDistance } from '../services/locationService';
import { useQuery } from '@tanstack/react-query';
import { communitiesAPI } from '../lib/apiClient';

// Helper to create a light/pastel background from a hex color
function getLightBackground(hexColor: string): string {
  if (!hexColor) return '#E0E7FF'; // Default pastel indigo

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Mix with white (0.85 white, 0.15 original color) for a light pastel
  const lightR = Math.round(r * 0.15 + 255 * 0.85);
  const lightG = Math.round(g * 0.15 + 255 * 0.85);
  const lightB = Math.round(b * 0.15 + 255 * 0.85);

  // Convert back to hex
  return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

// Category type
interface Category {
  id: string;
  title: string;
  count: string;
  iconName: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  accentColor: string;
  borderColor: string;
}

// Community type
interface Community {
  id: number;
  title: string;
  subtitle: string;
  members: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tag: string;
  bgColor: string;
  iconColor: string;
  isNew: boolean;
  distance?: number | null;
  isActive?: boolean;
  activityLabel?: string | null;
}

// Filter category interface
interface FilterCategory {
  id: string;
  name: string;
  iconName: keyof typeof Ionicons.glyphMap;
  options: string[];
}

// Filter Modal Component
function FilterModal({
  visible,
  onClose,
  selectedFilters,
  onApplyFilters,
}: {
  visible: boolean;
  onClose: () => void;
  selectedFilters: Record<string, string[]>;
  onApplyFilters: (filters: Record<string, string[]>) => void;
}) {
  const { colors, spacing, radii } = useTheme();
  const [tempFilters, setTempFilters] = useState(selectedFilters);

  const filterCategories: FilterCategory[] = [
    {
      id: 'ageGroup',
      name: 'Age Group',
      iconName: 'people',
      options: ['Youth', 'Young Adult', 'Adult', 'Seniors', 'All Ages'],
    },
    {
      id: 'gender',
      name: 'Gender',
      iconName: 'person',
      options: ["Men's Only", "Women's Only", 'Co-Ed'],
    },
    {
      id: 'ministry',
      name: 'Ministry Type',
      iconName: 'book',
      options: [
        'Bible Study',
        'Prayer',
        'Worship',
        'Discipleship',
        'Evangelism',
        'Missions',
        'Apologetics',
        'Youth Ministry',
        'Children Ministry',
      ],
    },
    {
      id: 'activities',
      name: 'Activities',
      iconName: 'football',
      options: [
        'Sports',
        'Basketball',
        'Soccer',
        'Running',
        'Hiking',
        'Fitness',
        'Cycling',
        'Swimming',
        'Golf',
        'Tennis',
        'Volleyball',
        'Arts & Crafts',
        'Music',
        'Worship Music',
        'Photography',
        'Writing',
        'Dancing',
        'Theater/Drama',
        'Book Club',
        'Cooking',
        'Baking',
        'Gardening',
        'Gaming',
        'Board Games',
        'Outdoor Adventures',
        'Camping',
        'Fishing',
        'Travel',
        'Movies',
        'Coffee & Conversations',
        'Service Projects',
        'Volunteering',
        'Mentoring',
      ],
    },
    {
      id: 'professions',
      name: 'Professions',
      iconName: 'briefcase',
      options: [
        'Healthcare',
        'Teachers',
        'Business',
        'Tech',
        'Creatives',
        'Legal',
        'First Responders',
        'Military',
        'Blue Collar',
        'Entrepreneurs',
        'Students',
      ],
    },
    {
      id: 'recovery',
      name: 'Recovery & Support',
      iconName: 'medical',
      options: [
        'Addiction Recovery',
        'Grief Support',
        'Mental Health',
        'Divorce Recovery',
        'Financial Recovery',
        'Health Challenges',
      ],
    },
    {
      id: 'meetingType',
      name: 'Meeting Type',
      iconName: 'location',
      options: ['In-Person', 'Online', 'Hybrid'],
    },
    {
      id: 'frequency',
      name: 'Frequency',
      iconName: 'calendar',
      options: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'One-time'],
    },
    {
      id: 'lifeStage',
      name: 'Life Stage',
      iconName: 'heart',
      options: [
        'Singles',
        'Married',
        'Students',
        'Young Professionals',
        'Seniors',
        'New Believers',
        'Ministry Leaders',
      ],
    },
    {
      id: 'parents',
      name: 'Parents',
      iconName: 'heart-circle',
      options: [
        'All Parents',
        'Moms',
        'Dads',
        'Single Parents',
        'Adoptive Parents',
        'Foster Parents',
        'Expecting Parents',
      ],
    },
    {
      id: 'distance',
      name: 'Distance (for local groups)',
      iconName: 'navigate',
      options: [
        'Within 3 miles',
        'Within 5 miles',
        'Within 10 miles',
        'Within 25 miles',
        'Within 50 miles',
        'Within 100 miles',
        'Anywhere',
      ],
    },
  ];

  const toggleFilterOption = (categoryId: string, option: string) => {
    setTempFilters((prev) => {
      const categoryFilters = prev[categoryId] || [];
      const isSelected = categoryFilters.includes(option);
      return {
        ...prev,
        [categoryId]: isSelected
          ? categoryFilters.filter((f) => f !== option)
          : [...categoryFilters, option],
      };
    });
  };

  const clearAll = () => {
    setTempFilters({});
    onApplyFilters({}); // Apply empty filters immediately
    onClose(); // Close the modal
  };

  const applyFilters = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const getActiveFilterCount = () => {
    return Object.values(tempFilters).reduce((sum, arr) => sum + arr.length, 0);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          }}
        >
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text variant="body" style={{ fontWeight: '700' }}>
            Filters
          </Text>
          <Pressable onPress={clearAll}>
            <Text style={{ color: colors.secondary, fontWeight: '600' }}>Clear</Text>
          </Pressable>
        </View>

        {/* Filter Categories */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {filterCategories.map((category) => (
            <View key={category.id} style={{ padding: spacing.lg }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons
                  name={category.iconName}
                  size={20}
                  color={colors.textPrimary}
                />
                <Text variant="bodySmall" style={{ fontWeight: '700' }}>
                  {category.name}
                </Text>
              </View>

              {/* Filter Options */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                }}
              >
                {category.options.map((option) => {
                  const isSelected =
                    tempFilters[category.id]?.includes(option) || false;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => toggleFilterOption(category.id, option)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radii.full,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.textPrimary,
                          fontWeight: '500',
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Apply Button */}
        <View
          style={{
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            onPress={applyFilters}
            style={{
              backgroundColor: colors.primary,
              padding: spacing.md,
              borderRadius: radii.lg,
              alignItems: 'center',
            }}
          >
            <Text
              variant="body"
              style={{ color: colors.primaryForeground, fontWeight: '700' }}
            >
              Apply Filters
              {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Category card component
function CategoryCard({
  category,
  onPress,
}: {
  category: Category;
  onPress?: () => void;
}) {
  const { spacing, radii } = useTheme();

  // Map invalid icon names to valid ones
  const getValidIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'pray': 'hand-right',
      'church': 'business',
      'prayer': 'hand-right',
      'users': 'people',
      'user': 'person',
    };

    return (iconMap[iconName] || iconName || 'apps') as keyof typeof Ionicons.glyphMap;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: category.bgColor,
        borderWidth: 1,
        borderColor: category.borderColor,
        borderRadius: radii.xl,
        padding: spacing.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Ionicons name={getValidIconName(category.iconName)} size={18} color={category.accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          variant="caption"
          style={{ fontWeight: '700', color: '#FFFFFF', lineHeight: 16 }}
        >
          {category.title}
        </Text>
        <Text style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' }}>
          {category.count} groups
        </Text>
      </View>
    </Pressable>
  );
}

// Community row component
function CommunityRow({
  community,
  onPress,
}: {
  community: Community;
  onPress?: () => void;
}) {
  const { colors, spacing, radii } = useTheme();

  // Map invalid icon names to valid ones
  const getValidIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'pray': 'hand-right',
      'church': 'business',
      'prayer': 'hand-right',
      'users': 'people',
      'user': 'person',
    };

    return (iconMap[iconName] || iconName || 'people') as keyof typeof Ionicons.glyphMap;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.backgroundSoft,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.lg,
          backgroundColor: community.bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={getValidIconName(community.iconName)} size={20} color={community.iconColor} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            marginBottom: 2,
          }}
        >
          <Text
            variant="bodySmall"
            style={{ fontWeight: '700', color: colors.textPrimary }}
            numberOfLines={1}
          >
            {community.title}
          </Text>
          {community.isActive && (
            <View
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: radii.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                ACTIVE
              </Text>
            </View>
          )}
          {community.isNew && !community.isActive && (
            <View
              style={{
                backgroundColor: colors.secondary,
                paddingHorizontal: 4,
                paddingVertical: 1,
                borderRadius: radii.sm,
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontWeight: '700',
                  color: colors.secondaryForeground,
                }}
              >
                NEW
              </Text>
            </View>
          )}
        </View>

        <Text
          variant="caption"
          color="textMuted"
          numberOfLines={1}
          style={{ marginBottom: community.activityLabel ? 2 : spacing.xs }}
        >
          {community.subtitle}
        </Text>

        {/* Activity Label */}
        {community.activityLabel && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginBottom: spacing.xs,
            }}
          >
            <Ionicons name="pulse" size={10} color="#10B981" />
            <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>
              {community.activityLabel}
            </Text>
          </View>
        )}

        {/* Tags */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {/* Distance badge - show first if available */}
          {community.distance !== undefined && community.distance !== null && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#E0F2FE',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: radii.sm,
              }}
            >
              <Ionicons name="navigate" size={10} color="#0284C7" />
              <Text style={{ fontSize: 10, color: '#0284C7', fontWeight: '600' }}>
                {formatDistance(community.distance)}
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.background,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: radii.sm,
            }}
          >
            <Ionicons name="people" size={10} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textMuted }}>
              {community.members}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: colors.background,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: radii.sm,
            }}
          >
            <Ionicons name="location" size={10} color={colors.textMuted} />
            <Text style={{ fontSize: 10, color: colors.textMuted }}>
              {community.tag}
            </Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

// Main screen props
interface CommunitiesScreenProps {
  showCenteredLogo?: boolean;
  userName?: string;
  userAvatar?: string | null;
  onProfilePress?: () => void;
  onMessagesPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onCreatePress?: () => void;
  onCommunityPress?: (community: Community) => void;
  onCategoryPress?: (category: Category) => void;
  selectedCategory?: string | null;
  onClearCategory?: () => void;
  unreadNotificationCount?: number;
  unreadMessageCount?: number;
}

export function CommunitiesScreen({
  showCenteredLogo = false,
  userName,
  userAvatar,
  onProfilePress,
  onMessagesPress,
  onMenuPress,
  onSearchPress,
  onCreatePress,
  onCommunityPress,
  onCategoryPress,
  selectedCategory,
  onClearCategory,
  unreadNotificationCount = 0,
  unreadMessageCount = 0,
}: CommunitiesScreenProps) {
  const { colors, spacing, radii, colorScheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch user's communities for "Your Communities" section
  const { data: userCommunities = [], refetch: refetchCommunities } = useQuery({
    queryKey: ['/api/communities'],
    queryFn: communitiesAPI.getAll,
    staleTime: 0, // Always fetch fresh data to ensure membership status is current
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
  });

  // Fetch active communities for "Active Communities" section
  const { data: activeCommunities = [] } = useQuery({
    queryKey: ['/api/communities/active'],
    queryFn: () => communitiesAPI.getActive(8),
    staleTime: 60000, // Cache for 1 minute
  });

  // Map communities to channels format for the horizontal scroll
  const userChannels: Channel[] = React.useMemo(() => {
    // Ensure userCommunities is an array before filtering
    if (!userCommunities || !Array.isArray(userCommunities)) {
      return [];
    }
    return userCommunities
      .filter((community: any) => community.isMember)
      .slice(0, 10)
      .map((community: any) => ({
        id: community.id,
        name: community.name,
        members: community.memberCount ? `${(community.memberCount / 1000).toFixed(1)}k` : '0',
        icon: community.name.charAt(0).toUpperCase(),
        isJoined: true,
        communityId: community.id,
        slug: community.slug,
        color: community.iconColor, // Use community's brand color
      }));
  }, [userCommunities]);

  const getActiveFilterCount = () => {
    return Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);
  };

  // Get user location on mount
  useEffect(() => {
    const loadLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation(location);
        }
      } catch (err) {
        // Non-blocking - continue without location
      }
    };

    loadLocation();
  }, []);

  // Parse distance filter into miles
  const getMaxDistanceMiles = (): number | null => {
    const distanceFilter = selectedFilters.distance?.[0];
    if (!distanceFilter || distanceFilter === 'Anywhere') return null;

    // Extract number from "Within X miles"
    const match = distanceFilter.match(/Within (\d+) miles/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Fetch communities when filters, search query, or location changes
  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const maxDistance = getMaxDistanceMiles();
        const data = await fetchCommunities(searchQuery, selectedFilters, userLocation, maxDistance);
        setCommunities(data);
      } catch (err) {
        console.error('Error loading communities:', err);
        setError('Failed to load communities');
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunities();
  }, [searchQuery, selectedFilters, userLocation]);

  // Featured Categories section removed - simplified UI

  // Filter communities by selected category
  const filteredCommunities = React.useMemo(() => {
    if (!selectedCategory) {
      console.info('[CommunitiesScreen] No category selected, showing all communities:', communities.length);
      return communities;
    }

    console.info('[CommunitiesScreen] Filtering by category:', selectedCategory);

    // Map category IDs to filter fields
    const categoryMap: Record<string, { field: keyof any; value: string }> = {
      'bible-study': { field: 'ministryTypes', value: 'Bible Study' },
      'prayer': { field: 'ministryTypes', value: 'Prayer' },
      'worship': { field: 'ministryTypes', value: 'Worship' },
      'missions': { field: 'ministryTypes', value: 'Missions' },
      'discipleship': { field: 'ministryTypes', value: 'Discipleship' },
      'youth': { field: 'ministryTypes', value: 'Youth Ministry' },
      'sports': { field: 'activities', value: 'Sports' },
      'music': { field: 'activities', value: 'Music' },
      'hiking': { field: 'activities', value: 'Hiking' },
      'arts': { field: 'activities', value: 'Arts & Crafts' },
      'book-club': { field: 'activities', value: 'Book Club' },
      'service': { field: 'activities', value: 'Service Projects' },
      'healthcare': { field: 'professions', value: 'Healthcare' },
      'teachers': { field: 'professions', value: 'Teachers' },
      'business': { field: 'professions', value: 'Business' },
      'tech': { field: 'professions', value: 'Tech' },
      'creatives': { field: 'professions', value: 'Creatives' },
      'blue-collar': { field: 'professions', value: 'Blue Collar' },
      'young-professionals': { field: 'lifeStages', value: 'Young Professionals' },
      'singles': { field: 'lifeStages', value: 'Singles' },
      'married': { field: 'lifeStages', value: 'Married' },
      'parents': { field: 'lifeStages', value: 'Parents' },
      'seniors': { field: 'lifeStages', value: 'Seniors' },
      'recovery': { field: 'recoverySupport', value: 'Addiction Recovery' },
      'grief-support': { field: 'recoverySupport', value: 'Grief Support' },
    };

    const mapping = categoryMap[selectedCategory];
    if (!mapping) {
      console.info('[CommunitiesScreen] No mapping found for category:', selectedCategory);
      return communities;
    }

    console.info('[CommunitiesScreen] Mapping:', mapping);

    const filtered = communities.filter((community: any) => {
      const fieldValue = community[mapping.field];
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(mapping.value);
      }
      return fieldValue === mapping.value;
    });

    console.info('[CommunitiesScreen] Filtered communities:', filtered.length);
    console.info('[CommunitiesScreen] Filtered community names:', filtered.map((c: any) => c.name));

    return filtered;
  }, [communities, selectedCategory]);

  // Communities are now fetched from the API via useEffect above

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.header }}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* App Header with Logo */}
        <AppHeader
          showCenteredLogo={true}
          userName={userName}
          userAvatar={userAvatar}
          onProfilePress={onProfilePress}
          showMessages={true}
          onMessagesPress={onMessagesPress}
          showMenu={true}
          onMenuPress={onMenuPress}
          unreadNotificationCount={unreadNotificationCount}
          unreadMessageCount={unreadMessageCount}
        />

        {/* Your Communities Section - always show for Discover button access */}
        <View
          style={{
            backgroundColor: colors.surface,
            marginTop: spacing.sm,
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="people" size={14} color={colors.textMuted} />
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>Your Communities</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <AddChannelCard
              onPress={() => setShowFilterModal(true)}
              activeFilterCount={getActiveFilterCount()}
            />
            {userChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onPress={() => onCommunityPress?.({ id: channel.communityId } as any)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Active Communities Section */}
        {activeCommunities.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              padding: spacing.lg,
              paddingTop: spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                }}
              />
              <Text variant="bodySmall" style={{ fontWeight: '600' }}>
                Active Communities
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {activeCommunities.map((community: any) => (
                <Pressable
                  key={community.id}
                  onPress={() => onCommunityPress?.(community as any)}
                  style={({ pressed }) => ({
                    backgroundColor: getLightBackground(community.iconColor),
                    borderRadius: radii.xl,
                    padding: spacing.md,
                    width: 160,
                    borderWidth: 1,
                    borderColor: community.iconColor + '30',
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: radii.lg,
                        backgroundColor: community.iconColor || '#4F46E5',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name={(community.iconName || 'people') as any}
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                    <View
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 5,
                        paddingVertical: 2,
                        borderRadius: radii.sm,
                      }}
                    >
                      <Text style={{ fontSize: 8, fontWeight: '700', color: '#FFFFFF' }}>
                        ACTIVE
                      </Text>
                    </View>
                  </View>
                  <Text
                    variant="bodySmall"
                    style={{ fontWeight: '700', color: colors.textPrimary }}
                    numberOfLines={1}
                  >
                    {community.name}
                  </Text>
                  {community.activityLabel && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <Ionicons name="pulse" size={10} color="#10B981" />
                      <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '500' }}>
                        {community.activityLabel}
                      </Text>
                    </View>
                  )}
                  <Text
                    variant="caption"
                    style={{ color: colors.textMuted, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {community.memberCount || 0} members
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceMuted,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              height: 44,
              gap: spacing.sm,
            }}
          >
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.textPrimary,
              }}
              placeholder="Search communities..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Suggested Section */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>
              Suggested
            </Text>
            <Pressable>
              <Text
                variant="caption"
                style={{ color: colors.secondary, fontWeight: '500' }}
              >
                View all
              </Text>
            </Pressable>
          </View>

          {/* Category Filter Indicator */}
          {selectedCategory && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '15',
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.lg,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: colors.primary + '30',
              }}
            >
              <Ionicons name="funnel" size={14} color={colors.primary} />
              <Text
                variant="caption"
                style={{
                  marginLeft: spacing.sm,
                  color: colors.primary,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                Filtering by: {selectedCategory}
              </Text>
              <Pressable
                onPress={onClearCategory}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 4,
                  backgroundColor: colors.primary,
                  borderRadius: radii.md,
                }}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: spacing.sm, color: colors.textMuted }}>
                Loading communities...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <Ionicons name="alert-circle" size={48} color={colors.destructive} />
              <Text style={{ marginTop: spacing.sm, color: colors.destructive }}>
                {error}
              </Text>
            </View>
          )}

          {/* Community List */}
          {!isLoading && !error && (
            <View style={{ gap: spacing.sm }}>
              {filteredCommunities.length === 0 ? (
                <View style={{ alignItems: 'center', padding: spacing.xl }}>
                  <Ionicons name="search" size={48} color={colors.textMuted} />
                  <Text style={{ marginTop: spacing.sm, color: colors.textMuted }}>
                    No communities found
                  </Text>
                  <Text style={{ marginTop: spacing.xs, color: colors.textMuted, fontSize: 12 }}>
                    Try adjusting your filters
                  </Text>
                </View>
              ) : (
                filteredCommunities.map((community) => (
                  <CommunityRow
                    key={community.id}
                    community={{
                      id: community.id,
                      title: community.name,
                      subtitle: community.description,
                      members: community.memberCount?.toString() || '0',
                      iconName: (community.iconName || 'people') as any,
                      tag: community.isPrivate ? 'Private' : 'Public',
                      bgColor: getLightBackground(community.iconColor),
                      iconColor: community.iconColor || '#4F46E5',
                      isNew: false,
                      distance: community.distance,
                      isActive: community.isActive,
                      activityLabel: community.activityLabel,
                    }}
                    onPress={() => onCommunityPress?.(community as any)}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilters={selectedFilters}
        onApplyFilters={setSelectedFilters}
      />
    </SafeAreaView>
  );
}
