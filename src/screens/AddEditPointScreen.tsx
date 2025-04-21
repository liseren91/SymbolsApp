import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import Geolocation from 'react-native-geolocation-service';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService, PointOfInterest } from '../services/StorageService';
import geolocationService from '../services/GeolocationService';

type Props = StackScreenProps<RootStackParamList, 'AddEditPoint'>;

const AddEditPointScreen: React.FC<Props> = ({ route, navigation }) => {
  const pointId = route.params?.pointId;
  const initialLatitude = route.params?.initialLatitude;
  const initialLongitude = route.params?.initialLongitude;
  const isEditing = !!pointId;

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [latitudeInput, setLatitudeInput] = useState(initialLatitude ? initialLatitude.toString() : '');
  const [longitudeInput, setLongitudeInput] = useState(initialLongitude ? initialLongitude.toString() : '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    if (isEditing && pointId) {
      const loadPointData = async () => {
        setIsLoading(true);
        try {
          const points = await StorageService.loadPoints();
          const pointToEdit = points.find(p => p.id === pointId);
          if (pointToEdit) {
            setName(pointToEdit.name);
            setSymbol(pointToEdit.symbol);
            setLatitude(pointToEdit.latitude);
            setLongitude(pointToEdit.longitude);
            setLatitudeInput(pointToEdit.latitude.toString());
            setLongitudeInput(pointToEdit.longitude.toString());
          } else {
            Alert.alert('Error', 'Point not found.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Failed to load point data:', error);
          Alert.alert('Error', 'Failed to load point data.');
          navigation.goBack();
        }
        setIsLoading(false);
      };
      loadPointData();
    } else if (initialLatitude && initialLongitude) {
      // Если были переданы начальные координаты, показываем их
      Alert.alert('Location Selected', `Lat: ${initialLatitude.toFixed(6)}, Lon: ${initialLongitude.toFixed(6)}`);
    }
  }, [isEditing, pointId, navigation, initialLatitude, initialLongitude]);

  const getCurrentLocation = () => {
    setIsFetchingLocation(true);
    setIsManualEntry(false);
    Geolocation.getCurrentPosition(
      position => {
        const newLat = position.coords.latitude;
        const newLong = position.coords.longitude;
        setLatitude(newLat);
        setLongitude(newLong);
        setLatitudeInput(newLat.toString());
        setLongitudeInput(newLong.toString());
        setIsFetchingLocation(false);
        Alert.alert('Location Acquired', `Lat: ${newLat}, Lon: ${newLong}`);
      },
      error => {
        console.error('GetLocation Error:', error);
        Alert.alert('Error', `Failed to get location: ${error.message}`);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    if (!isManualEntry && latitude !== null && longitude !== null) {
      setLatitudeInput(latitude.toString());
      setLongitudeInput(longitude.toString());
    }
  };

  const validateAndSetCoordinates = () => {
    try {
      const lat = parseFloat(latitudeInput);
      const lon = parseFloat(longitudeInput);
      
      if (isNaN(lat) || isNaN(lon)) {
        Alert.alert('Invalid Coordinates', 'Please enter valid decimal numbers for latitude and longitude.');
        return false;
      }
      
      if (lat < -90 || lat > 90) {
        Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90 degrees.');
        return false;
      }
      
      if (lon < -180 || lon > 180) {
        Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180 degrees.');
        return false;
      }
      
      setLatitude(lat);
      setLongitude(lon);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to parse coordinates. Please enter valid numbers.');
      return false;
    }
  };

  const handleSave = async () => {
    if (!name || !symbol) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    // Если пользователь ввел координаты вручную, проверим их перед сохранением
    if (isManualEntry) {
      const isValid = validateAndSetCoordinates();
      if (!isValid) return;
    } else if (latitude === null || longitude === null) {
      Alert.alert('Missing Coordinates', 'Please set coordinates for this point.');
      return;
    }

    // Проверяем, что координаты не null перед сохранением
    if (latitude === null || longitude === null) {
      Alert.alert('Missing Coordinates', 'Please set valid coordinates for this point.');
      return;
    }

    setIsLoading(true);
    const pointData = { 
      name, 
      symbol, 
      latitude: latitude as number, 
      longitude: longitude as number 
    };

    try {
      if (isEditing && pointId) {
        await StorageService.updatePoint({ ...pointData, id: pointId });
      } else {
        await StorageService.addPoint(pointData);
      }
      // Reload points in GeolocationService after saving
      await geolocationService.loadPoints(); 
      Alert.alert('Success', `Point ${isEditing ? 'updated' : 'added'} successfully.`);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save point:', error);
      Alert.alert('Error', `Failed to save point.`);
    }
    setIsLoading(false);
  };

  if (isLoading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Point Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter point name"
      />

      <Text style={styles.label}>Symbol:</Text>
      <TextInput
        style={styles.input}
        value={symbol}
        onChangeText={setSymbol}
        placeholder="Enter symbol (e.g., 🔔, ⭐)"
        maxLength={2} // Limit symbol length
      />

      <Text style={styles.label}>Coordinates:</Text>
      
      {!isManualEntry ? (
        <View style={styles.coordsContainer}>
          <Text>Latitude: {latitude !== null ? latitude.toFixed(6) : 'Not set'}</Text>
          <Text>Longitude: {longitude !== null ? longitude.toFixed(6) : 'Not set'}</Text>
        </View>
      ) : (
        <View style={styles.manualCoordsContainer}>
          <Text style={styles.coordLabel}>Latitude:</Text>
          <TextInput
            style={styles.coordInput}
            value={latitudeInput}
            onChangeText={setLatitudeInput}
            placeholder="-90 to 90"
            keyboardType="numeric"
          />
          <Text style={styles.coordLabel}>Longitude:</Text>
          <TextInput
            style={styles.coordInput}
            value={longitudeInput}
            onChangeText={setLongitudeInput}
            placeholder="-180 to 180"
            keyboardType="numeric"
          />
        </View>
      )}
      
      <View style={styles.coordinateButtonsContainer}>
        {isFetchingLocation ? (
          <ActivityIndicator />
        ) : (
          <Button title="Use Current Location" onPress={getCurrentLocation} />
        )}
        
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={toggleManualEntry}
        >
          <Text style={styles.toggleButtonText}>
            {isManualEntry ? 'Cancel Manual Entry' : 'Enter Coordinates Manually'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
            title={isEditing ? "Update Point" : "Add Point"} 
            onPress={handleSave} 
            disabled={isLoading || isFetchingLocation} 
        />
        {isLoading && <ActivityIndicator style={styles.saveLoader}/>}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Allows scrolling if content exceeds screen height
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  coordsContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  manualCoordsContainer: {
    marginBottom: 15,
  },
  coordLabel: {
    fontSize: 14,
    marginBottom: 3,
  },
  coordInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  coordinateButtonsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  toggleButton: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  saveLoader: {
    marginLeft: 10,
  }
});

export default AddEditPointScreen; 