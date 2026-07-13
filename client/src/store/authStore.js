import { create } from "zustand";

export const useAuthStore = create((set) => {
  // Doc status ban dau tu localStorage neu co de giu phien dang nhap
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isProfileOpen: false,
    isChangePasswordOpen: false,

    login: (userData, token) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      set({ user: userData, token });
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({
        user: null,
        token: null,
        isProfileOpen: false,
        isChangePasswordOpen: false,
      });
    },

    setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
    setChangePasswordOpen: (isOpen) => set({ isChangePasswordOpen: isOpen }),
  };
});
