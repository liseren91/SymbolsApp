import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; // Required for uuid
import { v4 as uuidv4 } from 'uuid';

// Re-define or import the PointOfInterest type
export interface PointOfInterest {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  symbol: string;
}

const STORAGE_KEY = '@SymbolsApp:pointsOfInterest';

// --- Helper Functions ---

const loadPoints = async (): Promise<PointOfInterest[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to load points from storage', e);
    return [];
  }
};

const savePoints = async (points: PointOfInterest[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(points);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save points to storage', e);
  }
};

// --- CRUD Operations ---

const addPoint = async (pointData: Omit<PointOfInterest, 'id'>): Promise<PointOfInterest> => {
  const currentPoints = await loadPoints();
  const newPoint: PointOfInterest = {
    ...pointData,
    id: uuidv4(), // Generate a unique ID
  };
  const updatedPoints = [...currentPoints, newPoint];
  await savePoints(updatedPoints);
  console.log('[StorageService] Point added:', newPoint);
  return newPoint;
};

const updatePoint = async (updatedPoint: PointOfInterest): Promise<void> => {
  const currentPoints = await loadPoints();
  const pointIndex = currentPoints.findIndex(p => p.id === updatedPoint.id);
  if (pointIndex === -1) {
    console.error(`[StorageService] Point with id ${updatedPoint.id} not found for update.`);
    return; // Or throw an error
  }
  const updatedPoints = [...currentPoints];
  updatedPoints[pointIndex] = updatedPoint;
  await savePoints(updatedPoints);
  console.log('[StorageService] Point updated:', updatedPoint);
};

const deletePoint = async (pointId: string): Promise<void> => {
  const currentPoints = await loadPoints();
  const updatedPoints = currentPoints.filter(p => p.id !== pointId);
  if (currentPoints.length === updatedPoints.length) {
      console.warn(`[StorageService] Point with id ${pointId} not found for deletion.`);
  }
  await savePoints(updatedPoints);
  console.log('[StorageService] Point deleted:', pointId);
};

// Export functions for use
export const StorageService = {
  loadPoints,
  savePoints, // Exposed mainly for GeolocationService update
  addPoint,
  updatePoint,
  deletePoint,
}; 