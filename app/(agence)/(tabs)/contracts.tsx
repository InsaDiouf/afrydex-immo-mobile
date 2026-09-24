import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Avatar, Ic, Chips, TabHeader, initials, ErrorState } from '@/components/agence/ui';

interface Contract {
  id: number;
  numero_contrat: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  appartement_nom?: string;
  residence_nom?: string;
  statut: string;
  date_fin?: string;
  loyer_base: number;
}

function statusInfo(statut: string): { tone: 'success' | 'warn' | 'danger' | 'neutral'; label: string } {
  switch (statut?.toLowerCase()) {
    case 'actif':      return { tone: 'success', label: 'Actif' };
    case 'renouveler': return { tone: 'warn',    label: 'À renouveler' };
    case 'expiré':
    case 'expire':     return { tone: 'danger',  label: 'Expiré' };
    default:           return { tone: 'neutral',  label: statut ?? 'Brouillon' };
  }
}

const FILTERS = ['Tous', 'Actif', 'À renouveler', 'Expiré'];

export default function ContractsScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('Tous');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<{ results: Contract[]; count?: number }>({
    queryKey: ['contracts'],
    queryFn: async () => { const { data } = await api.get('/contracts/'); return data; },
  });

  const all = data?.results ?? [];
  const contracts = filter === 'Tous' ? all : all.filter(c => statusInfo(c.statut).label === filter);

  const kicker = `${data?.count ?? all.length} actifs · ${all.filter(c => statusInfo(c.statut).label === 'À renouveler').length} à renouveler`;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader t={t} title="Contrats" kicker={kicker} />

      {/* Chips filter */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chips t={t} items={FILTERS} active={filter} onSelect={setFilter} />
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : isError ? (
        <ErrorState t={t} onRetry={refetch} />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
          renderItem={({ item }) => {
            const { tone, label } = statusInfo(item.statut);
            const name = [item.locataire_prenom, item.locataire_nom].filter(Boolean).join(' ') || '—';
            const sub = [item.appartement_nom, item.residence_nom].filter(Boolean).join(' · ') || '—';
            return (
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/(agence)/contract/${item.id}`)}>
                <Card t={t} pad={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                    <Avatar t={t} initials={initials(name)} size={44} color={tone === 'danger' ? t.text3 : undefined} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2 }}>{name}</Text>
                      <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
                    </View>
                    <Ic name="chevR" size={18} color={t.text3} sw={2} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderTopColor: t.border }}>
                    <Badge t={t} tone={tone} dot={tone === 'success'}>{label}</Badge>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      {item.date_fin && (
                        <Text style={{ fontSize: 12, color: t.text2 }}>fin {new Date(item.date_fin).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}</Text>
                      )}
                      <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{Number(item.loyer_base).toLocaleString('fr-FR')}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ic name="contract" size={34} color={t.accentText} sw={1.7} />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text }}>Aucun contrat</Text>
              <Text style={{ fontSize: 14, color: t.text2, marginTop: 6 }}>Les contrats apparaîtront ici.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
