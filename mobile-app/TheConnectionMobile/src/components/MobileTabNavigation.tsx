import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface TabItem {
  key: string;
  title: string;
  icon: string;
  component: React.ComponentType;
}

interface MobileTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const MobileTabNavigation: React.FC<MobileTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabKey: string) => {
    if (tabKey !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTabChange(tabKey);
    }
  };

  const tabWidth = screenWidth / tabs.length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabContent, isActive && styles.activeTabContent]}>
                <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabTitle, isActive && styles.activeTabTitle]}>
                  {tab.title}
                </Text>
              </View>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 44,
    minWidth: 44,
  },
  activeTabContent: {
    backgroundColor: '#E91E63',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    backgroundColor: '#E91E63',
    borderRadius: 2,
  },
});

export default MobileTabNavigation;