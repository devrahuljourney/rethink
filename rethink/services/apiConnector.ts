import axios, { AxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "access_token";

export const axiosInstance = axios.create({
  withCredentials: true,
});

// Android's cookie store doesn't reliably keep the session cookie, so send the token explicitly
axiosInstance.interceptors.request.use(async (config) => {
  // Login/signup issue a fresh token, so never send a stale one with them
  const isAuthEntry = /\/auth\/(login|signup)$/.test(config.url || "");
  const token = isAuthEntry ? null : await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Drop a token the server rejects (expired, or 431 = too large) so it can't block the next login
axiosInstance.interceptors.response.use(undefined, async (error) => {
  const status = error?.response?.status;
  if (status === 401 || status === 431) {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
  return Promise.reject(error);
});

export const apiConnector = (
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
  params?: Record<string, unknown>
) => {
  const config: AxiosRequestConfig = {
    method,
    url,
    data: body || undefined,
    headers: headers || undefined,
    params: params || undefined,
  };

  return axiosInstance(config);
};
