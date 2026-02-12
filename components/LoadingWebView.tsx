import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

interface LoadingWebViewProps {
  uri: string;
}

export default function LoadingWebView({ uri }: LoadingWebViewProps) {
  const openBrowser = async () => {
    try {
      // Add nativeApp parameter to the URL
      const url = new URL(uri);
      url.searchParams.set('nativeApp', '1');
      
      await WebBrowser.openBrowserAsync(url.toString(), {
        dismissButtonStyle: 'close',
        toolbarColor: '#4F46E5',
        controlsColor: '#ffffff',
        showTitle: true,
      });
    } catch (error) {
      console.error('Error opening browser:', error);
    }
  };

  useEffect(() => {
    // Automatically open the browser when component mounts
    openBrowser();
  }, [uri]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Ionicons name="globe-outline" size={64} color="#4F46E5" style={styles.icon} />
        <Text style={styles.title}>Opening in Browser</Text>
        <Text style={styles.description}>
          This content will open in your system browser for the best experience.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openBrowser}>
          <Text style={styles.buttonText}>Open Again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
