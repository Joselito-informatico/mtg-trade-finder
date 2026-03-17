import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("mtg_token", data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
      },

      register: async (username, email, password, contactInfo = "") => {
        const { data } = await api.post("/auth/register", {
          username,
          email,
          password,
          contactInfo,
        });
        localStorage.setItem("mtg_token", data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("mtg_token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: async (contactInfo) => {
        const { data } = await api.put("/auth/profile", { contactInfo });
        set((s) => ({ user: { ...s.user, contactInfo: data.contactInfo } }));
      },
    }),
    {
      name: "mtg_auth",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
