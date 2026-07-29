import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme, Theme } from '@/lib/theme';
import { api } from '@/lib/api';
import { useAuth } from './auth';

interface AgencyThemeContextValue {
  theme: Theme;
  accent: string;
  dark: boolean;
  toggleDark: () => void;
}

const DEFAULT_ACCENT = '#2563eb';

const AgencyThemeContext = createContext<AgencyThemeContextValue>({
  theme: buildTheme(false, DEFAULT_ACCENT),
  accent: DEFAULT_ACCENT,
  dark: false,
  toggleDark: () => {},
});

export function AgencyThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [darkOverride, setDarkOverride] = useState<boolean | null>(null);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const { user } = useAuth();

  const dark = darkOverride !== null ? darkOverride : scheme === 'dark';

  const fetchAccent = useCallback(async () => {
    if (!user?.organization) return;
    try {
      const { data } = await api.get(`/organizations/${user.organization}/`);
      const color: string | undefined = data?.couleur_principale || data?.primary_color || data?.accent_color;
      if (color && /^#[0-9a-fA-F]{6}$/.test(color)) {
        setAccent(color);
      }
    } catch {
      // keep default
    }
  }, [user?.organization]);

  useEffect(() => { fetchAccent(); }, [fetchAccent]);

  return (
    <AgencyThemeContext.Provider value={{
      theme: buildTheme(dark, accent),
      accent,
      dark,
      toggleDark: () => setDarkOverride(d => d === null ? !dark : !d),
    }}>
      {children}
    </AgencyThemeContext.Provider>
  );
}

export function useAgencyTheme() {
  return useContext(AgencyThemeContext);
}
