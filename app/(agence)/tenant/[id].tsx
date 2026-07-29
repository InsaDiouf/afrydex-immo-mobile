import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Tile, Ic, DetailHeader, money } from '@/components/agence/ui';

interface Facture {
  id: number;
  numero_facture: string;
  type_facture: string;
  montant_ttc: string | number;
  date_emission?: string | null;
  date_echeance?: string | null;
  statut: string;
  is_paid?: boolean;
  is_overdue?: boolean;
}
interface Historique {
  occupant: { id: number; nom_complet: string };
  total_du: number;
  total_paye: number;
  solde: number;
  nb_factures: number;
  factures: Facture[];
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TenantHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const { data, isLoading } = useQuery<Historique>({
    queryKey: ['tenant-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/tiers/${id}/historique-paiements/`);
      return data;
    },
  });

  const factures = data?.factures ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title={data?.occupant?.nom_complet ?? 'Occupant'} onBack={() => router.back()} />

      <FlatList
        data={factures}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={{ padding: 20, paddingTop: 6 }}>
            {/* Résumé */}
            <View style={{ borderRadius: 22, padding: 18, backgroundColor: t.heroFrom, ...(t.shadow as any) }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>Historique de paiement</Text>
              <Text style={{ fontWeight: '700', fontSize: 28, color: '#fff', letterSpacing: -0.6, marginTop: 6 }}>
                {money(data?.total_paye ?? 0)}<Text style={{ fontSize: 13, fontWeight: '600', opacity: 0.85 }}> payés</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 22, marginTop: 14 }}>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{money(data?.total_du ?? 0)}</Text>
                  <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}>facturé</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{money(data?.solde ?? 0)}</Text>
                  <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}>solde</Text>
                </View>
              </View>
            </View>

            <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, marginTop: 22, marginBottom: 4 }}>
              Factures ({data?.nb_factures ?? 0})
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const paid = !!item.is_paid;
          const overdue = !!item.is_overdue;
          const tone = paid ? 'success' as const : overdue ? 'danger' as const : 'warn' as const;
          const label = paid ? 'Payée' : overdue ? 'En retard' : 'En attente';
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Tile t={t} name={paid ? 'check' : 'alert'} tone={tone} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }} numberOfLines={1}>{item.numero_facture}</Text>
                <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>
                  {[item.type_facture, fmtDate(item.date_echeance)].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{money(Number(item.montant_ttc))}</Text>
                <View style={{ marginTop: 4 }}><Badge t={t} tone={tone}>{label}</Badge></View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucune facture pour cet occupant</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}
