import AsyncStorage from '@react-native-async-storage/async-storage';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback'; // Import types for feedback

const SETTINGS_KEY = '@SymbolsApp:appSettings';

export interface AppSettings {
  gpsUpdateInterval: number; // milliseconds
  hapticFeedbackType: HapticFeedbackTypes;
  // Add other settings here, e.g.:
  // vibrationIntensity: number; // (If supported)
  // backgroundTrackingEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  gpsUpdateInterval: 5000, // Default 5 seconds
  hapticFeedbackType: 'impactHeavy' as HapticFeedbackTypes, // Explicitly cast default value
};

const loadSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    if (jsonValue != null) {
      const loaded = JSON.parse(jsonValue);
      // Merge with defaults to ensure all keys exist even if saved settings are old
      return { ...DEFAULT_SETTINGS, ...loaded };
    } else {
      // No settings saved yet, return defaults
      return DEFAULT_SETTINGS;
    }
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return DEFAULT_SETTINGS; // Return defaults on error
  }
};

const saveSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    console.log('[SettingsStorageService] Settings saved:', settings);
  } catch (e) {
    console.error('Failed to save settings to storage', e);
    // Handle errors, maybe alert the user
  }
};

export const SettingsStorageService = {
  loadSettings,
  saveSettings,
}; 