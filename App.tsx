/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
// Import gesture handler -- must be at the top
import 'react-native-gesture-handler'; 
import geolocationService from './src/services/GeolocationService';
import roleService from './src/services/RoleService';
import { Alert } from 'react-native';

function App(): React.JSX.Element {

  useEffect(() => {
    // Load points and start watching location when the app mounts
    const initializeApp = async () => {
      try {
        // Инициализируем сервис ролей
        await roleService.initialize();
        console.log('Role service initialized');

        // Проверяем разрешение на геолокацию
        const hasPermission = await geolocationService.hasLocationPermission();
        if (hasPermission) {
          await geolocationService.initialize(); // Load settings and points
          // Запускаем отслеживание местоположения только в режиме гостя
          if (roleService.isGuest()) {
            geolocationService.startWatching(); // Start background tracking for guest mode
            console.log('Started location tracking for guest mode');
          } else if (roleService.isAdmin() && !roleService.getAdminAuthStatus()) {
            // Если роль админа, но статус аутентификации не подтвержден,
            // сбрасываем роль на гостя для безопасности
            await roleService.logoutAdmin();
            console.log('Admin authentication status invalid, reset to guest');
            geolocationService.startWatching(); // Start tracking for reset guest
          }
        } else {
          // Handle permission denial - maybe show an alert
          Alert.alert(
            'Location Permission Required',
            'This app needs location access to function correctly. Please grant permission in settings.'
          );
          console.error('Location permission denied by user.');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Stop watching when the app unmounts
    return () => {
      geolocationService.stopWatching();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return <AppNavigator />;
}

export default App;
