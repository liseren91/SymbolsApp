import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './AppNavigator'; // Import your RootStackParamList

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    // Perform navigation if the react navigation is ready to handle actions
    navigationRef.navigate(name as any, params as any); // Use 'as any' for simplicity here, type safety is ensured by the function signature
  } else {
    // You can decide what to do if react navigation is not ready
    // Maybe queue the action up and try later?
    console.warn('[NavigationService] Navigation attempted before navigator was ready.');
  }
}

// Add other navigation functions as needed, e.g., goBack, reset
export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
} 