import axios, { AxiosError } from "axios";

const TOKEN_KEY = "transitops_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as { error?: string; code?: string; details?: unknown };
    return {
      code: data.code ?? "UNKNOWN",
      message: data.error ?? "Something went wrong.",
      status: err.response.status,
      details: data.details,
    };
  }
  return { code: "NETWORK", message: "Cannot reach the server. Is the API running?" };
}

const client = axios.create({ baseURL: "/api" });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** GET that unwraps the `{ success, data }` envelope. Throws ApiError. */
export async function apiGet<T>(url: string): Promise<T> {
  try {
    const res = await client.get<{ data: T }>(url);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST that unwraps the `{ success, data }` envelope. Throws ApiError. */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  try {
    const res = await client.post<{ data: T }>(url, body);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** PUT that unwraps the `{ success, data }` envelope. Throws ApiError. */
export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  try {
    const res = await client.put<{ data: T }>(url, body);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** DELETE that unwraps the `{ success, data }` envelope. Throws ApiError. */
export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const res = await client.delete<{ data: T }>(url);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}
