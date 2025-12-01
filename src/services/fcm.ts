// FCM (Firebase Cloud Messaging) Token Service
import {Platform, Alert, PermissionsAndroid} from 'react-native';
// @ts-ignore - optional native module types may be missing in this workspace
import Geolocation from 'react-native-geolocation-service';
import {sendLocation} from './api';

let messaging: any = null;

// Lazy import Firebase to handle cases where it's not set up
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.warn('⚠️ Firebase Messaging not available. Make sure Firebase is properly set up.');
}

/**
 * Ensure notification channel exists (Android 8.0+). Firebase will often create channels,
 * but creating a no-op function ensures calls are safe.
 */
const createNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    try {
      // If you use Notifee or native code, create channel there.
      console.log('✅ createNotificationChannel (noop) called');
    } catch (error) {
      console.warn('⚠️ createNotificationChannel failed:', error);
    }
  }
};


/**
 * Request notification permissions and get FCM token
 * This needs to be called before registering the user
 */
export const getFCMToken = async (): Promise<string> => {
  try {
    if (!messaging) {
      throw new Error('Firebase Messaging is not initialized. Please set up Firebase first.');
    }

    console.log('🔔 Requesting FCM permissions and token...');

    // Create notification channel for Android
    await createNotificationChannel();

    // Request permission for notifications
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      throw new Error('Notification permissions not granted');
    }

    console.log('✅ Notification permission granted');

    // Get FCM token
    const token = await messaging().getToken();
    
    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
    console.log('📱 Full FCM Token:', token);
    return token;
  } catch (error: any) {
    console.error('❌ Error getting FCM token:', error);
    throw new Error(`Failed to get FCM token: ${error.message}`);
  }
};

/**
 * Delete FCM token (useful for logout)
 */
export const deleteFCMToken = async (): Promise<void> => {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging not available');
      return;
    }
    await messaging().deleteToken();
    console.log('FCM token deleted');
  } catch (error: any) {
    console.error('Error deleting FCM token:', error);
  }
};

/**
 * Initialize FCM - Set up message handlers
 * Call this in App.tsx on app startup
 */
export const initializeFCM = () => {
  if (!messaging) {
    console.warn('⚠️ Firebase Messaging not available');
    return;
  }

  try {
    console.log('🚀 Initializing FCM handlers...');
    
    // Handle foreground messages (when app is open)
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage: { notification: { title: any; body: any; }; data: any; messageId: any; }) => {
      console.log('📬 ===== FOREGROUND MESSAGE RECEIVED =====');
      console.log('📬 Full Message:', JSON.stringify(remoteMessage, null, 2));
      console.log('📬 Notification:', remoteMessage.notification);
      console.log('📬 Data:', remoteMessage.data);
      console.log('📬 Message ID:', remoteMessage.messageId);
      console.log('📬 =======================================');
      
      // Show alert for foreground notifications
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || 'You have a new message',
          [{text: 'OK'}],
        );
      }
    });

    // Handle notification tap when app is in background
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('📬 ===== NOTIFICATION TAPPED (Background) =====');
      console.log('📬 Full Message:', JSON.stringify(remoteMessage, null, 2));
      console.log('📬 ==========================================');
    });

    // Handle notification tap when app is closed
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('📬 ===== NOTIFICATION TAPPED (Quit State) =====');
          console.log('📬 Full Message:', JSON.stringify(remoteMessage, null, 2));
          console.log('📬 ===========================================');
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token: string) => {
      console.log('🔄 FCM Token refreshed:', token);
      console.log('📱 New Token (first 30 chars):', token.substring(0, 30) + '...');
      // TODO: Send new token to your server
    });

    // Check if FCM is supported
    checkFCMSupport().catch(err => {
      console.error('FCM support check error:', err);
    });

    console.log('✅ FCM initialized and all handlers set up');
    console.log('📝 Ready to receive push notifications');
    return unsubscribeForeground;
  } catch (error) {
    console.error('❌ Error initializing FCM:', error);
  }
};

/**
 * Set background message handler (must be at root level, not inside component)
 * This handles notifications when app is in background/quit state
 * Note: Background notifications are automatically displayed by Android/iOS
 */
export const setBackgroundMessageHandler = () => {
  if (messaging) {
    try {
      messaging().setBackgroundMessageHandler(async (remoteMessage: { notification: { title: any; body: any; }; data: any; messageId?: string }) => {
        try {
          console.log('📬 Background FCM message received:', JSON.stringify(remoteMessage, null, 2));
          console.log('📬 Has Notification Object:', !!remoteMessage.notification);
          // If message contains notification object, OS will attempt to display it.
          // We'll attempt to capture location (if permissions already granted) and send to server.

          // Check stored user consent for background location
          const { getLocationPermissionGranted } = await import('./storage');
          const userConsented = await getLocationPermissionGranted().catch(() => false);
          if (!userConsented) {
            console.log('ℹ️ User did not consent to background location; skipping.');
            return Promise.resolve();
          }

          // Check permissions (cannot prompt in background)
          if (Platform.OS === 'android') {
            const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            const needBg = Platform.Version >= 29;
            const hasBg = needBg ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION) : true;
            if (!hasFine || !hasBg) {
              console.warn('⚠️ Missing location permissions for background location. Skipping location send.');
              return Promise.resolve();
            }
          }

          // Try to get a single location fix
          const loc: any = await new Promise(resolve => {
            Geolocation.getCurrentPosition(
              (              position: { coords: unknown; }) => resolve(position.coords),
              (              error: any) => {
                console.warn('⚠️ getCurrentPosition error in background:', error);
                resolve(null);
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
          });

          if (loc && typeof sendLocation === 'function') {
            await sendLocation({
              latitude: loc.latitude,
              longitude: loc.longitude,
              messageId: remoteMessage.messageId,
              data: remoteMessage.data || {},
            });
            console.log('📤 Sent background location to server');
          } else {
            console.warn('⚠️ Could not obtain location or sendLocation not available');
          }
        } catch (err) {
          console.error('❌ Error in background handler:', err);
        }
        return Promise.resolve();
      });
      console.log('✅ Background message handler registered');
    } catch (error) {
      console.error('❌ Error setting background message handler:', error);
    }
  } else {
    console.warn('⚠️ Cannot set background handler - messaging not available');
  }
};

/**
 * Check if device supports FCM
 */
export const checkFCMSupport = async (): Promise<boolean> => {
  if (!messaging) {
    console.error('❌ Firebase Messaging not available');
    return false;
  }

  try {
    // Try to get token to verify FCM is working
    const token = await messaging().getToken();
    if (token) {
      console.log('✅ FCM is supported and working');
      console.log('📱 Token (first 30 chars):', token.substring(0, 30) + '...');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('❌ FCM support check failed:', error.message);
    if (error.message?.includes('PLAY_SERVICES')) {
      console.error('⚠️ Google Play Services is required for FCM on Android!');
      console.error('⚠️ Make sure your emulator has Google Play Services installed');
    }
    return false;
  }
};

