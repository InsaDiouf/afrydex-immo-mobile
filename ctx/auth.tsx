import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setSessionExpiredHandler } from '@/lib/api';

type UserType = 'admin' | 'manager' | 'landlord' | 'tenant' | 'employe' | 'accountant';

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  organization?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  mustChangePassword: boolean;
  tempPassword: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearMustChangePassword: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;
      const { data } = await api.get('/auth/me/');
      setUser(data);
      const flag = await SecureStore.getItemAsync('must_change_password');
      setMustChangePassword(flag === 'true');
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('must_change_password');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // Quand le refresh échoue, l'intercepteur a déjà purgé les tokens : on remet
  // l'état à zéro pour que RootNavigator renvoie l'utilisateur vers le login.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setMustChangePassword(false);
      setTempPassword(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login/', { username: email, password });
    await SecureStore.setItemAsync('access_token', data.tokens.access);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refresh);
    if (data.must_change_password) {
      await SecureStore.setItemAsync('must_change_password', 'true');
      setMustChangePassword(true);
      setTempPassword(password);
    } else {
      await SecureStore.deleteItemAsync('must_change_password');
      setMustChangePassword(false);
      setTempPassword(null);
    }
    const me = await api.get('/auth/me/');
    setUser(me.data);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('must_change_password');
    setUser(null);
    setMustChangePassword(false);
    setTempPassword(null);
  };

  const clearMustChangePassword = async () => {
    await SecureStore.deleteItemAsync('must_change_password');
    setMustChangePassword(false);
    setTempPassword(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, mustChangePassword, tempPassword, signIn, signOut, clearMustChangePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
