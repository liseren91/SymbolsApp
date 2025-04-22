# SymbolsApp

SymbolsApp is a React Native application that allows users to discover points of interest based on their geographic location. The app has two roles: Guest mode for discovering hidden points of interest as you move around, and Admin mode for managing these points on the map.

## Features

- **Dual Role System**:
  - **Guest Mode**: Explore the city and receive notifications when approaching points of interest
  - **Admin Mode**: Create, edit, and manage points on the map
  
- **Interactive Map**: Google Maps integration with real-time location tracking

- **Points of Interest**: Each point has a name, coordinates, and a custom symbol

- **Proximity Alerts**: Haptic feedback and on-screen alerts when near a point of interest

- **Configurable Settings**: Adjust GPS update frequency and vibration patterns

## Prerequisites

- Node.js >= 18
- React Native development environment set up ([React Native Environment Setup Guide](https://reactnative.dev/docs/environment-setup))
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS dependencies)

## Installation

1. **Clone the repository**:

```sh
git clone <repository-url>
cd SymbolsApp
```

2. **Install dependencies**:

```sh
npm install
# or
yarn install
```

3. **iOS setup**:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

4. **Update Google Maps API key** (if needed):

- For Android: Edit `android/app/src/main/AndroidManifest.xml` and update the `com.google.android.geo.API_KEY` value
- For iOS: Edit `ios/SymbolsApp/AppDelegate.swift` and update the `GMSServices.provideAPIKey()` value

## Running the App

### iOS

```sh
npm run ios
# or
yarn ios
```

If building for first time:

```sh
cd ios
bundle exec pod install
cd ..
npm run ios
```

### Android

```sh
npm run android
# or
yarn android
```

## App Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/             # Application screens
│   ├── AddEditPointScreen.tsx
│   ├── AlertScreen.tsx
│   ├── MapScreen.tsx
│   ├── RoleSelectionScreen.tsx
│   └── SettingsScreen.tsx
└── services/            # Core business logic
    ├── GeolocationService.ts    # Location tracking
    ├── GoogleSheetsService.ts   # Data integration
    ├── RoleService.ts           # User roles management
    ├── SettingsStorageService.ts # App settings
    └── StorageService.ts        # Points of interest storage
```

## Usage Guide

### Guest Mode

1. Launch the app and select "Guest" mode
2. Allow location permissions when prompted
3. The map will show your current position
4. Walk around - you'll receive haptic feedback and alerts when approaching points of interest
5. Each point has a unique symbol

### Admin Mode

1. Launch the app and select "Admin" mode
2. Enter the password when prompted: `master-flomaster2022`
3. The map will display all configured points of interest
4. To add a new point: 
   - Tap the "Add New Point" button, or
   - Long press on the map at the desired location
5. To edit a point, tap on its marker
6. To delete a point, select it and use the delete option

### Settings

Configure the app behavior in Settings:
- GPS Update Interval: How frequently the app checks your location
- Vibration Type: The haptic feedback style when discovering points

## Troubleshooting

### Location Not Working

1. Ensure location permissions are granted
2. Check that GPS/Location services are enabled on your device
3. For Android, background location requires additional permissions

### Build Errors

#### iOS

If you encounter build issues with react-native-maps:

```sh
cd ios
bundle exec pod install --repo-update
cd ..
```

#### Android

For Android SDK issues:
- Open the project in Android Studio
- Let Gradle sync complete
- Build from Android Studio to identify specific errors

## Data Management

The app uses:
- AsyncStorage for app settings and points of interest
- Google Sheets for symbol descriptions (configured in GoogleSheetsService.ts)

## Maintenance

### Updating Dependencies

```sh
npm outdated
npm update
# Then for iOS
cd ios
bundle exec pod update
cd ..
```

### Troubleshooting iOS Builds

If you encounter iOS build issues with the message "react-native-maps-generated/ComponentDescriptors.h file not found":

1. Clean the build folder:
```sh
cd ios
xcodebuild clean
cd ..
```

2. Reinstall pods:
```sh
cd ios
pod deintegrate
bundle exec pod install
cd ..
```

3. Manually fix by editing the Podfile to ensure proper react-native-maps installation.

### Changing Google API Keys

If you need to change Google API keys:

1. For Maps API (Android): Update in `android/app/src/main/AndroidManifest.xml`
2. For Maps API (iOS): Update in `ios/SymbolsApp/AppDelegate.swift`
3. For Google Sheets API: Update in `src/services/GoogleSheetsService.ts`

## Security Notes

- Admin password is defined in `src/components/PasswordModal.tsx`
- In a production app, you should implement more robust authentication
- API keys should be stored securely using environment variables or a secure storage solution

## License

[Your license information here]
