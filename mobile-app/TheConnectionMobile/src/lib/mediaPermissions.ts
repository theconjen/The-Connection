import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

export async function ensureLibraryPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Photo library access is required to upload images or documents.');
    return false;
  }
  return true;
}

export async function ensureCameraPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Camera access is required to capture new photos or videos.');
    return false;
  }
  return true;
}

export async function ensureMicrophonePermission(): Promise<boolean> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Microphone access is required to capture video with audio.');
    return false;
  }
  return true;
}

export async function ensureCapturePermissions() {
  const [cameraOk, micOk] = await Promise.all([ensureCameraPermission(), ensureMicrophonePermission()]);
  return cameraOk && micOk;
}

