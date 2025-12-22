/**
 * ForumsScreen - Native React Native screen
 * Main forums/feed screen with community cards and post feed
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text, Screen, useTheme } from '../theme';
import { PostCard, Post } from './PostCard';
import { ChannelCard, AddChannelCard, Channel } from './ChannelCard';

// Icons
const SearchIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>🔍</Text>
);
const UsersIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 14, color }}>👥</Text>
);

// Sample data
const channels: Channel[] = [
  { id: 1, name: 'c/faith', members: '45.2k', icon: 'F', isJoined: true },
  { id: 2, name: 'c/prayer', members: '38.7k', icon: 'P', isJoined: true },
  { id: 3, name: 'c/biblestudy', members: '29.1k', icon: 'B', isJoined: false },
  { id: 4, name: 'c/encouragement', members: '52.3k', icon: 'E', isJoined: true },
  { id: 5, name: 'c/testimony', members: '21.8k', icon: 'T', isJoined: false },
];

const posts: Post[] = [
  {
    id: 1,
    channel: 'c/faith',
    channelIcon: 'F',
    author: 'sarahjohnson',
    timeAgo: '12h ago',
    title: 'The Future of Web Development: Trends to Watch in 2025',
    content:
      'As we step into 2025, the landscape of web development continues to evolve at an unprecedented pace. New frameworks, tools, and methodologies are reshaping how we build for the web.',
    votes: 1247,
    comments: 324,
    flair: 'Discussion',
  },
  {
    id: 2,
    channel: 'c/prayer',
    channelIcon: 'P',
    author: 'faithfulheart',
    timeAgo: '8h ago',
    title: 'Prayer Request: Starting a New Chapter',
    content:
      "Friends, I'm beginning a new job next week after months of searching. Would appreciate your prayers for wisdom, favor, and peace as I transition into this new season.",
    votes: 892,
    comments: 156,
    flair: 'Prayer Request',
  },
  {
    id: 3,
    channel: 'c/encouragement',
    channelIcon: 'E',
    author: 'joyfulspirit',
    timeAgo: '5h ago',
    title: 'Remember: You Are Loved Beyond Measure',
    content:
      "In moments of doubt or difficulty, never forget that you are deeply loved and valued. Your worth isn't determined by your circumstances, but by who you are.",
    votes: 2156,
    comments: 89,
    flair: 'Encouragement',
  },
  {
    id: 4,
    channel: 'c/biblestudy',
    channelIcon: 'B',
    author: 'wordseeker',
    timeAgo: '3h ago',
    title: 'Deep Dive into Philippians 4:6-7 - Finding Peace',
    content:
      "Let's explore this powerful passage about anxiety and peace. What insights have you gained from these verses? How do they apply to modern challenges we face?",
    votes: 634,
    comments: 203,
    flair: 'Study',
  },
  {
    id: 5,
    channel: 'c/testimony',
    channelIcon: 'T',
    author: 'graceabounds',
    timeAgo: '1h ago',
    title: 'How Faith Helped Me Overcome Addiction',
    content:
      "Three years ago, I was in the darkest place of my life. Today, I'm celebrating 3 years of freedom. Here's my story of hope and redemption.",
    votes: 3421,
    comments: 412,
    flair: 'Testimony',
  },
];

interface ForumsScreenProps {
  onPostPress?: (post: Post) => void;
  onChannelPress?: (channel: Channel) => void;
  onSearchPress?: () => void;
  onDiscoverPress?: () => void;
}

export function ForumsScreen({
  onPostPress,
  onChannelPress,
  onSearchPress,
  onDiscoverPress,
}: ForumsScreenProps) {
  const { colors, spacing, radii } = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'popular'>('home');

  const renderHeader = () => (
    <>
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <Text variant="title">Forums</Text>
          <Pressable
            onPress={onSearchPress}
            style={({ pressed }) => ({
              padding: spacing.sm,
              borderRadius: radii.full,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <SearchIcon color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => setActiveTab('home')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: activeTab === 'home' ? colors.accent : colors.mutedForeground,
                fontWeight: activeTab === 'home' ? '600' : '400',
              }}
            >
              Home
            </Text>
            {activeTab === 'home' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('popular')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Text
              variant="bodySmall"
              style={{
                color: activeTab === 'popular' ? colors.accent : colors.mutedForeground,
                fontWeight: activeTab === 'popular' ? '600' : '400',
              }}
            >
              Popular
            </Text>
            {activeTab === 'popular' && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: colors.accent,
                }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Communities Section */}
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
            <UsersIcon color={colors.mutedForeground} />
            <Text variant="bodySmall">Your Communities</Text>
          </View>
          <Pressable>
            <Text variant="caption" style={{ color: colors.accent }}>
              See all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <AddChannelCard onPress={onDiscoverPress} />
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onToggleJoin={(joined) => console.log(`${channel.name}: ${joined}`)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Spacer before posts */}
      <View style={{ height: spacing.sm }} />
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={colors.background === '#F5F8FA' ? 'dark-content' : 'light-content'}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <PostCard post={item} onPress={() => onPostPress?.(item)} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      />
    </SafeAreaView>
  );
}
