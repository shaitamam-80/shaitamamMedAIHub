/**
 * MedAI Hub - API Client (Base)
 * Axios instance with Supabase auth interceptor
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { supabase } from "../supabase";

// API URL: Use environment variable, or default to production HTTPS
let API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.shaitamam.com";

// FIX: Force HTTPS for production domain to prevent Mixed Content errors
if (
  API_BASE_URL.includes("shaitamam.com") &&
  API_BASE_URL.startsWith("http://")
) {
  API_BASE_URL = API_BASE_URL.replace("http://", "https://");
}

// Create axios instance
export const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor: automatically inject Supabase access token
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch (error) {
      // If auth fails, continue without token (for public endpoints)
      console.warn("Failed to get auth session:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors consistently
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "An error occurred";
    return Promise.reject(new Error(message));
  }
);

export default client;
