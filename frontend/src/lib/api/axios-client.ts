"use client";

import axios from "axios";
import { getUserApiBaseBrowser } from "@/lib/env";
import { currentLocaleFromPathname, localizedPath } from "@/lib/locale-path";
import { useAuthStore } from "@/stores/auth-store";

export const userApi = axios.create({
  baseURL: getUserApiBaseBrowser().replace(/\/$/, ""),
});

userApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    const v = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    config.headers.Authorization = v;
  }
  return config;
});

userApi.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url ?? "";
    const isLogin = url.includes("/login");
    if (
      !isLogin &&
      (error.response?.data?.error === "Geçersiz token" ||
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.message === "Token bulunamadı")
    ) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        const loc = currentLocaleFromPathname(window.location.pathname);
        window.location.href = localizedPath(loc, "/");
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (body: { email: string; password: string }) =>
    userApi.post<{ success: boolean; data?: { token: string; member?: { role?: string } }; error?: string }>(
      "/login",
      body
    ),
  register: (body: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    password: string;
  }) =>
    userApi.post<{ success: boolean; token?: string; member?: { role?: string }; error?: string }>(
      "/register",
      body
    ),
  forgotPassword: (body: { email: string }) =>
    userApi.post<{ success: boolean; message?: string; error?: string; resetToken?: string }>(
      "/forgot-password",
      body
    ),
  resetPassword: (token: string, body: { password: string }) =>
    userApi.post<{ success: boolean; token?: string; error?: string }>(
      `/reset-password/${encodeURIComponent(token)}`,
      body
    ),
};
