import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService, PointOfInterest } from '../services/StorageService';
import geolocationService from '../services/GeolocationService';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import roleService, { UserRole } from '../services/RoleService';
import PasswordModal from '../components/PasswordModal';

type Props = StackScreenProps<RootStackParamList, 'Main'>;

// Координаты центра Нови-Сада, Сербия
const NOVI_SAD_REGION: Region = {
  latitude: 45.2671,
  longitude: 19.8335,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Определение типа для местоположения пользователя
interface UserLocation {
  latitude: number;
  longitude: number;
}

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const [points, setPoints] = useState<PointOfInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  // Загружаем роль пользователя при монтировании компонента
  useEffect(() => {
    const loadUserRole = async () => {
      const role = roleService.getRole();
      setUserRole(role);
      console.log('[MapScreen] Current user role:', role);
    };
    
    loadUserRole();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadData = async () => {
        setIsLoading(true);
        try {
          const loadedPoints = await StorageService.loadPoints();
          if (isMounted) {
            setPoints(loadedPoints);
            
            // Получаем текущее местоположение пользователя
            const currentPosition = await geolocationService.getCurrentPosition();
            if (isMounted && currentPosition) {
              setUserLocation({
                latitude: currentPosition.coords.latitude,
                longitude: currentPosition.coords.longitude,
              });
            }
          }
        } catch (error) {
          console.error('Failed to load points on MapScreen:', error);
          Alert.alert('Error', 'Could not load points of interest.');
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      loadData();

      return () => { isMounted = false; };
    }, [])
  );

  const handleEditPoint = (pointId: string) => {
    if (userRole === 'admin') {
      navigation.navigate('AddEditPoint', { pointId });
    } else {
      // Гости не могут редактировать точки
      Alert.alert('Доступ ограничен', 'Только администраторы могут редактировать точки');
    }
  };

  const handleAddPoint = () => {
    navigation.navigate('AddEditPoint', {});
  };

  const handleAddPointAtLocation = (lat: number, long: number) => {
    navigation.navigate('AddEditPoint', { initialLatitude: lat, initialLongitude: long });
  };

  const handleGoToSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSwitchToGuest = async () => {
    try {
      // Переключаемся на гостевой режим
      await roleService.saveRole('guest');
      setUserRole('guest');
      
      // Запускаем отслеживание местоположения
      geolocationService.startWatching();
      
      // Уведомляем пользователя
      Alert.alert('Роль изменена', 'Вы переключились на роль: Гость');
    } catch (error) {
      console.error('Failed to switch to guest role:', error);
      Alert.alert('Error', 'Не удалось изменить роль на гостевую.');
    }
  };

  const handleRequestAdminAccess = () => {
    // Показываем модальное окно для ввода пароля
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSuccess = async () => {
    setIsPasswordModalVisible(false);
    try {
      // Аутентифицируемся как админ
      await roleService.authenticateAdmin('master-flomaster2022');
      // Меняем роль
      await roleService.saveRole('admin');
      setUserRole('admin');
      
      // Останавливаем геолокацию для админа
      geolocationService.stopWatching();
      
      // Уведомляем пользователя
      Alert.alert('Роль изменена', 'Вы переключились на роль: Администратор');
    } catch (error) {
      console.error('Failed to change to admin role:', error);
      Alert.alert('Error', 'Не удалось изменить роль на администратора.');
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalVisible(false);
  };

  const handleSwitchRole = () => {
    if (userRole === 'admin') {
      // Если текущая роль - админ, переключаемся на гостя без запроса пароля
      handleSwitchToGuest();
    } else {
      // Если текущая роль - гость, запрашиваем пароль для перехода в админ
      handleRequestAdminAccess();
    }
  };

  const handleDeletePoint = (pointId: string) => {
    if (userRole !== 'admin') {
      Alert.alert('Доступ ограничен', 'Только администраторы могут удалять точки');
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this point?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await StorageService.deletePoint(pointId);
              const updatedPoints = await StorageService.loadPoints();
              setPoints(updatedPoints);
              await geolocationService.loadPoints();
            } catch (error) {
              console.error("Failed to delete point:", error);
              Alert.alert("Error", "Failed to delete point.");
            } finally {
              setIsLoading(false); 
            }
          },
        },
      ]
    );
  };

  const handleMarkerPress = (pointId: string) => {
    if (userRole === 'admin') {
      handleEditPoint(pointId);
    } else {
      // Для гостей это действие не должно происходить, так как точки скрыты
      // Но на всякий случай обработаем этот сценарий
      Alert.alert(
        'Точка скрыта', 
        'В режиме гостя точки не отображаются на карте. Исследуйте город, чтобы найти их!'
      );
    }
  };

  const handleGoToMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      });
    } else {
      Alert.alert('Location Unavailable', 'Could not get your current location.');
    }
  };

  const handleMapLongPress = (event: any) => {
    if (userRole !== 'admin') {
      return; // Гости не могут добавлять точки
    }

    const { coordinate } = event.nativeEvent;
    Alert.alert(
      'Add New Point',
      'Do you want to add a new point at this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Point', 
          onPress: () => handleAddPointAtLocation(coordinate.latitude, coordinate.longitude)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerButtons}>
        {userRole === 'admin' && (
          <Button title="Add New Point" onPress={handleAddPoint} />
        )}
        <Button title="Settings" onPress={handleGoToSettings} />
        <Button 
          title={`Switch to ${userRole === 'admin' ? 'Guest' : 'Admin'} Mode`} 
          onPress={handleSwitchRole} 
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader}/>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={NOVI_SAD_REGION}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onLongPress={userRole === 'admin' ? handleMapLongPress : undefined}
          >
            {userRole === 'admin' && points.map((point) => (
              <Marker
                key={point.id}
                coordinate={{
                  latitude: point.latitude,
                  longitude: point.longitude,
                }}
                title={point.name}
                description={point.symbol}
                onPress={() => handleMarkerPress(point.id)}
              />
            ))}
          </MapView>
          
          <TouchableOpacity 
            style={styles.myLocationButton}
            onPress={handleGoToMyLocation}
          >
            <Text style={styles.myLocationButtonText}>📍</Text>
          </TouchableOpacity>

          {userRole === 'admin' ? (
            <View style={styles.roleIndicator}>
              <Text style={styles.roleIndicatorText}>Admin Mode</Text>
            </View>
          ) : (
            <View style={styles.guestInfoContainer}>
              <Text style={styles.guestInfoText}>
                Точки интереса скрыты. Двигайтесь по городу, чтобы обнаружить их.
              </Text>
              <Text style={styles.guestInfoSubtext}>
                Телефон завибрирует и появится символ при приближении к точке
              </Text>
            </View>
          )}
        </View>
      )}

      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={handlePasswordCancel}
        onSuccess={handlePasswordSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  myLocationButtonText: {
    fontSize: 24,
  },
  roleIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  roleIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  itemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemSymbol: {
    fontSize: 24,
    marginRight: 15,
  },
  itemNameCoords: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  itemText: {
    fontSize: 16,
  },
  itemCoords: {
    fontSize: 12,
    color: 'gray',
  },
  editText: {
    color: 'blue',
    marginLeft: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  guestInfoContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  guestInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  guestInfoSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MapScreen; 