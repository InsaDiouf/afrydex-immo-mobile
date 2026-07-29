import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Tile, Seg, Ic, DetailHeader, money } from '@/components/agence/ui';

interface SummaryGroup {
  id: number | null;
  label: string;
  total: number;
  nombre: number;
}
interface SummaryResponse {
  group_by: string;
  total_general: number;
  groupes: SummaryGroup[];
}

const GROUP_LABELS: Record<string, string> = {
  'Par bâtiment': 'residence',
  'Par occupant': 'occupant',
};

export default function ExpensesScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [seg, setSeg] = useState('Par bâtiment');
  const groupBy = GROUP_LABELS[seg];

  const { data, isLoading } = useQuery<SummaryResponse>({
    queryKey: ['expenses-summary', groupBy],
    queryFn: async () => {
      const { data } = await api.get(`/expenses/summary/?group_by=${groupBy}`);
      return data;
    },
  });

  const groupes = data?.groupes ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Dépenses" onBack={() => router.back()} />

      <FlatList
        data={groupes}
        keyExtractor={(item, i) => `${item.id ?? 'na'}-${i}`}
        ListHeaderComponent={
          <View style={{ padding: 20, paddingTop: 6 }}>
            {/* Hero card — total général */}
            <View style={{ borderRadius: 22, padding: 18, backgroundColor: t.heroFrom, ...(t.shadow as any) }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>Total des dépenses</Text>
              <Text style={{ fontWeight: '700', fontSize: 30, color: '#fff', letterSpacing: -0.8, marginTop: 6 }}>
                {money(data?.total_general ?? 0)}
              </Text>
            </View>

            {/* Regroupement */}
            <View style={{ marginTop: 18, marginBottom: 6 }}>
              <Seg t={t} items={['Par bâtiment', 'Par occupant']} active={seg} onSelect={setSeg} />
            </View>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
            <Tile t={t} name={groupBy === 'residence' ? 'building' : 'user'} tone="accent" size={42} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }} numberOfLines={1}>{item.label}</Text>
              <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>{item.nombre} dépense{item.nombre > 1 ? 's' : ''}</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{money(item.total)}</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucune dépense enregistrée</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}
