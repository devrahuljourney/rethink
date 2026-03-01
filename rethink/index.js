/**
 * @format
 */

import { AppRegistry } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import { syncYesterdayUsage } from './services/syncService';
import App from './App';
import { name as appName } from './app.json';

console.log('Index.js: Starting application registration');
console.log('Index.js: App Name is:', appName);

AppRegistry.registerComponent(appName, () => App);
AppRegistry.registerHeadlessTask('AppMonitorTask', () => require('./services/AppMonitorTask').default);

// Register BackgroundFetch HeadlessTask
const backgroundFetchHeadlessTask = async (event) => {
    console.log('[BackgroundFetch HeadlessTask] start:', event.taskId);
    await syncYesterdayUsage();
    BackgroundFetch.finish(event.taskId);
}
BackgroundFetch.registerHeadlessTask(backgroundFetchHeadlessTask);

console.log('Index.js: Component registered');
