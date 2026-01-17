/**
 * FAITH BACKGROUND SCREEN - The Connection Onboarding
 * Step 3: Denomination, interests, and spiritual background
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const DENOMINATIONS = [
  'Baptist',
  'Methodist',
  'Presbyterian',
  'Lutheran',
  'Anglican/Episcopal',
  'Pentecostal',
  'Assemblies of God',
  'Church of God',
  'Nazarene',
  'Non-Denominational',
  'Reformed',
  'Catholic',
  'Orthodox',
  'Seventh-day Adventist',
  'Other',
];

const INTERESTS = [
  'Bible Study',
  'Prayer',
  'Apologetics',
  'Theology',
  'Evangelism',
  'Missions',
  'Discipleship',
  'Worship',
  'Youth Ministry',
  'Men\'s Ministry',
  'Women\'s Ministry',
  'Marriage & Family',
  'Small Groups',
  'Volunteering',
  'Christian Education',
  'Spiritual Formation',
];

export default function FaithBackgroundScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [denomination, setDenomination] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [homeChurch, setHomeChurch] = useState('');
  const [favoriteBibleVerse, setFavoriteBibleVerse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Limit Reached', 'You can select up to 5 interests');
      }
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Save to secure storage
      await SecureStore.setItemAsync('onboarding_faith', JSON.stringify({
        denomination,
        interests: selectedInterests,
        homeChurch: homeChurch.trim(),
        favoriteBibleVerse: favoriteBibleVerse.trim(),
      }));

      router.push('/(onboarding)/community-discovery');
    } catch (error) {
      console.error('Error saving faith data:', error);
      Alert.alert('Error', 'Failed to save data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Faith Background
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '66%' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step 2 of 3
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Denomination */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Denomination (Optional)
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Help us connect you with like-minded believers
          </Text>
          <View style={styles.chipContainer}>
            {DENOMINATIONS.map((denom) => (
              <Pressable
                key={denom}
                style={[
                  styles.chip,
                  {
                    backgroundColor: denomination === denom
                      ? colors.primary
                      : isDark ? '#1a2a4a' : '#f0f4f8',
                    borderColor: denomination === denom ? colors.primary : colors.borderSubtle,
                  }
                ]}
                onPress={() => setDenomination(denom)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: denomination === denom ? '#fff' : colors.textPrimary }
                  ]}
                >
                  {denom}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Interests (Optional)
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Select up to 5 areas you're passionate about
          </Text>
          <View style={styles.chipContainer}>
            {INTERESTS.map((interest) => (
              <Pressable
                key={interest}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selectedInterests.includes(interest)
                      ? colors.primary
                      : isDark ? '#1a2a4a' : '#f0f4f8',
                    borderColor: selectedInterests.includes(interest) ? colors.primary : colors.borderSubtle,
                  }
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: selectedInterests.includes(interest) ? '#fff' : colors.textPrimary }
                  ]}
                >
                  {interest}
                </Text>
                {selectedInterests.includes(interest) && (
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </Pressable>
            ))}
          </View>
          <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
            {selectedInterests.length}/5 selected
          </Text>
        </View>

        {/* Home Church */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Home Church (Optional)
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              color: colors.textPrimary,
              borderColor: colors.border
            }]}
            value={homeChurch}
            onChangeText={setHomeChurch}
            placeholder="e.g., First Baptist Church"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            maxLength={100}
          />
        </View>

        {/* Favorite Bible Verse */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            Favorite Bible Verse (Optional)
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#1a2a4a' : '#f0f4f8',
              color: colors.textPrimary,
              borderColor: colors.border
            }]}
            value={favoriteBibleVerse}
            onChangeText={setFavoriteBibleVerse}
            placeholder="e.g., John 3:16"
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
        </View>

        {/* Encouragement Box */}
        <View style={[styles.encouragementBox, {
          backgroundColor: isDark ? '#1a2a4a' : '#f0f9ff',
          borderColor: colors.primary
        }]}>
          <Ionicons name="heart" size={20} color={colors.primary} />
          <Text style={[styles.encouragementText, { color: colors.textPrimary }]}>
            "Iron sharpens iron, and one man sharpens another." - Proverbs 27:17
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderSubtle }]}>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)/feed')}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 16,
    paddingTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  encouragementBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
