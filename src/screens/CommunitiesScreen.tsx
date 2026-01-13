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
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
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
                  color={colors.foreground}
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
                          : colors.card,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: isSelected
                            ? colors.primaryForeground
                            : colors.foreground,
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
            borderTopColor: colors.border,
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
function CategoryCard({ category }: { category: Category }) {
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
          style={{ fontWeight: '700', color: '#0B132B', lineHeight: 16 }}
        >
          {category.title}
        </Text>
        <Text style={{ fontSize: 10, color: category.accentColor, fontWeight: '500' }}>
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
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.border,
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
            style={{ fontWeight: '700', color: colors.foreground }}
            numberOfLines={1}
          >
            {community.title}
          </Text>
          {community.isNew && (
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
          color="mutedForeground"
          numberOfLines={1}
          style={{ marginBottom: spacing.xs }}
        >
          {community.subtitle}
        </Text>

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
            <Ionicons name="people" size={10} color={colors.mutedForeground} />
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
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
            <Ionicons name="location" size={10} color={colors.mutedForeground} />
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
              {community.tag}
            </Text>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
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
}: CommunitiesScreenProps) {
  const { colors, spacing, radii } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch user's communities for "Your Communities" section
  const { data: userCommunities = [] } = useQuery({
    queryKey: ['/api/communities'],
    queryFn: communitiesAPI.getAll,
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
        console.log('Could not get user location:', err);
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

  // Featured Categories - Rotates weekly based on current week
  const getFeaturedCategories = (): Category[] => {
    // Get current week of year (0-51)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekOfYear = Math.floor(diff / oneWeek);

    // All possible featured categories from filters
    const allCategories = [
      // Ministry Types
      { id: 'bible-study', title: 'Bible Study', iconName: 'book', bgColor: '#FEF3C7', accentColor: '#D97706', borderColor: '#FDE68A' },
      { id: 'prayer', title: 'Prayer', iconName: 'hand-right', bgColor: '#E0E7FF', accentColor: '#4F46E5', borderColor: '#C7D2FE' },
      { id: 'worship', title: 'Worship', iconName: 'musical-notes', bgColor: '#FFE4E6', accentColor: '#E11D48', borderColor: '#FECDD3' },
      { id: 'missions', title: 'Missions', iconName: 'airplane', bgColor: '#DBEAFE', accentColor: '#2563EB', borderColor: '#BFDBFE' },
      { id: 'discipleship', title: 'Discipleship', iconName: 'people', bgColor: '#F5F3FF', accentColor: '#7C3AED', borderColor: '#EDE9FE' },
      { id: 'youth', title: 'Youth Ministry', iconName: 'school', bgColor: '#FEF3C7', accentColor: '#F59E0B', borderColor: '#FDE68A' },
      // Activities
      { id: 'sports', title: 'Sports', iconName: 'basketball', bgColor: '#FFEDD5', accentColor: '#EA580C', borderColor: '#FED7AA' },
      { id: 'music', title: 'Music', iconName: 'musical-notes', bgColor: '#FFE4E6', accentColor: '#DB2777', borderColor: '#FECDD3' },
      { id: 'hiking', title: 'Hiking', iconName: 'trail-sign', bgColor: '#ECFDF5', accentColor: '#059669', borderColor: '#D1FAE5' },
      { id: 'arts', title: 'Arts & Crafts', iconName: 'color-palette', bgColor: '#FDF2F8', accentColor: '#DB2777', borderColor: '#FCE7F3' },
      { id: 'book-club', title: 'Book Club', iconName: 'book', bgColor: '#EFF6FF', accentColor: '#3B82F6', borderColor: '#DBEAFE' },
      { id: 'service', title: 'Service Projects', iconName: 'heart', bgColor: '#FECDD3', accentColor: '#E11D48', borderColor: '#FFE4E6' },
      // Professions
      { id: 'healthcare', title: 'Healthcare', iconName: 'medical', bgColor: '#DBEAFE', accentColor: '#2563EB', borderColor: '#BFDBFE' },
      { id: 'teachers', title: 'Teachers', iconName: 'school', bgColor: '#FEF3C7', accentColor: '#D97706', borderColor: '#FDE68A' },
      { id: 'business', title: 'Business', iconName: 'briefcase', bgColor: '#EFF6FF', accentColor: '#2563EB', borderColor: '#DBEAFE' },
      { id: 'tech', title: 'Tech', iconName: 'hardware-chip', bgColor: '#E0E7FF', accentColor: '#4F46E5', borderColor: '#C7D2FE' },
      { id: 'creatives', title: 'Creatives', iconName: 'color-palette', bgColor: '#FDF2F8', accentColor: '#DB2777', borderColor: '#FCE7F3' },
      { id: 'blue-collar', title: 'Blue Collar', iconName: 'construct', bgColor: '#FFEDD5', accentColor: '#EA580C', borderColor: '#FED7AA' },
      // Life Stages
      { id: 'young-professionals', title: 'Young Professionals', iconName: 'briefcase', bgColor: '#E0F2FE', accentColor: '#0284C7', borderColor: '#BAE6FD' },
      { id: 'singles', title: 'Singles', iconName: 'person', bgColor: '#F5F3FF', accentColor: '#7C3AED', borderColor: '#EDE9FE' },
      { id: 'married', title: 'Married', iconName: 'heart', bgColor: '#FFE4E6', accentColor: '#E11D48', borderColor: '#FECDD3' },
      { id: 'parents', title: 'Parents', iconName: 'heart-circle', bgColor: '#FECDD3', accentColor: '#BE123C', borderColor: '#FFE4E6' },
      { id: 'seniors', title: 'Seniors', iconName: 'people', bgColor: '#ECFDF5', accentColor: '#059669', borderColor: '#D1FAE5' },
      // Recovery
      { id: 'recovery', title: 'Recovery', iconName: 'medical', bgColor: '#DBEAFE', accentColor: '#2563EB', borderColor: '#BFDBFE' },
      { id: 'grief-support', title: 'Grief Support', iconName: 'heart', bgColor: '#E0E7FF', accentColor: '#4F46E5', borderColor: '#C7D2FE' },
    ];

    // Rotate through categories: show 4 different ones each week
    const startIndex = (weekOfYear * 4) % allCategories.length;
    const featured: Category[] = [];

    for (let i = 0; i < 4; i++) {
      const index = (startIndex + i) % allCategories.length;
      const cat = allCategories[index];
      featured.push({
        ...cat,
        count: Math.floor(Math.random() * 30 + 5).toString(), // Random count between 5-35
      });
    }

    return featured;
  };

  const categories = getFeaturedCategories();

  // Communities are now fetched from the API via useEffect above

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={colors.background === '#F9FAFB' ? 'dark-content' : 'light-content'}
      />

      <ScrollView
        style={{ flex: 1 }}
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
        />

        {/* Your Communities Section */}
        {userChannels.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
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
                <Ionicons name="people" size={14} color={colors.mutedForeground} />
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>Your Communities</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              <AddChannelCard onPress={onCreatePress} />
              {userChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onPress={() => onCommunityPress?.(channel.communityId)}
                />
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
              backgroundColor: colors.muted,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              height: 44,
              gap: spacing.sm,
            }}
          >
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.foreground,
              }}
              placeholder="Search communities..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Button */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <Pressable
            onPress={() => setShowFilterModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: colors.primary,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radii.full,
            }}
          >
            <Ionicons name="options" size={20} color={colors.primaryForeground} />
            <Text
              variant="bodySmall"
              style={{ color: colors.primaryForeground, fontWeight: '600' }}
            >
              Filters
              {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
            </Text>
          </Pressable>
        </View>

        {/* Categories Section */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              marginBottom: spacing.sm,
            }}
          >
            <Ionicons name="sparkles" size={18} color="#F59E0B" />
            <Text variant="bodySmall" style={{ fontWeight: '700' }}>
              Featured Categories
            </Text>
          </View>

          {/* 2x2 Grid */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CategoryCard category={categories[0]} />
              <CategoryCard category={categories[1]} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <CategoryCard category={categories[2]} />
              <CategoryCard category={categories[3]} />
            </View>
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

          {/* Loading State */}
          {isLoading && (
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: spacing.sm, color: colors.mutedForeground }}>
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
              {communities.length === 0 ? (
                <View style={{ alignItems: 'center', padding: spacing.xl }}>
                  <Ionicons name="search" size={48} color={colors.mutedForeground} />
                  <Text style={{ marginTop: spacing.sm, color: colors.mutedForeground }}>
                    No communities found
                  </Text>
                  <Text style={{ marginTop: spacing.xs, color: colors.mutedForeground, fontSize: 12 }}>
                    Try adjusting your filters
                  </Text>
                </View>
              ) : (
                communities.map((community) => (
                  <CommunityRow
                    key={community.id}
                    community={{
                      id: community.id,
                      title: community.name,
                      subtitle: community.description,
                      members: community.memberCount?.toString() || '0',
                      iconName: (community.iconName || 'people') as any,
                      tag: community.isPrivate ? 'Private' : 'Public',
                      bgColor: '#E0E7FF',
                      iconColor: '#4F46E5',
                      isNew: false,
                      distance: community.distance,
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
