import axios, { AxiosRequestConfig } from "axios";

export const axiosInstance = axios.create({
  withCredentials: true,
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
