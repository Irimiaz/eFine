import axios, { AxiosInstance } from "axios";
import { Platform } from "react-native";

// Point this at your backend (10.0.2.2 for Android emulator, localhost for iOS)
const API_BASE =
  Platform.OS === "web" ? "http://localhost:3000" : "http://10.0.2.2:3000";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Helper to record duration globally
let jotaiSetDuration: ((duration: number) => void) | null = null;
export function setJotaiDbDurationSetter(setter: (duration: number) => void) {
  jotaiSetDuration = setter;
}

// ——— Response shapes —————————————————————————————————————————————

export interface SuccessResponse<T> {
  status: "success";
  data: T;
  message?: string;
}
export interface ErrorResponse {
  status: "error";
  data: null;
  message: string;
}

// ——— Union types for each endpoint —————————————————————————————————

export type GetResponse<T> = SuccessResponse<T[]> | ErrorResponse;

export type SetResponse =
  | SuccessResponse<{
      acknowledged: boolean;
      modifiedCount?: number;
      upsertedId?: any;
      upsertedCount?: number;
      matchedCount?: number;
      insertedId?: any;
    }>
  | ErrorResponse;

export type DeleteResponse =
  | SuccessResponse<{ acknowledged: boolean; deletedCount: number }>
  | ErrorResponse;

// ——— Core request sender ——————————————————————————————————————

async function sendRequest<Res>(body: Record<string, any>): Promise<Res> {
  try {
    const start = Date.now();
    // ⚠️ POST to /api explicitly
    const resp = await apiClient.post<Res>("/api", body);
    const duration = Date.now() - start;
    if (jotaiSetDuration) jotaiSetDuration(duration);
    console.log(`[DB REQUEST] Duration: ${duration} ms`, body);
    return resp.data;
  } catch (err: any) {
    // prefer structured error from server
    if (err.response?.data?.status === "error") {
      return err.response.data;
    }
    // fallback
    return { status: "error", message: "Internal server error" } as Res;
  }
}

// ——— API functions ——————————————————————————————————————————

type Query = Record<string, any>;
type Update = Record<string, any>;

/** GET */
export function getDataFromCollection<T = any>(
  collection: string,
  query: Query = {}
): Promise<GetResponse<T>> {
  return sendRequest<GetResponse<T>>({
    api: "getDataFromCollection",
    lang: "en",
    payload: { collection, params: { query } },
  });
}

/** SET (update or insert) */
export function setDataToCollection(
  collection: string,
  query: Query,
  update?: Update
): Promise<SetResponse> {
  const params: any = { query };
  if (update && Object.keys(update).length) params.update = update;
  return sendRequest<SetResponse>({
    api: "setDataToCollection",
    lang: "en",
    payload: { collection, params },
  });
}

/** DELETE */
export function deleteDataFromCollection(
  collection: string,
  query: Query
): Promise<DeleteResponse> {
  return sendRequest<DeleteResponse>({
    api: "deleteDataFromCollection",
    lang: "en",
    payload: { collection, params: { query } },
  });
}
