/**
 * SIC Mobile App
 * @format
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, useColorScheme, View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import RegisterScreen from './src/screens/RegisterScreen';
import IdentityCardScreen from './src/screens/IdentityCardScreen';
import {getUserData} from './src/services/storage';
import {initializeFCM} from './src/services/fcm';

export type RootStackParamList = {
  Register: undefined;
  IdentityCard: {userData: any};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Register' | 'IdentityCard'>('Register');
  const [initialUserData, setInitialUserData] = useState<any>(null);

  useEffect(() => {
    // Initialize FCM for push notifications
    console.log('🚀 App starting - Initializing FCM...');
    initializeFCM();
    
    // Check for stored user data
    checkUserRegistration();
  }, []);

  const checkUserRegistration = async () => {
    try {
      console.log('🔍 Checking for stored user data...');
      
      // Add minimum delay to ensure loading screen is visible
      const [storedUserData] = await Promise.all([
        getUserData(),
        new Promise<void>(resolve => setTimeout(() => resolve(), 500)), // Minimum 500ms delay
      ]);
      
      if (storedUserData) {
        console.log('✅ User data found, will show Identity Card');
        setInitialUserData(storedUserData);
        setInitialRoute('IdentityCard');
      } else {
        console.log('ℹ️ No user data found, showing Registration screen');
        setInitialRoute('Register');
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
      setInitialRoute('Register');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" animating={true} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: {
              backgroundColor: '#007AFF',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="IdentityCard"
            component={IdentityCardScreen}
            options={{
              title: 'Identity Card',
              headerBackVisible: false,
            }}
            initialParams={initialUserData ? {userData: initialUserData} : undefined}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default App;
