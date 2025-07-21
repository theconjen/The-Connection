import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { PrayerRequest } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const PrayerRequestCard: React.FC<{ prayerRequest: PrayerRequest }> = ({ prayerRequest }) => {
  const [hasPrayed, setHasPrayed] = useState(false);
  
  const handlePray = () => {
    if (hasPrayed) {
      Alert.alert('Already Praying', 'You have already committed to praying for this request. Keep them in your prayers!');
      return;
    }
    
    Alert.alert(
      'Commit to Prayer',
      'By selecting "I Will Pray", you are committing to pray for this request.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'I Will Pray', onPress: () => {
          setHasPrayed(true);
          Alert.alert('Thank You', 'Thank you for your commitment to prayer. May God bless your intercession.');
        }},
      ]
    );
  };

  return (
    <View style={styles.prayerCard}>
      <View style={styles.prayerHeader}>
        <Text style={styles.prayerTitle}>{prayerRequest.title}</Text>
        <View style={styles.prayerMeta}>
          <Text style={styles.prayerUser}>
            {prayerRequest.isAnonymous ? 'Anonymous' : prayerRequest.user.displayName}
          </Text>
          <Text style={styles.prayerCount}>🙏 {prayerRequest.prayersCount} prayers</Text>
        </View>
      </View>
      
      <Text style={styles.prayerContent}>{prayerRequest.content}</Text>
      
      <TouchableOpacity 
        style={[styles.prayButton, hasPrayed && styles.prayButtonPrayed]} 
        onPress={handlePray}
      >
        <Text style={[styles.prayButtonText, hasPrayed && styles.prayButtonTextPrayed]}>
          {hasPrayed ? 'Praying 🙏' : 'I Will Pray'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const CreatePrayerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, isAnonymous: boolean) => void;
}> = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }
    
    onSubmit(title.trim(), content.trim(), isAnonymous);
    setTitle('');
    setContent('');
    setIsAnonymous(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Prayer Request</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.modalSubmitButton}>Share</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of your prayer request"
              maxLength={100}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prayer Request</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Share your prayer request with the community..."
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          
          <View style={styles.anonymousContainer}>
            <View style={styles.anonymousInfo}>
              <Text style={styles.anonymousLabel}>Post Anonymously</Text>
              <Text style={styles.anonymousDescription}>
                Your name will not be shown with this request
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#D1D5DB', true: '#E73AA4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export const PrayerRequestsScreen: React.FC = () => {
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPrayerRequests();
  }, []);

  const fetchPrayerRequests = async () => {
    try {
      const data = await apiService.getPrayerRequests();
      setPrayerRequests(data);
    } catch (error) {
      console.error('Failed to fetch prayer requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePrayerRequest = async (title: string, content: string, isAnonymous: boolean) => {
    try {
      await apiService.createPrayerRequest(title, content, isAnonymous);
      Alert.alert('Success', 'Your prayer request has been shared with the community.');
      fetchPrayerRequests(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to share prayer request. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73AA4" />
        <Text style={styles.loadingText}>Loading prayer requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prayer Requests</Text>
        {user && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ New Request</Text>
          </TouchableOpacity>
        )}
      </View>

      {prayerRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Prayer Requests Yet</Text>
          <Text style={styles.emptyDescription}>
            Be the first to share a prayer request with the community.
          </Text>
          {user && (
            <TouchableOpacity
              style={styles.firstRequestButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.firstRequestButtonText}>Share First Request</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={prayerRequests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PrayerRequestCard prayerRequest={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreatePrayerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePrayerRequest}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
  },
  createButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  prayerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  prayerHeader: {
    marginBottom: 12,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  prayerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerUser: {
    fontSize: 14,
    color: '#64748B',
  },
  prayerCount: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  prayerContent: {
    fontSize: 16,
    color: '#1A1D29',
    lineHeight: 24,
    marginBottom: 16,
  },
  prayButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  prayButtonPrayed: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  prayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  prayButtonTextPrayed: {
    color: '#16A34A',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  firstRequestButton: {
    backgroundColor: '#E73AA4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  firstRequestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D29',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSubmitButton: {
    fontSize: 16,
    color: '#E73AA4',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1D29',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1D29',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 120,
  },
  anonymousContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  anonymousInfo: {
    flex: 1,
  },
  anonymousLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 4,
  },
  anonymousDescription: {
    fontSize: 14,
    color: '#64748B',
  },
});