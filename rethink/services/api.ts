import Config from 'react-native-config';

const API_VERSION = '/api/v1';

export const BASE_URL = `${Config.BASE_URL}${API_VERSION}`;
console.log(BASE_URL)

export const authEndpoints = {
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/signup`,
  logout: `${BASE_URL}/auth/logout`,
  profile: `${BASE_URL}/auth/profile`,
};
