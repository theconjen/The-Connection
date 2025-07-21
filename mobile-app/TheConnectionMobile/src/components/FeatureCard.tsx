import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  screenName: string;
  color: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  screenName,
  color,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate(screenName as never);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          {icon}
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  colorBar: {
    height: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});