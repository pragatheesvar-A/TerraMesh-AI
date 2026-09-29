/**
 * TerraMesh AI — Environment configuration.
 * Never hardcode production secrets. Read from env vars or defaults.
 */

export type Env = 'development' | 'local' | 'production';

const env: Env = (process.env.EXPO_PUBLIC_ENV as Env) || 'development';

export const API_CONFIG = {
  development: {
    API_BASE_URL: 'http://10.0.2.2:8000', // Android emulator → host
    WS_BASE_URL: 'ws://10.0.2.2:8000/ws/live-monitoring',
  },
  local: {
    API_BASE_URL: 'http://localhost:8000',
    WS_BASE_URL: 'ws://localhost:8000/ws/live-monitoring',
  },
  production: {
    // Set via EXPO_PUBLIC_API_BASE_URL at build time
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.terramesh.example.in',
    WS_BASE_URL: process.env.EXPO_PUBLIC_WS_BASE_URL || 'wss://api.terramesh.example.in/ws/live-monitoring',
  },
}[env];

export const CURRENT_ENV = env;
