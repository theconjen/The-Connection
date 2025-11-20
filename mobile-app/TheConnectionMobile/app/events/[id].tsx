/**
 * Event Detail Screen with Map Integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { eventsAPI } from '../../src/lib/apiClient';

interface Event {
  id: number;
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  endTime?: string;
  attendeeCount?: number;
  rsvpStatus?: string;
  createdBy: number;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const eventId = parseInt(id || '0');
  const [showMap, setShowMap] = useState(true);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const response = await eventsAPI.getAll();
      return response.find((e: Event) => e.id === eventId);
    },
    enabled: !!eventId,
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: string) => eventsAPI.rsvp(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Success', 'RSVP updated!');
    },
    onError: () => Alert.alert('Error', 'Failed to update RSVP'),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleRSVP = () => {
    const newStatus = event?.rsvpStatus === 'going' ? 'not_going' : 'going';
    rsvpMutation.mutate(newStatus);
  };

  const openInMaps = () => {
    if (!event?.location) return;

    const query = encodeURIComponent(event.location);
    const url = event.latitude && event.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open maps')
    );
  };

  // Default coordinates (can be replaced with actual location parsing)
  const getCoordinates = () => {
    if (event?.latitude && event?.longitude) {
      return { latitude: event.latitude, longitude: event.longitude };
    }
    // Default to a general location if coordinates not available
    return { latitude: 37.7749, longitude: -122.4194 }; // San Francisco as default
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dateSection}>
          <View style={styles.dateBox}>
            <Text style={styles.dateMonth}>
              {new Date(event.startTime).toLocaleString('en-US', { month: 'short' })}
            </Text>
            <Text style={styles.dateDay}>
              {new Date(event.startTime).getDate()}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDate(event.startTime)}</Text>
            {event.endTime && (
              <Text style={styles.endTimeText}>
                Until {new Date(event.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.title}>{event.title}</Text>
          
          {event.location && (
            <View>
              <View style={styles.locationSection}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{event.location}</Text>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={openInMaps}
                >
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>

              {/* Map View */}
              {showMap && (event.latitude && event.longitude) && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      ...getCoordinates(),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    provider={PROVIDER_GOOGLE}
                  >
                    <Marker
                      coordinate={getCoordinates()}
                      title={event.title}
                      description={event.location}
                    />
                  </MapView>
                  <TouchableOpacity
                    style={styles.mapToggle}
                    onPress={() => setShowMap(!showMap)}
                  >
                    <Text style={styles.mapToggleText}>Hide Map</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!showMap && (event.latitude && event.longitude) && (
                <TouchableOpacity
                  style={styles.showMapButton}
                  onPress={() => setShowMap(true)}
                >
                  <Text style={styles.showMapText}>🗺️ Show Map</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.attendeeSection}>
            <Text style={styles.attendeeIcon}>👥</Text>
            <Text style={styles.attendeeText}>
              {event.attendeeCount || 0} {event.attendeeCount === 1 ? 'person' : 'people'} attending
            </Text>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.rsvpButton,
            event.rsvpStatus === 'going' && styles.rsvpButtonGoing,
          ]}
          onPress={handleRSVP}
          disabled={rsvpMutation.isPending}
        >
          {rsvpMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.rsvpButtonText}>
              {event.rsvpStatus === 'going' ? '✓ Going' : 'RSVP'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backIcon: { fontSize: 24, color: '#8b5cf6' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { flex: 1 },
  dateSection: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  dateBox: { width: 70, height: 70, backgroundColor: '#8b5cf6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  dateMonth: { color: '#fff', fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  dateDay: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  dateInfo: { flex: 1, justifyContent: 'center' },
  dateText: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  endTimeText: { fontSize: 14, color: '#6b7280' },
  detailSection: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
  locationSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  locationIcon: { fontSize: 20, marginRight: 12 },
  locationText: { flex: 1, fontSize: 15, color: '#1f2937' },
  directionsButton: { backgroundColor: '#8b5cf6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  directionsText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapContainer: { marginTop: 12, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  map: { width: '100%', height: 200 },
  mapToggle: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  mapToggleText: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
  showMapButton: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  showMapText: { fontSize: 14, fontWeight: '600', color: '#8b5cf6' },
  attendeeSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  attendeeIcon: { fontSize: 20, marginRight: 12 },
  attendeeText: { fontSize: 15, color: '#1f2937', fontWeight: '600' },
  descriptionSection: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  description: { fontSize: 15, color: '#374151', lineHeight: 24 },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  rsvpButton: { backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, alignItems: 'center' },
  rsvpButtonGoing: { backgroundColor: '#10b981' },
  rsvpButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 16, textAlign: 'center' },
  backButton: { backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
