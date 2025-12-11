// src/api/axios.ts
import axios from 'axios';
import { store } from '@/store/store'; // ton Redux store

// Configuration de l'URL de base de l'API
// En développement, utiliser l'API locale Laravel
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const state = store.getState();
  const token = state.user.token; // récupère le token depuis Redux
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

export default api;
