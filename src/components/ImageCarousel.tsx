/**
 * ImageCarousel - Instagram/TikTok-style swipeable image carousel
 * Features:
 * - Horizontal swipe to navigate between images
 * - Pagination dots indicator
 * - Tap to view full screen (optional)
 * - Supports any number of images
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  height?: number;
  onImagePress?: (index: number) => void;
  borderRadius?: number;
  containerPadding?: number;
}

export function ImageCarousel({
  images,
  height = 300,
  onImagePress,
  borderRadius = 12,
  containerPadding = 0,
}: ImageCarouselProps) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const imageWidth = SCREEN_WIDTH - containerPadding * 2;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / imageWidth);
    if (index !== activeIndex && index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => (
    <Pressable
      onPress={() => onImagePress?.(index)}
      style={[styles.imageContainer, { width: imageWidth }]}
    >
      <Image
        source={{ uri: item }}
        style={[
          styles.image,
          {
            width: imageWidth,
            height,
            borderRadius,
          },
        ]}
        resizeMode="cover"
      />
    </Pressable>
  );

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <Pressable onPress={() => onImagePress?.(0)}>
        <Image
          source={{ uri: images[0] }}
          style={[
            styles.image,
            {
              width: '100%',
              height,
              borderRadius,
            },
          ]}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderImage}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={imageWidth}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: imageWidth,
          offset: imageWidth * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex
                  ? '#fff'
                  : 'rgba(255, 255, 255, 0.4)',
                width: index === activeIndex ? 8 : 6,
                height: index === activeIndex ? 8 : 6,
              },
            ]}
          />
        ))}
      </View>

      {/* Image Counter Badge */}
      <View style={styles.counterBadge}>
        <Ionicons name="images-outline" size={14} color="#fff" />
        <Text style={styles.counterText}>{activeIndex + 1}/{images.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  imageContainer: {
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#1a1a1a',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
