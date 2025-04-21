import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // Assuming AppNavigator is in src/navigation

type AlertScreenProps = StackScreenProps<RootStackParamList, 'Alert'>;

const AlertScreen: React.FC<AlertScreenProps> = ({ navigation, route }) => {
  const { symbol } = route.params; // Get symbol from navigation params

  const handleDismiss = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.alertBox}>
        <Text style={styles.symbol}>{symbol || '!'}</Text> 
        <Text style={styles.title}>Точка интереса!</Text>
        <Text style={styles.message}>
          Вы обнаружили скрытую точку интереса в этом месте. 
          Обратите внимание на символ выше.
        </Text>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>Понятно</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
  },
  alertBox: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  symbol: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  dismissButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default AlertScreen; 