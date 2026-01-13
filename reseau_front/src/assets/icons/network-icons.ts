// Icônes SVG pour les équipements réseau - paths uniquement pour JointJS
export const networkIconPaths: Record<string, string> = {
  // Router - globe avec flèches
  router: `M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z`,

  // Switch - grille de ports
  switch: `M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4zM2 4h2v16H2zm18 0h2v16h-2z`,

  // Access Point - ondes WiFi
  access: `M12 6c3.33 0 6.33 1.33 8.53 3.47l1.42-1.42C19.53 5.66 15.93 4 12 4s-7.53 1.66-9.95 4.05l1.42 1.42C5.67 7.33 8.67 6 12 6zm0 4c2.21 0 4.21.89 5.66 2.34l1.42-1.42C17.32 9.16 14.79 8 12 8s-5.32 1.16-7.08 2.92l1.42 1.42C7.79 10.89 9.79 10 12 10zm0 4c1.1 0 2.1.45 2.83 1.17l1.41-1.41C15.03 12.55 13.58 12 12 12s-3.03.55-4.24 1.76l1.41 1.41C9.9 14.45 10.9 14 12 14zm0 4c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z`,

  // Server - rack serveur
  server: `M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h16v4H4v-4zm2-9h2v2H6V7zm0 6h2v2H6v-2zm0 6h2v2H6v-2z`,

  // Computer - écran PC
  computer: `M20 3H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h6v2H8v2h8v-2h-2v-2h6c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12H4V5h16v10z`,

  // Firewall - bouclier
  firewall: `M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z`,

  // Printer - imprimante
  printer: `M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z`,

  // Camera - caméra de surveillance
  camera: `M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z`,

  // Phone - téléphone IP
  phone: `M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z`,

  // Storage - disque dur/NAS
  storage: `M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z`,

  // Default - cube générique
  default: `M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zm14 0v-6.7l-6 3.37v6.71l6-3.38z`,
};

// Couleurs par type d'équipement
export const networkIconColors: Record<string, { bg: string; border: string; icon: string }> = {
  router: { bg: '#dbeafe', border: '#3b82f6', icon: '#1d4ed8' },
  switch: { bg: '#f3e8ff', border: '#a855f7', icon: '#7c3aed' },
  access: { bg: '#dcfce7', border: '#22c55e', icon: '#16a34a' },
  server: { bg: '#f1f5f9', border: '#64748b', icon: '#334155' },
  computer: { bg: '#fef3c7', border: '#f59e0b', icon: '#d97706' },
  firewall: { bg: '#fee2e2', border: '#ef4444', icon: '#dc2626' },
  printer: { bg: '#e0e7ff', border: '#6366f1', icon: '#4f46e5' },
  camera: { bg: '#fce7f3', border: '#ec4899', icon: '#db2777' },
  phone: { bg: '#ccfbf1', border: '#14b8a6', icon: '#0d9488' },
  storage: { bg: '#fef9c3', border: '#eab308', icon: '#ca8a04' },
  default: { bg: '#f3f4f6', border: '#9ca3af', icon: '#6b7280' },
};
