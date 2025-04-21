import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SettingsStorageService, AppSettings, DEFAULT_SETTINGS } from '../services/SettingsStorageService';
import geolocationService from '../services/GeolocationService';
import { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import roleService, { UserRole } from '../services/RoleService';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import PasswordModal from '../components/PasswordModal';

// Define options for settings
const GPS_INTERVAL_OPTIONS = [
  { label: '2 seconds', value: 2000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
];

// Manually list the common HapticFeedbackTypes as Picker doesn't work well with union types directly
const HAPTIC_FEEDBACK_OPTIONS: { label: string; value: HapticFeedbackTypes }[] = [
  { label: 'Heavy Impact', value: 'impactHeavy' as HapticFeedbackTypes },
  { label: 'Medium Impact', value: 'impactMedium' as HapticFeedbackTypes },
  { label: 'Light Impact', value: 'impactLight' as HapticFeedbackTypes },
  { label: 'Success Notification', value: 'notificationSuccess' as HapticFeedbackTypes },
  { label: 'Warning Notification', value: 'notificationWarning' as HapticFeedbackTypes },
  { label: 'Error Notification', value: 'notificationError' as HapticFeedbackTypes },
  { label: 'Rigid', value: 'rigid' as HapticFeedbackTypes },
  { label: 'Soft', value: 'soft' as HapticFeedbackTypes },
];

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const loadedSettings = await SettingsStorageService.loadSettings();
        setSettings(loadedSettings);
        
        // Загружаем текущую роль пользователя
        const currentRole = roleService.getRole();
        setUserRole(currentRole);
      } catch (error) {
        console.error('Error loading settings:', error);
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await SettingsStorageService.saveSettings(settings);
      
      // Применяем настройки геолокации
      geolocationService.stopWatching();
      // Запускаем отслеживание только для гостей
      if (userRole === 'guest') {
        geolocationService.startWatching(settings.gpsUpdateInterval);
      }
      
      Alert.alert('Settings Saved', 'Your settings have been updated.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChangeToGuest = async () => {
    try {
      await roleService.saveRole('guest');
      setUserRole('guest');
      
      // Запускаем отслеживание для гостя
      geolocationService.startWatching(settings.gpsUpdateInterval);
      
      Alert.alert('Роль изменена', 'Вы переключились на роль: Гость');
    } catch (error) {
      console.error('Failed to change role:', error);
      Alert.alert('Error', 'Could not change user role.');
    }
  };

  const handleRoleChangeToAdmin = () => {
    // Показываем модальное окно с вводом пароля
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSuccess = async () => {
    setIsPasswordModalVisible(false);
    try {
      // Сначала аутентифицируемся
      await roleService.authenticateAdmin('master-flomaster2022');
      // Затем меняем роль
      await roleService.saveRole('admin');
      setUserRole('admin');
      
      // Останавливаем отслеживание местоположения для админа
      geolocationService.stopWatching();
      
      Alert.alert('Роль изменена', 'Вы переключились на роль: Администратор');
    } catch (error) {
      console.error('Failed to change to admin role:', error);
      Alert.alert('Error', 'Could not change to admin role.');
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
  };

  const handleLogout = async () => {
    try {
      // Очищаем аутентификацию админа и меняем роль на гостя
      await roleService.logoutAdmin();
      setUserRole('guest');
      
      // Запускаем отслеживание для гостя
      geolocationService.startWatching(settings.gpsUpdateInterval);
      
      Alert.alert('Выход выполнен', 'Вы вышли из режима администратора');
    } catch (error) {
      console.error('Failed to logout:', error);
      Alert.alert('Error', 'Could not logout.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* User Role Setting */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>User Role:</Text>
        <View style={styles.userRoleContainer}>
          <Text style={styles.currentRoleText}>
            Current role: {userRole === 'admin' ? 'Administrator' : 'Guest'}
          </Text>
          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                userRole === 'admin' ? styles.activeRoleButton : null
              ]}
              onPress={handleRoleChangeToAdmin}
            >
              <Text style={[
                styles.roleButtonText,
                userRole === 'admin' ? styles.activeRoleButtonText : null
              ]}>Admin Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                userRole === 'guest' ? styles.activeRoleButton : null
              ]}
              onPress={handleRoleChangeToGuest}
            >
              <Text style={[
                styles.roleButtonText,
                userRole === 'guest' ? styles.activeRoleButtonText : null
              ]}>Guest Mode</Text>
            </TouchableOpacity>
          </View>

          {userRole === 'admin' && (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.description}>
          Admin can add and edit points. Guest can only view points and receive notifications.
        </Text>
      </View>

      {/* GPS Update Interval Setting */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>GPS Update Interval:</Text>
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={settings.gpsUpdateInterval}
            onValueChange={(itemValue) =>
                setSettings(prev => ({ ...prev, gpsUpdateInterval: itemValue }))
            }
            style={styles.picker}
            >
            {GPS_INTERVAL_OPTIONS.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
            </Picker>
        </View>
        <Text style={styles.description}>How often the app checks your location. Shorter intervals use more battery.</Text>
      </View>

      {/* Haptic Feedback Type Setting */}
      <View style={styles.settingItem}>
        <Text style={styles.label}>Vibration Type:</Text>
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={settings.hapticFeedbackType}
            onValueChange={(itemValue) =>
                setSettings(prev => ({ ...prev, hapticFeedbackType: itemValue }))
            }
            style={styles.picker}
            >
            {HAPTIC_FEEDBACK_OPTIONS.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
            </Picker>
        </View>
        <Text style={styles.description}>The type of vibration you feel when approaching a point.</Text>
      </View>

      <View style={styles.saveButtonContainer}>
        <Button title={isSaving ? "Saving..." : "Save Settings"} onPress={handleSave} disabled={isSaving} />
      </View>

      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickerContainer: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      marginBottom: 5, 
      backgroundColor: 'white', // Ensure background is white on Android
  },
  picker: {
      // Height might be needed on Android, adjust as necessary
      // height: 50, 
  },
  description: {
    fontSize: 12,
    color: 'gray',
    marginTop: 5,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  userRoleContainer: {
    marginBottom: 10,
  },
  currentRoleText: {
    fontSize: 16,
    marginBottom: 10,
  },
  roleButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeRoleButton: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  activeRoleButtonText: {
    color: 'white',
  },
  logoutButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logoutButtonText: {
    color: 'red',
    fontWeight: 'bold',
  }
});

export default SettingsScreen; 