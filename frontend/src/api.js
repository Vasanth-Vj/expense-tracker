import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: apiBase,
});

