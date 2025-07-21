import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';

interface QAItem {
  id: number;
  question: string;
  answer: string;
  answerer: string;
  isVerified: boolean;
  category: string;
  votes: number;
}

interface AskQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (question: string, category: string) => void;
}

const QACard: React.FC<{ qa: QAItem }> = ({ qa }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = () => {
    if (hasVoted) {
      Alert.alert('Already Voted', 'You have already voted on this answer.');
      return;
    }
    setHasVoted(true);
    Alert.alert('Thank You', 'Your vote has been recorded.');
  };

  return (
    <View style={styles.qaCard}>
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>{qa.category}</Text>
      </View>
      
      <Text style={styles.question}>{qa.question}</Text>
      
      <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.expandText}>
          {isExpanded ? 'Show Less' : 'Read Answer'}
        </Text>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.answerSection}>
          <Text style={styles.answer}>{qa.answer}</Text>
          
          <View style={styles.answererSection}>
            <View style={styles.answererInfo}>
              <Text style={styles.answererName}>{qa.answerer}</Text>
              {qa.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
            
            <View style={styles.voteSection}>
              <TouchableOpacity 
                style={[styles.voteButton, hasVoted && styles.votedButton]} 
                onPress={handleVote}
              >
                <Text style={[styles.voteButtonText, hasVoted && styles.votedButtonText]}>
                  👍 {qa.votes + (hasVoted ? 1 : 0)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const AskQuestionModal: React.FC<AskQuestionModalProps> = ({ visible, onClose, onSubmit }) => {
  const [question, setQuestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Faith & Theology');
  
  const categories = [
    'Faith & Theology',
    'Bible Study',
    'Christian Living',
    'Church History',
    'Science & Faith',
    'Philosophy',
    'Other'
  ];

  const handleSubmit = () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }
    
    onSubmit(question.trim(), selectedCategory);
    setQuestion('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ask a Question</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.modalSubmitButton}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Question</Text>
            <TextInput
              style={styles.questionInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="What would you like to know about faith, theology, or Christian living?"
              multiline
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categorySelector}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category && styles.selectedCategoryOption
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      selectedCategory === category && styles.selectedCategoryOptionText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>How it works:</Text>
            <Text style={styles.disclaimerText}>
              • Your question will be reviewed by verified Christian scholars
              {'\n'}• Answers are provided by qualified theologians and pastors
              {'\n'}• You'll be notified when your question is answered
              {'\n'}• All questions and answers are moderated for quality
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export const ApologeticsScreen: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAskModal, setShowAskModal] = useState(false);
  
  const filters = ['All', 'Faith & Theology', 'Bible Study', 'Christian Living', 'Science & Faith'];
  
  const qaItems: QAItem[] = [
    {
      id: 1,
      question: "How do we reconcile the existence of suffering with a loving God?",
      answer: "This is one of the most profound questions in Christian theology, often called the 'problem of evil.' The Bible doesn't give us a simple answer, but it does provide important insights. First, we see that God entered into our suffering through Christ, showing that He doesn't stand apart from our pain but joins us in it. Second, Scripture teaches that suffering often serves purposes we can't fully understand - developing character, deepening faith, and drawing us closer to God. The book of Job shows us that sometimes we must trust God's goodness even when we can't understand His ways. Finally, Christianity promises that this is not the end of the story - God will ultimately make all things right and wipe away every tear.",
      answerer: "Dr. Michael Chen",
      isVerified: true,
      category: "Faith & Theology",
      votes: 42
    },
    {
      id: 2,
      question: "Is there scientific evidence that supports the Bible?",
      answer: "While the Bible is primarily a spiritual text rather than a scientific textbook, there are many points where biblical accounts align with archaeological and scientific discoveries. Archaeological evidence has confirmed many biblical locations, peoples, and events. The Big Bang theory aligns remarkably with the biblical account of creation having a beginning. The fine-tuning of the universe's constants suggests intentional design. However, faith ultimately goes beyond what science can prove or disprove - it involves trusting in God based on the evidence we have, both natural and revealed.",
      answerer: "Dr. Sarah Rodriguez",
      isVerified: true,
      category: "Science & Faith",
      votes: 38
    },
    {
      id: 3,
      question: "How can I be sure of my salvation?",
      answer: "Assurance of salvation is a precious gift that God wants every believer to have. According to Scripture, salvation comes through faith in Jesus Christ alone (Ephesians 2:8-9). First John was written specifically to give believers assurance (1 John 5:13). The signs of true faith include: loving God and others, obeying God's commands, believing in Jesus as the Son of God, and experiencing the Holy Spirit's witness in our hearts. Remember, our assurance isn't based on our perfect performance but on Christ's finished work and God's unchanging promises.",
      answerer: "Pastor David Williams",
      isVerified: true,
      category: "Christian Living",
      votes: 56
    }
  ];

  const filteredQA = activeFilter === 'All' 
    ? qaItems 
    : qaItems.filter(qa => qa.category === activeFilter);

  const handleAskQuestion = (question: string, category: string) => {
    Alert.alert(
      'Question Submitted',
      'Thank you for your question! Our verified scholars will review it and provide an answer soon. You\'ll be notified when it\'s ready.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apologetics Center</Text>
        <Text style={styles.subtitle}>Ask questions, find answers</Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.askButton}
          onPress={() => setShowAskModal(true)}
        >
          <Text style={styles.askButtonText}>Ask a Question</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === filter && styles.activeFilterButtonText
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.qaList} showsVerticalScrollIndicator={false}>
        {filteredQA.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Questions Yet</Text>
            <Text style={styles.emptyDescription}>
              Be the first to ask a question in this category.
            </Text>
          </View>
        ) : (
          filteredQA.map((qa) => (
            <QACard key={qa.id} qa={qa} />
          ))
        )}
      </ScrollView>

      <AskQuestionModal
        visible={showAskModal}
        onClose={() => setShowAskModal(false)}
        onSubmit={handleAskQuestion}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  askButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  qaList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  qaCard: {
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
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    lineHeight: 24,
    marginBottom: 12,
  },
  expandText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  answerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answer: {
    fontSize: 15,
    color: '#1A1D29',
    lineHeight: 24,
    marginBottom: 16,
  },
  answererSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answererInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  answererName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D29',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  votedButton: {
    backgroundColor: '#EEF2FF',
  },
  voteButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  votedButtonText: {
    color: '#6366F1',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1D29',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
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
    color: '#F59E0B',
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
  questionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1D29',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 120,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryOption: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  selectedCategoryOptionText: {
    color: '#FFFFFF',
  },
  disclaimerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D29',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
});