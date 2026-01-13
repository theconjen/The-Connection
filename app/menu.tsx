import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function MenuScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const menuItems = [
    { title: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
    { title: 'Direct Messages', icon: 'mail-outline', route: '/messages' },
    { title: 'Prayers', icon: 'heart-outline', route: '/(tabs)/prayers' },
    { title: 'Privacy Policy', icon: 'shield-outline', route: '/settings/privacy' },
    { title: 'Community Guidelines', icon: 'book-outline', route: '/settings/guidelines' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Menu</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              router.push(item.route as any);
            }}
          >
            <Ionicons name={item.icon as any} size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  menuList: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
});
