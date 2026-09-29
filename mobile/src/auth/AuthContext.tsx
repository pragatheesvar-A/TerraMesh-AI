/**
 * Auth context — session persistence via Keychain (secure storage).
 * Backend remains the role authority.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Keychain from 'react-native-keychain';
import { auth } from '../api/client';

interface User {
  email: string;
  role: string;
  name?: string;
  authMode?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await auth.getToken();
        if (token) {
          // Try to restore user info from Keychain metadata
          const creds = await Keychain.getGenericPassword({ service: 'terramesh' });
          if (creds) {
            try {
              const meta = JSON.parse(creds.username || '{}');
              setUser({
                email: meta.email || 'unknown',
                role: meta.role || 'VIEWER',
                name: meta.name,
                authMode: meta.authMode,
              });
            } catch {
              setUser({ email: 'restored', role: 'VIEWER' });
            }
          }
        }
      } catch {
        // No session
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await auth.login(email, password);
      const u: User = {
        email: result.user?.email || email,
        role: result.user?.role || 'VIEWER',
        name: result.user?.name,
        authMode: result.auth_mode,
      };
      setUser(u);
      // Store user metadata alongside the token
      await Keychain.setGenericPassword(JSON.stringify(u), result.token, {
        service: 'terramesh',
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
