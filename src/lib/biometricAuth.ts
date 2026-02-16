/**
 * Biometric Authentication Service
 *
 * Enables Face ID / Touch ID login for faster app access
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for SecureStore
const BIOMETRIC_ENABLED_KEY = 'biometric_login_enabled';
const BIOMETRIC_USER_ID_KEY = 'biometric_user_id';

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.warn('Error checking biometric support:', error);
    return false;
  }
}

/**
 * Get the type of biometric available (Face ID, Touch ID, etc.)
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

/**
 * Check if biometric login is enabled for this user
 */
export async function isBiometricLoginEnabled(): Promise<boolean> {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Get the user ID associated with biometric login
 */
export async function getBiometricUserId(): Promise<number | null> {
  try {
    const userId = await SecureStore.getItemAsync(BIOMETRIC_USER_ID_KEY);
    return userId ? parseInt(userId, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Enable biometric login for a user
 */
export async function enableBiometricLogin(userId: number): Promise<boolean> {
  try {
    // First verify biometrics work
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm your identity to enable biometric login',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return false;
    }

    // Store the preference and user ID
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
    await SecureStore.setItemAsync(BIOMETRIC_USER_ID_KEY, userId.toString());

    return true;
  } catch (error) {
    console.warn('Error enabling biometric login:', error);
    return false;
  }
}

/**
 * Disable biometric login
 */
export async function disableBiometricLogin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_USER_ID_KEY);
  } catch (error) {
    console.warn('Error disabling biometric login:', error);
  }
}

/**
 * Authenticate with biometrics
 * Returns true if authentication succeeded
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const biometricType = await getBiometricType();

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Login with ${biometricType}`,
      fallbackLabel: 'Use password',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.warn('Biometric authentication error:', error);
    return false;
  }
}

/**
 * Full biometric login flow
 * Returns the user ID if successful, null otherwise
 */
export async function biometricLogin(): Promise<number | null> {
  try {
    // Check if biometric login is enabled
    const enabled = await isBiometricLoginEnabled();
    if (!enabled) {
      return null;
    }

    // Get the stored user ID
    const userId = await getBiometricUserId();
    if (!userId) {
      return null;
    }

    // Authenticate with biometrics
    const authenticated = await authenticateWithBiometric();
    if (!authenticated) {
      return null;
    }

    return userId;
  } catch (error) {
    console.warn('Biometric login error:', error);
    return null;
  }
}
