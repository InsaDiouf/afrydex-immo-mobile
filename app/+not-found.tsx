import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { Tile, Ic } from '@/components/agence/ui';

export default function NotFoundScreen() {
  const router = useRouter();
  const { theme: t } = useAgencyTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable', headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
        <Tile t={t} name="alert" tone="warn" size={56} />
        <Text style={{ fontWeight: '700', fontSize: 18, color: t.text, textAlign: 'center' }}>
          Page introuvable
        </Text>
        <Text style={{ fontSize: 14, color: t.text2, textAlign: 'center', lineHeight: 21 }}>
          Cette page n'existe pas ou n'est plus accessible.
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={{
            marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: t.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 22,
          }}
        >
          <Ic name="chevL" size={17} color="#fff" sw={2.2} />
          <Text style={{ fontWeight: '800', fontSize: 14.5, color: '#fff' }}>Revenir</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
