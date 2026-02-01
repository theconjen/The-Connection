/**
 * TEMPORARY TEST SCREEN - Delete after testing
 * Navigate to /test-badge to see the clergy badge preview
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClergyBadge } from '../src/components/ClergyBadge';

export default function TestBadgeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Clergy Badge Preview</Text>

        {/* Size variations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge Sizes</Text>
          <View style={styles.row}>
            <View style={styles.item}>
              <ClergyBadge size="small" />
              <Text style={styles.label}>Small</Text>
            </View>
            <View style={styles.item}>
              <ClergyBadge size="medium" />
              <Text style={styles.label}>Medium</Text>
            </View>
            <View style={styles.item}>
              <ClergyBadge size="large" />
              <Text style={styles.label}>Large</Text>
            </View>
          </View>
        </View>

        {/* In context examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In Context</Text>

          {/* Example 1: Name with badge */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>Name + Badge</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Pastor John Smith</Text>
              <ClergyBadge size="small" style={{ marginLeft: 6 }} />
            </View>
          </View>

          {/* Example 2: Post header style */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>Post Header Style</Text>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JS</Text>
              </View>
              <View style={styles.postInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>John Smith</Text>
                  <ClergyBadge size="small" style={{ marginLeft: 4 }} />
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.time}>2h ago</Text>
                </View>
                <Text style={styles.subtitle}>First Baptist Church</Text>
              </View>
            </View>
          </View>

          {/* Example 3: Highlighted response */}
          <View style={[styles.exampleCard, styles.highlightedCard]}>
            <Text style={styles.exampleLabel}>Clergy Response (Highlighted)</Text>
            <View style={styles.postHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>MR</Text>
              </View>
              <View style={styles.postInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>Minister Rebecca</Text>
                  <ClergyBadge size="small" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.clergyLabel}>Verified Clergy</Text>
                <Text style={styles.responseText}>
                  This is what a highlighted clergy response would look like in the advice section...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Color reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color Reference</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: '#D97706' }]} />
            <Text style={styles.colorLabel}>Icon: #D97706 (Amber)</Text>
          </View>
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: '#FEF3C7' }]} />
            <Text style={styles.colorLabel}>Background: #FEF3C7</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  item: {
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#888',
  },
  exampleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  highlightedCard: {
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  exampleLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dot: {
    fontSize: 12,
    color: '#888',
    marginHorizontal: 6,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  postHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222D99',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  postInfo: {
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  clergyLabel: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    lineHeight: 20,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorLabel: {
    fontSize: 14,
    color: '#666',
  },
});
