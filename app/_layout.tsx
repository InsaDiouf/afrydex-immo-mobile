import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/ctx/auth';
import '../global.css';

const queryClient = new QueryClient();

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      // Redirect to the correct portal based on role
      if (user.role === 'admin' || user.role === 'manager' || user.role === 'accountant') {
        router.replace('/(agence)');
      } else if (user.role === 'proprietaire') {
        router.replace('/(bailleur)');
      } else if (user.role === 'locataire') {
        router.replace('/(locataire)');
      } else if (user.role === 'employe') {
        router.replace('/(employe)');
      }
    }
  }, [user, loading, segments]);

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
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
