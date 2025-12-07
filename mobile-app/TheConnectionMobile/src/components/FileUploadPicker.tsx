import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadAPI } from '../lib/apiClient';
import { colors, spacing, radii } from '../theme/tokens';
import { ensureCapturePermissions, ensureLibraryPermission } from '../lib/mediaPermissions';

export type UploadVariant = 'document' | 'image' | 'any';

type UploadSource = 'document' | 'library' | 'camera';

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

async function pickImageFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const allowed = await ensureLibraryPermission();
  if (!allowed) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.9,
    videoMaxDuration: 120,
  });

  if (result.canceled) return null;
  return result.assets?.[0] || null;
}

async function captureMedia(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permitted = await ensureCapturePermissions();
  if (!permitted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.9,
    videoMaxDuration: 120,
  });

  if (result.canceled) return null;
  return result.assets?.[0] || null;
}

function chooseSource(variant: UploadVariant): Promise<UploadSource> {
  if (variant === 'document') return Promise.resolve('document');

  return new Promise((resolve) => {
    const buttons = [
      { text: 'Photo Library', onPress: () => resolve('library') },
      { text: 'Capture with Camera', onPress: () => resolve('camera') },
    ];

    if (variant === 'any') {
      buttons.push({ text: 'Document', onPress: () => resolve('document') });
    }

    buttons.push({ text: 'Cancel', style: 'cancel', onPress: () => resolve('library') });

    Alert.alert('Choose source', 'Select how to add your file', buttons, {
      cancelable: true,
      onDismiss: () => resolve('library'),
    });
  });
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
    let asset: DocumentPicker.DocumentPickerAsset | ImagePicker.ImagePickerAsset | null = null;

    const source = await chooseSource(variant);

    if (source === 'document') {
      asset = await pickDocument();
    } else if (source === 'camera') {
      asset = await captureMedia();
    } else {
      asset = await pickImageFromLibrary();
    }

    if (!asset) return;

    setIsUploading(true);
    try {
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
