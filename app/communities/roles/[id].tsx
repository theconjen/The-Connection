/**
 * Community Custom Roles Management Screen
 * Allows community owners to create, edit, and delete custom roles with permissions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../src/lib/apiClient';

interface Permission {
  key: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { key: 'manage_members', label: 'Manage Members', description: 'Add/remove members and approve join requests' },
  { key: 'manage_roles', label: 'Manage Roles', description: 'Create, edit, and assign custom roles' },
  { key: 'manage_rooms', label: 'Manage Rooms', description: 'Create and manage chat rooms' },
  { key: 'delete_posts', label: 'Delete Posts', description: 'Remove posts from the community feed' },
  { key: 'pin_posts', label: 'Pin Posts', description: 'Pin important posts to the top' },
  { key: 'manage_events', label: 'Manage Events', description: 'Create, edit, and delete community events' },
];

const COLOR_OPTIONS = [
  '#4A90E2', '#9B59B6', '#E67E22', '#E91E63',
  '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#8B5CF6', '#14B8A6', '#D97706', '#EC4899',
];

interface Role {
  id: number;
  name: string;
  color: string;
  permissions: string[];
  memberCount?: number;
}

export default function CommunityRolesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = parseInt(id || '0', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();
  const isDark = colorScheme === 'dark';

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState(COLOR_OPTIONS[0]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Fetch roles
  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['community-roles', communityId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/communities/${communityId}/roles`);
      return res.data;
    },
    enabled: !!communityId,
  });

  // Create role
  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; permissions: string[] }) => {
      const res = await apiClient.post(`/api/communities/${communityId}/roles`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-roles', communityId] });
      closeModal();
      Alert.alert('Success', 'Role created successfully.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to create role.');
    },
  });

  // Update role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, data }: { roleId: number; data: { name: string; color: string; permissions: string[] } }) => {
      const res = await apiClient.patch(`/api/communities/${communityId}/roles/${roleId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-roles', communityId] });
      closeModal();
      Alert.alert('Success', 'Role updated successfully.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to update role.');
    },
  });

  // Delete role
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      await apiClient.delete(`/api/communities/${communityId}/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-roles', communityId] });
      Alert.alert('Deleted', 'Role has been removed.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to delete role.');
    },
  });

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleColor(COLOR_OPTIONS[0]);
    setRolePermissions([]);
    setShowRoleModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleColor(role.color || COLOR_OPTIONS[0]);
    setRolePermissions(role.permissions || []);
    setShowRoleModal(true);
  };

  const closeModal = () => {
    setShowRoleModal(false);
    setEditingRole(null);
    setRoleName('');
    setRoleColor(COLOR_OPTIONS[0]);
    setRolePermissions([]);
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) {
      Alert.alert('Error', 'Please enter a role name.');
      return;
    }

    const data = {
      name: roleName.trim(),
      color: roleColor,
      permissions: rolePermissions,
    };

    if (editingRole) {
      updateRoleMutation.mutate({ roleId: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleDeleteRole = (role: Role) => {
    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete the "${role.name}" role? Members with this role will lose these permissions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRoleMutation.mutate(role.id) },
      ]
    );
  };

  const togglePermission = (key: string) => {
    setRolePermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const isSaving = createRoleMutation.isPending || updateRoleMutation.isPending;

  // Render role item
  const renderRoleItem = ({ item }: { item: Role }) => (
    <TouchableOpacity
      style={[styles.roleCard, {
        backgroundColor: colors.surface,
        borderColor: colors.borderSubtle,
      }]}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.roleColorDot, { backgroundColor: item.color || colors.primary }]} />
      <View style={styles.roleInfo}>
        <Text style={[styles.roleName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.roleDetails, { color: colors.textMuted }]}>
          {item.memberCount || 0} member{(item.memberCount || 0) !== 1 ? 's' : ''}
          {' \u00B7 '}
          {(item.permissions || []).length} permission{(item.permissions || []).length !== 1 ? 's' : ''}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteRole(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Roles</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Manage Roles</Text>
        <TouchableOpacity onPress={openCreateModal}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Roles List */}
      {(!roles || roles.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Custom Roles</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Create roles to organize your community members and manage permissions.
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Role</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRoleItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {/* Create/Edit Role Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingRole ? 'Edit Role' : 'Create Role'}
            </Text>
            <TouchableOpacity onPress={handleSaveRole} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            {/* Role Name */}
            <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Role Name</Text>
            <TextInput
              style={[styles.textInput, {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              }]}
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g., Worship Leader"
              placeholderTextColor={colors.textMuted}
              maxLength={50}
            />

            {/* Role Color */}
            <Text style={[styles.fieldLabel, { color: colors.textPrimary, marginTop: 20 }]}>Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    roleColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setRoleColor(color)}
                >
                  {roleColor === color && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Permissions */}
            <Text style={[styles.fieldLabel, { color: colors.textPrimary, marginTop: 20 }]}>Permissions</Text>
            {AVAILABLE_PERMISSIONS.map((perm) => (
              <View
                key={perm.key}
                style={[styles.permissionRow, { borderBottomColor: colors.borderSubtle }]}
              >
                <View style={styles.permissionInfo}>
                  <Text style={[styles.permissionLabel, { color: colors.textPrimary }]}>{perm.label}</Text>
                  <Text style={[styles.permissionDescription, { color: colors.textMuted }]}>{perm.description}</Text>
                </View>
                <Switch
                  value={rolePermissions.includes(perm.key)}
                  onValueChange={() => togglePermission(perm.key)}
                  trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});
