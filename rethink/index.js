/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('Index.js: Starting application registration');
console.log('Index.js: App Name is:', appName);

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerHeadlessTask('AppMonitorTask', () => require('./services/AppMonitorTask').default);

console.log('Index.js: Component registered');
