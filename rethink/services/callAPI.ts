import { ToastAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiConnector } from "./apiConnector";
import { AxiosError } from "axios";

interface CallApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  saveUser?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  user?: T;
  data?: T;
}

/**
 * Show toast message (cross-platform)
 */
function showToast(message: string, isError = false) {
  if (Platform.OS === "android") {
    ToastAndroid.showWithGravity(
      message,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM
    );
  } else {
    // iOS: you can use a library like react-native-toast-message or Alert
    console.log(isError ? "Error:" : "Success:", message);
  }
}

export async function callApi<T = unknown>({
  method = "GET",
  url,
  body,
  headers,
  params,
  saveUser = false,
  showSuccessToast = false,
  showErrorToast = true,
}: CallApiOptions): Promise<ApiResponse<T>> {
  try {
    const response = await apiConnector(method, url, body, headers, params);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    if (saveUser && response.data.user) {
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }

    if (response.data.message && showSuccessToast) {
      showToast(response.data.message);
    }

    return response.data;
  } catch (error: unknown) {
    let message = "Something went wrong.";

    if (error && (error as AxiosError).isAxiosError) {
      const axiosError = error as AxiosError<{ message?: string }>;
      message =
        axiosError.response?.data?.message || axiosError.message || message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    if (showErrorToast) {
      showToast(message, true);
    }

    throw error;
  }
}
