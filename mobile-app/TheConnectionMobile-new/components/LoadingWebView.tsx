import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useMemo, useState } from 'react';

interface LoadingWebViewProps {
  uri: string;
}

export default function LoadingWebView({ uri }: LoadingWebViewProps) {
  const [loading, setLoading] = useState(true);

  const mobileUserAgent = useMemo(
    () =>
      Platform.select({
        ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        default: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      }) ?? '',
    []
  );

  // Keep content locked to the device viewport for a native feel.
  const injectedJavaScript = `
    (function() {
      var head = document.head || document.getElementsByTagName('head')[0];
      if (!head) { return true; }

      var existing = document.querySelector('meta[name="viewport"]');
      var content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        var meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = content;
        head.appendChild(meta);
      }

      document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('width', '100vw', 'important');
      document.body.style.setProperty('max-width', '100vw', 'important');
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
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
        originWhitelist={['https://*']}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        contentInsetAdjustmentBehavior="automatic"
        pullToRefreshEnabled={Platform.OS === 'android'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        setSupportMultipleWindows={false}
      />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
