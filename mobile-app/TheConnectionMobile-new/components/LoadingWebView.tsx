import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';

interface LoadingWebViewProps {
  uri: string;
}

export default function LoadingWebView({ uri }: LoadingWebViewProps) {
  const [loading, setLoading] = useState(true);

  const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

  // JavaScript to force mobile viewport
  const injectedJavaScript = `
    (function() {
      // Set viewport meta tag
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      // Force mobile width
      document.body.style.width = '100vw';
      document.body.style.maxWidth = '100vw';
      document.body.style.overflowX = 'hidden';
    })();
    true;
  `;

  return (
    <View style={styles.container}>
      <WebView 
        source={{ 
          uri,
          headers: {
            'User-Agent': mobileUserAgent,
          }
        }}
        style={styles.webview}
        userAgent={mobileUserAgent}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        startInLoadingState={true}
        scalesPageToFit={true}
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
