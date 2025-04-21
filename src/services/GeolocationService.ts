import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { getDistance } from 'geolib';
import { StorageService, PointOfInterest } from './StorageService'; // Import from StorageService
import * as NavigationService from '../navigation/NavigationService'; // Import NavigationService
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from "react-native-haptic-feedback"; // Import Haptic Feedback and type
import { SettingsStorageService, AppSettings, DEFAULT_SETTINGS } from './SettingsStorageService'; // Import settings
// TODO: Import navigation functions to show AlertScreen
// TODO: Import haptic feedback

const LOCATION_THRESHOLD = 100; // meters

class GeolocationService {
  private watchId: number | null = null;
  private pointsOfInterest: PointOfInterest[] = []; // Load from storage
  private currentSettings: AppSettings = DEFAULT_SETTINGS; // Hold current settings
  private isChecking: boolean = false;
  private lastTriggeredPointId: string | null = null;

  // Method to load both points and settings
  async initialize() {
      await this.loadSettings();
      await this.loadPoints();
  }

  // Load settings from storage
  async loadSettings() {
      try {
          this.currentSettings = await SettingsStorageService.loadSettings();
          console.log('[GeolocationService] Settings loaded:', this.currentSettings);
      } catch (error) {
          console.error('[GeolocationService] Failed to load settings:', error);
          this.currentSettings = DEFAULT_SETTINGS; // Fallback to defaults
      }
  }

  async hasLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('always');
      return status === 'granted';
    }

    // Ensure Platform.Version is treated as a number for comparison
    const androidVersion = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

    if (Platform.OS === 'android' && androidVersion < 23) {
      return true;
    }

    const hasFineLocationPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    // Check background permission only for Android 10 (API 29) and above
    const hasBackgroundLocationPermission = androidVersion >= 29 ? await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
    ) : true;

    if (hasFineLocationPermission && hasBackgroundLocationPermission) {
      return true;
    }

    // Request permissions
    const statusFine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let statusBackground = PermissionsAndroid.RESULTS.GRANTED;
    // Request background permission only for Android 10 (API 29) and above
    if (androidVersion >= 29) {
        statusBackground = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
        );
    }

    return statusFine === PermissionsAndroid.RESULTS.GRANTED && statusBackground === PermissionsAndroid.RESULTS.GRANTED;
  }

  startWatching(customInterval?: number) {
    if (this.watchId !== null) {
      console.log('[GeolocationService] Already watching.');
      return;
    }

    // Ensure settings are loaded before starting
    if (!this.currentSettings) {
        console.warn("[GeolocationService] Settings not loaded, using defaults temporarily.");
        this.loadSettings(); // Attempt to load settings if not present
    }

    // Используем пользовательский интервал, если он передан
    const effectiveInterval = customInterval || this.currentSettings.gpsUpdateInterval || DEFAULT_SETTINGS.gpsUpdateInterval;
    console.log(`[GeolocationService] Effective GPS Interval: ${effectiveInterval}ms`);

    this.hasLocationPermission().then(hasPermission => {
      if (!hasPermission) {
        console.error('[GeolocationService] Location permission denied.');
        // TODO: Handle permission denial (e.g., show a message to the user)
        return;
      }

      console.log('[GeolocationService] Starting location watch...');
      this.watchId = Geolocation.watchPosition(
        (position) => {
          console.log('[GeolocationService] New position:', position.coords);
          this.checkProximity(position.coords);
        },
        (error) => {
          console.error('[GeolocationService] Watch Error:', error);
          // TODO: Handle watch errors
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          distanceFilter: 10, // Minimum distance (m) before update
          interval: effectiveInterval, // Use interval from settings
          fastestInterval: Math.max(2000, effectiveInterval / 2), // Adjust fastest based on interval
          forceRequestLocation: true,
          forceLocationManager: false, // Use fused location provider on Android
          showLocationDialog: false, // Don't show system dialog if location is off
          useSignificantChanges: false, // Use significant changes API (lower power, less frequent)
        }
      );
    }).catch(error => {
      console.error('[GeolocationService] Permission check error:', error);
    });
  }

  stopWatching() {
    if (this.watchId !== null) {
      console.log('[GeolocationService] Stopping location watch...');
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Load points from storage
  async loadPoints() { // Make async
      try {
          this.pointsOfInterest = await StorageService.loadPoints();
          console.log('[GeolocationService] Points loaded from storage:', this.pointsOfInterest);
      } catch (error) {
          console.error('[GeolocationService] Failed to load points:', error);
          this.pointsOfInterest = []; // Ensure it's an empty array on failure
      }
  }

  private checkProximity(currentCoords: { latitude: number; longitude: number }) {
    if (this.isChecking || this.pointsOfInterest.length === 0) {
      return; // Avoid concurrent checks or checking with no points
    }
    this.isChecking = true;

    let closestPoint: PointOfInterest | null = null;
    let minDistance = Infinity;

    this.pointsOfInterest.forEach(point => {
      const distance = getDistance(
        { latitude: currentCoords.latitude, longitude: currentCoords.longitude },
        { latitude: point.latitude, longitude: point.longitude }
      );

      console.log(`[GeolocationService] Distance to ${point.name}: ${distance}m`);

      if (distance < LOCATION_THRESHOLD && distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
        // Explicitly type closestPoint inside the if block to help inference
        const validClosestPoint: PointOfInterest = closestPoint;
        // Trigger only once when entering the zone
        if (this.lastTriggeredPointId !== validClosestPoint.id) { 
            console.log(`[GeolocationService] Approaching ${validClosestPoint.name}! Distance: ${minDistance}m`);
            this.lastTriggeredPointId = validClosestPoint.id;
            this.triggerAlert(validClosestPoint);
        }
    } else {
        // Reset trigger when moving away from all points
        if (this.lastTriggeredPointId !== null) {
            console.log('[GeolocationService] Moved away from points.');
            this.lastTriggeredPointId = null;
            // Potentially hide alert or stop vibration if needed
        }
    }

    this.isChecking = false;
  }

  private triggerAlert(point: PointOfInterest) {
    console.log(`Triggering alert for ${point.name} with symbol ${point.symbol}`);
    
    // 1. Vibrate using settings
    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false
    };
    const feedbackType = this.currentSettings.hapticFeedbackType || DEFAULT_SETTINGS.hapticFeedbackType;
    console.log(`[GeolocationService] Triggering haptic feedback: ${feedbackType}`);
    ReactNativeHapticFeedback.trigger(feedbackType, options);
    
    // 2. Navigate to Alert Screen using NavigationService
    NavigationService.navigate('Alert', { symbol: point.symbol });

    // TODO: Ensure this works correctly in the background
    // Navigation might behave differently if the app is fully in the background.
    // This might require a Headless JS task or foreground service notification on Android.
  }

  // Method to be called externally to update points (e.g., after adding/editing)
  // This method now just updates the internal state. Saving happens elsewhere (e.g., AddEditScreen)
  // Or we can keep the save logic here if the service is the single source of truth
  async updatePoints(newPoints: PointOfInterest[]) {
    this.pointsOfInterest = newPoints;
    console.log('[GeolocationService] Points updated in memory:', this.pointsOfInterest);
    // Also save the updated list to storage
    try {
        await StorageService.savePoints(newPoints);
        console.log('[GeolocationService] Points saved to storage after update.');
    } catch (error) {
        console.error('[GeolocationService] Failed to save updated points:', error);
    }
    // Reset trigger state if points change significantly
    this.lastTriggeredPointId = null; 
  }

  // Метод для получения текущего местоположения
  async getCurrentPosition(): Promise<Geolocation.GeoPosition | null> {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        console.error('[GeolocationService] Location permission denied.');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          position => {
            console.log('[GeolocationService] Current position:', position.coords);
            resolve(position);
          },
          error => {
            console.error('[GeolocationService] Get position error:', error);
            reject(error);
          },
          {
            accuracy: {
              android: 'high',
              ios: 'best',
            },
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    } catch (error) {
      console.error('[GeolocationService] Error getting current position:', error);
      return null;
    }
  }
}

// Export a singleton instance
const geolocationService = new GeolocationService();
export default geolocationService; 