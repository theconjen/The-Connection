import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';

interface LoadingWebViewProps {
  uri: string;
}

export default function LoadingWebView({ uri }: LoadingWebViewProps) {
  const [loading, setLoading] = useState(true);

  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  return (
    <View style={styles.container}>
      <WebView 
        source={{ 
          uri,
          headers: {
            'User-Agent': mobileUserAgent
          }
        }}
        style={styles.webview}
        applicationNameForUserAgent={mobileUserAgent}
        userAgent={mobileUserAgent}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
