import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Btn, Ic, DetailHeader, fmt } from '@/components/agence/ui';

interface PurchaseRequest {
  id: number;
  description: string;
  categorie?: string;
  lieu?: string;
  demandeur_nom?: string;
  montant: number;
  statut: string;
}

interface Overview { results?: PurchaseRequest[]; en_attente?: number; approuvés?: number; total_mois?: number; }

function statusBadge(t: any, statut: string) {
  const map: Record<string, 'warn' | 'success' | 'danger'> = {
    'en attente': 'warn', 'en_attente': 'warn',
    'approuvé': 'success', 'approuve': 'success',
    'refusé': 'danger', 'refuse': 'danger',
  };
  const tone = map[statut?.toLowerCase()] ?? 'neutral' as any;
  const label = statut?.charAt(0).toUpperCase() + statut?.slice(1);
  return <Badge t={t} tone={tone}>{label}</Badge>;
}

export default function PurchaseRequestsScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['purchase-requests'],
    queryFn: async () => { const { data } = await api.get('/purchase-requests/'); return data; },
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.patch(`/purchase-requests/${id}/`, { statut: 'approuvé' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });
  const refuse = useMutation({
    mutationFn: (id: number) => api.patch(`/purchase-requests/${id}/`, { statut: 'refusé' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-requests'] }),
  });

  const requests = data?.results ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Les demandes sont créées par les employés depuis leur portail :
          l'agence les approuve ou les refuse. */}
      <DetailHeader t={t} title="Demandes d'achat" onBack={() => router.back()} />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={{ padding: 20, paddingTop: 6 }}>
            {/* Summary */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {([
                ['En attente', String(data?.en_attente ?? 0), t.warnText],
                ['Approuvés',  String(data?.approuvés ?? 0), t.accentText],
                ['Ce mois',    data?.total_mois ? `${Math.round(data.total_mois / 1000)}k` : '—', t.text],
              ] as [string, string, string][]).map(([label, val, color]) => (
                <Card key={label} t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', fontSize: 19, color, letterSpacing: -0.5 }}>{val}</Text>
                  <Text style={{ fontSize: 11, color: t.text2, marginTop: 3 }}>{label}</Text>
                </Card>
              ))}
            </View>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const pending = item.statut?.toLowerCase().includes('attente');
          const sub = [item.categorie && `${item.categorie} · ${item.lieu ?? ''}`, `par ${item.demandeur_nom ?? '?'}`].filter(Boolean).join(' · ');
          return (
            <Card t={t} pad={14} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, letterSpacing: -0.2 }}>{item.description}</Text>
                  <Text style={{ fontSize: 12, color: t.text2, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{Number(item.montant).toLocaleString('fr-FR')}</Text>
              </View>
              {pending ? (
                <View style={{ flexDirection: 'row', gap: 9, marginTop: 13 }}>
                  <Btn t={t} full kind="dangerSoft" size="sm" icon="x" onPress={() => refuse.mutate(item.id)}>Refuser</Btn>
                  <Btn t={t} full kind="primary" size="sm" icon="check" onPress={() => approve.mutate(item.id)}>Approuver</Btn>
                </View>
              ) : (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
                  {statusBadge(t, item.statut)}
                </View>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucune demande</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}
