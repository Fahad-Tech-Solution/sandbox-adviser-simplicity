import axios from "axios";
import { appStore } from "../store/jotaiStore";
import { loggedInUser } from "../store/authState";

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || "";

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const session = appStore.get(loggedInUser);
  const token = session?.token || "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export default http;
