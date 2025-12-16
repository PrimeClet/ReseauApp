// src/api/axios.ts
import axios from 'axios';
import { store } from '@/store/store'; // ton Redux store

// Configuration de l'URL de base de l'API
// En développement, utiliser l'API locale Laravel sur le port 8000
// Forcer l'utilisation du port 8000 pour éviter les problèmes de configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Log pour déboguer
console.log('API Base URL:', API_BASE_URL);

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
  // Log pour déboguer les requêtes
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
}, error => Promise.reject(error));

// Intercepteur de réponse pour déboguer
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

export default api;
