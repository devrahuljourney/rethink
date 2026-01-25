const IP = "10.172.66.191";

const BASE_URL = `http://${IP}:4000/api/v1/`;

export const authEndpoints = {
  login: `${BASE_URL}auth/login`,
  register: `${BASE_URL}auth/signup`,
  logout: `${BASE_URL}auth/logout`,
  profile: `${BASE_URL}auth/profile`,
};
