// src/api/client.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { Platform } from "react-native";

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000" // Android emulator → your PC
    : "http://localhost:3000";

// Helper to record duration globally
let jotaiSetDuration: ((duration: number) => void) | null = null;
export function setJotaiDurationSetter(setter: (duration: number) => void) {
  jotaiSetDuration = setter;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    // example interceptor: attach auth token if you add one later
    this.client.interceptors.request.use((cfg) => {
      // const token = getAuthToken();
      // if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
  }

  // generic low-level request
  async request<T>(
    entity: string,
    params: Record<string, any>,
    lang: string = "en"
  ): Promise<T> {
    try {
      const start = Date.now();
      const { data } = await this.client.post<{
        data: T;
      }>("/api", {
        api: "customRequest",
        lang,
        payload: { entity, params },
      });
      const duration = Date.now() - start;
      if (jotaiSetDuration) jotaiSetDuration(duration);
      console.log(`[CUSTOM REQUEST] Duration: ${duration} ms`, {
        entity,
        params,
      });
      // Log the average request time after each request
      if (typeof window !== "undefined") {
        // Only works in React context, so this is a placeholder for the hook usage
      }
      return data.data;
    } catch (err) {
      // re-throw for your hooks/components to catch
      throw err as AxiosError;
    }
  }
}

// singleton instance
export const apiClient = new ApiClient();
