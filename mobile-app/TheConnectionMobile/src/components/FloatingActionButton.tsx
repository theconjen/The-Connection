import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Animated,
} from 'react-native';

interface FABOption {
  id: string;
  label: string;
  color: string;
  onPress: () => void;
}

interface FloatingActionButtonProps {
  options: FABOption[];
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ options }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    if (isExpanded) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsExpanded(false));
    } else {
      setIsExpanded(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleOptionPress = (option: FABOption) => {
    toggleExpanded();
    option.onPress();
  };

  return (
    <>
      <Modal
        visible={isExpanded}
        transparent
        animationType="none"
        onRequestClose={toggleExpanded}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={toggleExpanded}
        >
          <SafeAreaView style={styles.modalContainer}>
            <Animated.View style={[styles.optionsContainer, { opacity: fadeAnim }]}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, { backgroundColor: option.color }]}
                  onPress={() => handleOptionPress(option)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity style={styles.fab} onPress={toggleExpanded}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E73AA4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  optionsContainer: {
    paddingRight: 20,
    paddingBottom: 170,
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});