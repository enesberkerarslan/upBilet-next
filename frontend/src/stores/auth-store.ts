import { create } from "zustand";
import { persist } from "zustand/middleware";

function writeCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${name}=; path=/; max-age=0`;
    return;
  }
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

type AuthState = {
  token: string | null;
  userType: string | null;
  setToken: (token: string) => void;
  setUserType: (userType: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userType: null,
      setToken: (token) => {
        writeCookie("token", token);
        if (typeof localStorage !== "undefined") localStorage.setItem("token", token);
        set({ token });
      },
      setUserType: (userType) => {
        writeCookie("userType", userType);
        if (typeof localStorage !== "undefined") localStorage.setItem("userType", userType);
        set({ userType });
      },
      logout: () => {
        writeCookie("token", null);
        writeCookie("userType", null);
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("userType");
        }
        set({ token: null, userType: null });
      },
    }),
    {
      name: "upbilet-auth",
      partialize: (s) => ({ token: s.token, userType: s.userType }),
      onRehydrateStorage: () => (state) => {
        if (!state?.token || typeof document === "undefined") return;
        writeCookie("token", state.token);
        if (state.userType) writeCookie("userType", state.userType);
      },
    }
  )
);
