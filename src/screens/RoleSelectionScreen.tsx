import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import roleService, { UserRole } from '../services/RoleService';
import PasswordModal from '../components/PasswordModal';

type Props = StackScreenProps<RootStackParamList, 'RoleSelection'>;

const RoleSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const handleGuestRoleSelection = async () => {
    setIsLoading(true);
    try {
      await roleService.saveRole('guest');
      navigation.replace('Main');
    } catch (error) {
      console.error('Failed to save role:', error);
      Alert.alert('Error', 'Failed to save selected role.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminRoleRequest = () => {
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSuccess = async () => {
    setIsPasswordModalVisible(false);
    setIsLoading(true);
    try {
      await roleService.saveRole('admin');
      navigation.replace('Main');
    } catch (error) {
      console.error('Failed to save admin role:', error);
      Alert.alert('Error', 'Failed to save admin role.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Выберите роль</Text>
        <Text style={styles.subtitle}>
          Чтобы продолжить, выберите режим использования приложения
        </Text>
      </View>

      <View style={styles.rolesContainer}>
        <TouchableOpacity
          style={styles.roleCard}
          onPress={handleAdminRoleRequest}
        >
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>👑</Text>
          </View>
          <Text style={styles.roleName}>Администратор</Text>
          <Text style={styles.roleDescription}>
            Полный доступ ко всем функциям: 
            просмотр карты, добавление и редактирование точек
          </Text>
          <Text style={styles.passwordRequired}>Требуется пароль</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleCard}
          onPress={handleGuestRoleSelection}
        >
          <View style={styles.roleIconContainer}>
            <Text style={styles.roleIcon}>👤</Text>
          </View>
          <Text style={styles.roleName}>Гость</Text>
          <Text style={styles.roleDescription}>
            Ограниченный доступ: просмотр карты и получение уведомлений 
            при приближении к точкам
          </Text>
        </TouchableOpacity>
      </View>

      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  rolesContainer: {
    flex: 1,
    padding: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleIcon: {
    fontSize: 30,
  },
  roleName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  roleDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  passwordRequired: {
    fontSize: 12,
    color: 'red',
    marginTop: 5,
    textAlign: 'center',
  }
});

export default RoleSelectionScreen; 