import React, { useState } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const { width: screenWidth } = Dimensions.get('window');

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  resizeMode = 'cover'
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[styles.loadingContainer, style]}>
          <ActivityIndicator color="#E91E63" />
        </View>
      )}
      <Image
        source={source}
        style={[style, loading && styles.hidden]}
        resizeMode={resizeMode}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  hidden: {
    opacity: 0,
  },
  placeholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImage;