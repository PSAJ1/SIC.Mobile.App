/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import {setBackgroundMessageHandler} from './src/services/fcm';

// Register background message handler (must be called before App registration)
setBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);
