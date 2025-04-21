import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from './NavigationService'; // Import the ref
import { ActivityIndicator, View } from 'react-native';

// Import screens
import MapScreen from '../screens/MapScreen';
import AddEditPointScreen from '../screens/AddEditPointScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AlertScreen from '../screens/AlertScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

// Import services
import roleService from '../services/RoleService';

// Define type checking for the stack parameters
export type RootStackParamList = {
  RoleSelection: undefined; // Screen for selecting role
  Main: undefined; // Main group (bottom tabs or main stack)
  AddEditPoint: { 
    pointId?: string; // Pass pointId if editing
    initialLatitude?: number; // Pass initial latitude when adding from map
    initialLongitude?: number; // Pass initial longitude when adding from map
  };
  Settings: undefined;
  Alert: { symbol: string }; // Modal alert screen needs symbol
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<keyof RootStackParamList>('RoleSelection');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Инициализируем сервис ролей
        await roleService.initialize();
        // Для демонстрации всегда начинаем с выбора роли
        // В реальном приложении можно проверять наличие роли и пропускать этот экран
        setInitialRouteName('RoleSelection');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRouteName}>
        {/* Role Selection Screen */}
        <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen} 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Prevent swipe back
          }} 
        />

        {/* Main screen group */}
        <Stack.Screen 
          name="Main" 
          component={MapScreen} 
          options={{ 
            title: 'Map',
            headerLeft: () => null, // Prevent going back to role selection
          }} 
        />
        <Stack.Screen 
          name="AddEditPoint" 
          component={AddEditPointScreen} 
          options={({ route }) => ({ title: route.params?.pointId ? 'Edit Point' : 'Add Point' })} 
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Settings' }} 
        />
        
        {/* Modal screen group */}
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen 
            name="Alert" 
            component={AlertScreen} 
            options={{ headerShown: false }} // Hide header for modal
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 