// Storage service for persisting user data
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DATA_KEY = '@user_data';
const IS_REGISTERED_KEY = '@is_registered';

export interface StoredUserData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: number; // 1=male, 2=female, 3=other
  dateOfBirth?: string;
  phoneNumber?: string;
  alternateNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: any;
}

/**
 * Save user data to AsyncStorage
 */
export const saveUserData = async (userData: StoredUserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    await AsyncStorage.setItem(IS_REGISTERED_KEY, 'true');
    console.log('✅ User data saved successfully');
  } catch (error) {
    console.error('❌ Error saving user data:', error);
    throw error;
  }
};

/**
 * Get stored user data from AsyncStorage
 */
export const getUserData = async (): Promise<StoredUserData | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      console.log('✅ User data retrieved from storage');
      return userData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error retrieving user data:', error);
    return null;
  }
};

/**
 * Check if user is registered
 */
export const isUserRegistered = async (): Promise<boolean> => {
  try {
    const isRegistered = await AsyncStorage.getItem(IS_REGISTERED_KEY);
    return isRegistered === 'true';
  } catch (error) {
    console.error('❌ Error checking registration status:', error);
    return false;
  }
};

/**
 * Clear user data (useful for logout or testing)
 */
export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(IS_REGISTERED_KEY);
    console.log('✅ User data cleared');
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    throw error;
  }
};

const LOCATION_PERMISSION_KEY = '@location_permission_granted';

export const setLocationPermissionGranted = async (granted: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, granted ? 'true' : 'false');
    console.log('✅ Location permission flag saved:', granted);
  } catch (error) {
    console.error('❌ Error saving location permission flag:', error);
    throw error;
  }
};

export const getLocationPermissionGranted = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);
    return val === 'true';
  } catch (error) {
    console.error('❌ Error reading location permission flag:', error);
    return false;
  }
};

