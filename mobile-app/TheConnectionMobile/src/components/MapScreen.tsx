import React from 'react';
import { Platform, StyleSheet, View, ViewStyle, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { colors, spacing, radii, shadows } from '../theme/tokens';

export type MapMarker = {
  id: string | number;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
};

export interface MapScreenProps {
  initialRegion: Region;
  markers?: MapMarker[];
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  showsUserLocation?: boolean;
  provider?: typeof PROVIDER_GOOGLE | undefined;
  style?: ViewStyle;
  fallbackUrl?: string;
}

const mapFallbackHtml = (url?: string) => `
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1, maximum-scale=1">
      <style>body,html,#root{margin:0;padding:0;height:100%;} iframe{border:0;width:100%;height:100%;}</style>
    </head>
    <body>
      <div id="root">
        <iframe src="${url || 'https://www.openstreetmap.org'}" allowfullscreen></iframe>
      </div>
    </body>
  </html>
`;

export function MapScreen({
  initialRegion,
  markers = [],
  onMarkerPress,
  onRegionChange,
  onRegionChangeComplete,
  showsUserLocation = false,
  provider = PROVIDER_GOOGLE,
  style,
  fallbackUrl,
  }: MapScreenProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webContainer, style]}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapFallbackHtml(fallbackUrl) }}
          style={styles.webView}
        />
        <Text style={styles.webHint}>Interactive maps use a lightweight web view on this platform.</Text>
      </View>
    );
  }

  return (
    <MapView
      provider={provider}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      showsUserLocation={showsUserLocation}
      onRegionChange={onRegionChange}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  webContainer: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  webView: {
    flex: 1,
  },
  webHint: {
    padding: spacing.md,
    fontSize: 12,
    color: colors.light.textSecondary,
    textAlign: 'center',
  },
});

export default MapScreen;
