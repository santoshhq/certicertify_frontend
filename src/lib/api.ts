import axios, { AxiosError } from "axios";
import type { ApiErrorShape } from "../types";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const TOKEN_KEY = "certicertify_token";
export const SUPERADMIN_TOKEN_KEY = "certicertify_superadmin_token";
export const ADMIN_TOKEN_KEY = "certicertify_admin_token";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

function isSuperAdminUrl(url?: string) {
  return Boolean(url?.startsWith("/superadmin"));
}

function isAdminUrl(url?: string) {
  return Boolean(url?.startsWith("/admin"));
}

api.interceptors.request.use((config) => {
  const tokenKey = isSuperAdminUrl(config.url)
    ? SUPERADMIN_TOKEN_KEY
    : isAdminUrl(config.url)
      ? ADMIN_TOKEN_KEY
      : TOKEN_KEY;
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;
let onSuperAdminUnauthorized: (() => void) | null = null;
let onAdminUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setSuperAdminUnauthorizedHandler(handler: () => void) {
  onSuperAdminUnauthorized = handler;
}

export function setAdminUnauthorizedHandler(handler: () => void) {
  onAdminUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (isSuperAdminUrl(error.config?.url)) {
        onSuperAdminUnauthorized?.();
      } else if (isAdminUrl(error.config?.url)) {
        onAdminUnauthorized?.();
      } else {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined;
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => d.msg).join(", ");
    }
    if (error.message) return error.message;
  }
  return fallback;
}
