import Config from 'react-native-config';

const API_VERSION = '/api/v1';
// Local dev server on the LAN, used when .env has no BASE_URL.
const IP_ADDRESS = "192.168.1.16:4000"
// Release builds set BASE_URL in .env to the deployed server, e.g. https://example.vercel.app
export const BASE_URL = `${Config.BASE_URL || `http://${IP_ADDRESS}`}${API_VERSION}`;

export const authEndpoints = {
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/signup`,
  logout: `${BASE_URL}/auth/logout`,
  profile: `${BASE_URL}/auth/profile`,
  update: `${BASE_URL}/auth/update`,
};

export const usageEndpoints = {
  sync: `${BASE_URL}/usage/sync`,
};

export const coachEndpoints = {
  insights: `${BASE_URL}/coach/insights`,
};
