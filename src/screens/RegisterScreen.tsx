import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {registerUser} from '../services/api';
import {getFCMToken} from '../services/fcm';
import {saveUserData, setLocationPermissionGranted} from '../services/storage';
import {PermissionsAndroid, Platform} from 'react-native';
// @ts-ignore - optional native module types may be missing
import Geolocation from 'react-native-geolocation-service';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Generate FCM token first (optional - can continue without it)
      console.log('Step 1: Attempting to generate FCM token...');
      let fcmToken: string = '';
      try {
        fcmToken = await getFCMToken();
        console.log('✅ FCM token generated successfully');
      } catch (fcmError: any) {
        console.warn('⚠️ FCM token generation failed:', fcmError.message);
        console.warn('⚠️ Continuing registration without FCM token');
        // Continue without FCM token - it will be empty string
        // The backend should handle empty FCM token gracefully
        fcmToken = '';
      }

      // Step 2: Register user with email and FCM token
      console.log('Step 2: Registering user with email and FCM token...');
      const userData = await registerUser(email, fcmToken);
      
      // Step 3: Save user data to AsyncStorage
      console.log('Step 3: Saving user data to storage...');
      console.log(userData);
      await saveUserData(userData);

      setLoading(false);

      console.log('✅ Registration successful! User data saved.');

      // Prompt user to enable background location (optional)
      Alert.alert(
        'Enable Location for Background Actions',
        'Allow the app to collect your location when a notification is received? You can change this later in settings.',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              navigation.replace('IdentityCard', {userData});
            },
          },
          {
            text: 'Enable',
            onPress: async () => {
              try {
                if (Platform.OS === 'android') {
                  // Request fine location
                  const fine = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                      title: 'Location Permission',
                      message: 'App needs location access to send location when a notification arrives',
                      buttonPositive: 'OK',
                    },
                  );
                  // Request background location if API level requires it
                  let bg = 'granted';
                  if (Platform.Version >= 29) {
                    bg = await PermissionsAndroid.request(
                      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                      {
                        title: 'Background Location Permission',
                        message: 'Allow background location to send your location when notifications arrive',
                        buttonPositive: 'OK',
                      },
                    );
                  }
                  if (fine === PermissionsAndroid.RESULTS.GRANTED && (bg === 'granted' || Platform.Version < 29)) {
                    await setLocationPermissionGranted(true);
                    Alert.alert('Success', 'Location permission granted.');
                  } else {
                    await setLocationPermissionGranted(false);
                    Alert.alert('Permission denied', 'Background location permission not granted.');
                  }
                } else {
                  // iOS: request always authorization
                  try {
                    const auth = Geolocation.requestAuthorization('always');
                    // requestAuthorization returns a string or promise; set flag optimistically
                    await setLocationPermissionGranted(true);
                    Alert.alert('Success', 'Location permission requested. Please allow "Always" in system settings.');
                  } catch (err) {
                    console.warn('iOS location auth error:', err);
                    await setLocationPermissionGranted(false);
                    Alert.alert('Permission denied', 'Could not request location permission.');
                  }
                }
              } catch (err) {
                console.error('Error requesting location permission:', err);
                await setLocationPermissionGranted(false);
                Alert.alert('Error', 'Failed to request permissions.');
              } finally {
                navigation.replace('IdentityCard', {userData});
              }
            },
          },
        ],
      );
    } catch (error: any) {
      setLoading(false);
      const errorMessage = error.message || 'Something went wrong';
      console.error('Registration error in screen:', errorMessage);
      
      // Show detailed error alert
      Alert.alert(
        'Registration Failed',
        errorMessage,
        [
          {text: 'OK', style: 'default'},
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Registration</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" animating={true} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 60,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 24,
    color: '#333',
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;

