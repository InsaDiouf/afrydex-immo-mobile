import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/ctx/auth';
import { AgencyThemeProvider } from '@/ctx/agencyTheme';
import '../global.css';

// Connectivité souvent instable côté terrain : on retente les lectures et on
// garde les données un court moment plutôt que de rafraîchir à chaque focus.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

// Expo Router monte ce composant si le rendu d'une route lève : sans lui,
// un crash de rendu donne un écran blanc en production.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, color: '#0f172a', textAlign: 'center' }}>
        Une erreur est survenue
      </Text>
      <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21 }}>
        L'écran n'a pas pu s'afficher. Réessaie, et contacte le support si le problème persiste.
      </Text>
      {__DEV__ && (
        <Text style={{ fontSize: 12, color: '#b91c1c', textAlign: 'center' }}>{error.message}</Text>
      )}
      <TouchableOpacity
        onPress={() => retry()}
        activeOpacity={0.85}
        style={{ marginTop: 6, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 26 }}
      >
        <Text style={{ fontWeight: '800', fontSize: 14.5, color: '#fff' }}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

function portalRoute(userType: string) {
  if (userType === 'admin' || userType === 'manager' || userType === 'accountant') return '/(agence)';
  if (userType === 'landlord') return '/(bailleur)';
  if (userType === 'tenant') return '/(locataire)';
  if (userType === 'employe') return '/(employe)';
  return '/(agence)';
}

function RootNavigator() {
  const { user, loading, mustChangePassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inChangePassword = inAuthGroup && segments[1] === 'change-password';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && mustChangePassword && !inChangePassword) {
      router.replace('/(auth)/change-password');
      return;
    }

    // Un utilisateur connecté peut légitimement ouvrir change-password depuis ses
    // paramètres : seul le reste du groupe (auth) le renvoie vers son portail.
    if (user && !mustChangePassword && inAuthGroup && !inChangePassword) {
      router.replace(portalRoute(user.user_type) as any);
    }
  }, [user, loading, mustChangePassword, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(agence)" />
      <Stack.Screen name="(bailleur)" />
      <Stack.Screen name="(locataire)" />
      <Stack.Screen name="(employe)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AgencyThemeProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </AgencyThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
