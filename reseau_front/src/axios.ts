// src/api/axios.ts
import axios from 'axios';
import { store } from '@/store/store'; // ton Redux store

// Configuration de l'URL de base de l'API
// Utilise la variable d'environnement VITE_API_URL ou fallback sur localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

// Intercepteur de réponse pour déboguer et gérer les erreurs d'authentification
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.message, error.config?.url);

    // Si erreur 401 (non authentifié), déconnecter l'utilisateur
    if (error.response?.status === 401) {
      const state = store.getState();
      // Seulement si l'utilisateur était connecté (et pas sur la route de login)
      if (state.user.token && !error.config?.url?.includes('/auth/login')) {
        // Import dynamique pour éviter les dépendances circulaires
        import('@/store/users').then(({ logout }) => {
          store.dispatch(logout());
          // Redirection vers la page de login
          window.location.href = '/login';
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
