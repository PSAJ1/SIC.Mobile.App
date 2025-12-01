// API service for registration
import {Platform} from 'react-native';

/**
 * WHY localhost DOESN'T WORK IN REACT NATIVE:
 * 
 * 1. Android Emulator: localhost points to the emulator itself, NOT your computer
 *    Solution: Use '10.0.2.2' which is a special IP that maps to your host machine's localhost
 * 
 * 2. iOS Simulator: localhost SHOULD work, but sometimes has issues
 *    Solution: Use 'localhost' or '127.0.0.1'
 * 
 * 3. Physical Device: localhost points to the device itself, NOT your computer
 *    Solution: Use your computer's IP address (e.g., 'http://192.168.1.100:5008')
 *    Find your IP: Windows: ipconfig, Mac/Linux: ifconfig
 */

// Automatically selects the correct URL based on platform
const getApiBaseUrl = () => {
    return 'https://sic-api-e0gta9bjctd7b9db.canadacentral-01.azurewebsites.net';
};

const API_BASE_URL = getApiBaseUrl();

// ⚠️ IMPORTANT: Update this to match your actual API endpoint
// The server returned "Cannot POST /user/register" which means this route doesn't exist
// Common endpoint patterns:
//   '/register'           - Simple registration
//   '/api/register'        - With /api prefix
//   '/api/user/register'   - With /api/user prefix
//   '/users/register'      - With /users prefix
//   '/auth/register'       - Under auth routes
// 
// Check your backend server code to find the correct route!
const REGISTER_ENDPOINT = '/user/register'; // ⬅️ Change this to match your server route

// For Physical Device Testing: Replace with your computer's IP address
// Example: const API_BASE_URL = 'http://192.168.1.100:5008';
// To find your IP: 
//   Windows: Run "ipconfig" in CMD, look for "IPv4 Address"
//   Mac/Linux: Run "ifconfig" in Terminal, look for "inet"

interface RegisterResponse {
  id?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export const registerUser = async (
  email: string,
  fcmToken: string,
): Promise<RegisterResponse> => {
  const url = `${API_BASE_URL}${REGISTER_ENDPOINT}`;
  
  const requestBody = {
    email,
    fcmToken,
  };

  console.log('='.repeat(60));
  console.log('🌐 API REQUEST');
  console.log('Platform:', Platform.OS);
  console.log('Base URL:', API_BASE_URL);
  console.log('Full URL:', url);
  console.log('Endpoint:', REGISTER_ENDPOINT);
  console.log('Request body:', {
    email,
    fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'N/A',
  });
  console.log('='.repeat(60));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Registration failed with status ${response.status}`;
      
      console.error('❌ API ERROR');
      console.error('Status:', response.status);
      console.error('URL:', url);
      console.error('Message:', errorMessage);
      
      // Provide helpful error message for common issues
      let helpfulMessage = `Error ${response.status}: ${errorMessage}\n\n`;
      helpfulMessage += `URL: ${url}\n\n`;
      
      if (response.status === 404 || errorMessage.includes('Cannot POST')) {
        helpfulMessage += `❌ Endpoint Not Found\n\n`;
        helpfulMessage += `Current endpoint: ${REGISTER_ENDPOINT}\n`;
        helpfulMessage += `Full URL: ${url}\n\n`;
        helpfulMessage += `The server doesn't have this route. Try these common endpoints:\n`;
        helpfulMessage += `  • /register\n`;
        helpfulMessage += `  • /api/register\n`;
        helpfulMessage += `  • /api/user/register\n`;
        helpfulMessage += `  • /users/register\n`;
        helpfulMessage += `  • /auth/register\n\n`;
        helpfulMessage += `To fix: Update REGISTER_ENDPOINT in src/services/api.ts\n`;
        helpfulMessage += `(currently set to: ${REGISTER_ENDPOINT})\n\n`;
        helpfulMessage += `Platform: ${Platform.OS}\n`;
        helpfulMessage += `Base URL: ${API_BASE_URL}\n`;
      } else if (response.status === 0 || errorMessage.includes('Network')) {
        helpfulMessage += `Network Error - Possible causes:\n`;
        helpfulMessage += `1. Server not running\n`;
        helpfulMessage += `2. Wrong URL for your platform\n`;
        if (Platform.OS === 'android') {
          helpfulMessage += `   Android MUST use: http://10.0.2.2:5008\n`;
        } else {
          helpfulMessage += `   iOS uses: http://localhost:5008\n`;
        }
        helpfulMessage += `3. Firewall blocking connection\n`;
        helpfulMessage += `4. CORS issue on server\n`;
      }
      
      throw new Error(helpfulMessage);
    }

    const data = await response.json();
    console.log('Success! Received data:', data);
    return data;
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error. Please check:\n1. Server is running on port 5008\n2. Endpoint path: ${REGISTER_ENDPOINT}\n3. Check console for details`);
  }
};

/**
 * Send location to backend
 * Update endpoint path as needed on your server
 */
export const sendLocation = async (payload: {
  latitude: number;
  longitude: number;
  messageId?: string;
  data?: any;
}): Promise<any> => {
  try {
    const url = `${API_BASE_URL}/location`;
    console.log('🌐 Sending location to', url, payload);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.text().catch(() => 'no body');
      throw new Error(`Location post failed: ${response.status} ${err}`);
    }
    const data = await response.json().catch(() => ({}));
    console.log('🌐 Location send response:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Error sending location to server:', error);
    throw error;
  }
};

