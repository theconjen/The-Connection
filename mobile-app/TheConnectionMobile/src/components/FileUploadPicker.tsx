import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadAPI } from '../lib/apiClient';
import { colors, spacing, radii } from '../theme/tokens';

export type UploadVariant = 'document' | 'image' | 'any';

export interface FileUploadPickerProps {
  variant?: UploadVariant;
  label?: string;
  description?: string;
  onUploaded?: (url: string) => void;
  style?: ViewStyle;
}

const normalizeName = (name?: string, fallback = 'upload') => name?.replace(/[^a-zA-Z0-9._-]/g, '') || `${fallback}.bin`;

async function pickDocument(): Promise<DocumentPicker.DocumentPickerAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.type === 'cancel') return null;
  return result.assets?.[0] || null;
}

async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission required', 'We need access to your photos to complete this action.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
  if (result.canceled) return null;
  return result.assets?.[0] || null;
}

export function FileUploadPicker({
  variant = 'any',
  label = 'Upload file',
  description,
  onUploaded,
  style,
}: FileUploadPickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = useCallback(async () => {
    setIsUploading(true);
    try {
      const asset =
        variant === 'image'
          ? await pickImage()
          : variant === 'document'
            ? await pickDocument()
            : (await pickImage()) || (await pickDocument());

      if (!asset) {
        setIsUploading(false);
        return;
      }

      const fileName = normalizeName(asset.fileName || (asset as any).name, 'upload');
      const mimeType = (asset as any).mimeType || asset.type || 'application/octet-stream';

      const uploadTarget = await uploadAPI.requestUpload(fileName, mimeType);
      const uploadedUrl = await uploadAPI.uploadFromUri(asset.uri, uploadTarget, mimeType);

      onUploaded?.(uploadedUrl);
      Alert.alert('Success', 'Your file has been uploaded.');
    } catch (error) {
      console.error('Upload failed', error);
      Alert.alert('Upload failed', 'Please try again in a moment.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploaded, variant]);

  return (
    <Pressable style={[styles.container, style]} onPress={handlePick} disabled={isUploading}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{variant === 'image' ? '📷' : '📄'}</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.label}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {isUploading ? <ActivityIndicator color={colors.light.primary} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
    borderColor: colors.light.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.muted,
  },
  iconText: {
    fontSize: 18,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.text,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    color: colors.light.textSecondary,
  },
});
