const env = import.meta.env;

export const OSM = {
  webBase: (env.VITE_OSM_WEB_BASE ?? 'https://www.openstreetmap.org').replace(/\/$/, ''),
  apiBase: (env.VITE_OSM_API_BASE ?? 'https://api.openstreetmap.org').replace(/\/$/, ''),
  clientId: env.VITE_OSM_CLIENT_ID ?? '',
  redirectUri: env.VITE_OSM_REDIRECT_URI ?? `${window.location.origin}/oauth/callback`,
  scopes: 'read_prefs write_api',
  changesetCreatedBy: 'panopti.ca',
} as const;
