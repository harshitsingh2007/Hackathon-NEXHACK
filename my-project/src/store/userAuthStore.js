import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  signup: async (formData) => {
    try {
      set({ loading: true, error: null });
      const res = await axios.post(`${API_URL}/signup`, formData);
      set({ loading: false });
      return res.data;
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || "Signup failed.",
      });
    }
  },
  login: async (credentials) => {
  try {
    set({ loading: true, error: null });
    const res = await axios.post(`${API_URL}/login`, credentials);
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    set({ user, token, loading: false });
    return { success: true, user, token };
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Login failed.";
    set({ loading: false, error: errorMsg });
    return { success: false, error: errorMsg }; // ⚡ return consistent object
  }
},
  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
