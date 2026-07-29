import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Tile, Ic, Chips, TabHeader, ErrorState } from '@/components/agence/ui';

interface MaintenanceJob {
  id: number;
  titre: string;
  categorie?: string;
  appartement_nom?: string;
  residence_nom?: string;
  assigné_nom?: string;
  statut: string;
  priorite?: string;
}

function jobIcon(cat?: string): string {
  const map: Record<string, string> = {
    Plomberie: 'drop', Électricité: 'bolt', Peinture: 'paint',
    Serrurerie: 'key', Climatisation: 'building', Maçonnerie: 'hammer',
  };
  return map[cat ?? ''] ?? 'wrench';
}

function jobTone(statut: string): 'warn' | 'danger' | 'info' | 'success' {
  switch (statut?.toLowerCase()) {
    case 'en cours': case 'en_cours': return 'warn';
    case 'ouvert':                    return 'danger';
    case 'planifié': case 'planifie': return 'info';
    case 'résolu':  case 'resolu':   return 'success';
    default:                          return 'info';
  }
}

function jobLabel(statut: string): string {
  switch (statut?.toLowerCase()) {
    case 'en_cours':  return 'En cours';
    case 'planifie':  return 'Planifié';
    case 'resolu':    return 'Résolu';
    default: return statut ?? '—';
  }
}

const FILTERS = ['Tous', 'Urgent', 'Ouvert', 'En cours', 'Résolu'];

export default function MaintenanceScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('Tous');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<{ results: MaintenanceJob[]; ouvert?: number; en_cours?: number; resolu?: number }>({
    queryKey: ['maintenance'],
    queryFn: async () => { const { data } = await api.get('/travaux/'); return data; },
  });

  const all = data?.results ?? [];
  const jobs = filter === 'Tous' ? all
    : filter === 'Urgent' ? all.filter(j => j.priorite?.toLowerCase() === 'urgent')
    : all.filter(j => jobLabel(j.statut) === filter);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader t={t} title="Maintenance" kicker={`${data?.en_cours ?? 0} en cours`}
        right={
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(agence)/maintenance-new')}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', ...(t.shadow as any) }}>
            <Ic name="plus" size={22} color="#fff" sw={2.4} />
          </TouchableOpacity>
        }
      />

      {/* Summary mini-cards */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 }}>
        {([
          ['Ouvert',   String(data?.ouvert ?? 0),    t.dangerText],
          ['En cours', String(data?.en_cours ?? 0),  t.warnText],
          ['Résolu',   String(data?.resolu ?? 0),    t.accentText],
        ] as [string, string, string][]).map(([label, val, color]) => (
          <Card key={label} t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 21, color, letterSpacing: -0.5 }}>{val}</Text>
            <Text style={{ fontSize: 11.5, color: t.text2, marginTop: 3 }}>{label}</Text>
          </Card>
        ))}
      </View>

      {/* Chip filters */}
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
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
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
          renderItem={({ item }) => {
            const tone = jobTone(item.statut);
            const label = jobLabel(item.statut);
            const urgent = item.priorite?.toLowerCase() === 'urgent';
            const sub = [item.appartement_nom, item.residence_nom].filter(Boolean).join(' · ') || '—';
            return (
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/(agence)/maintenance/${item.id}`)}>
                <Card t={t} pad={14}>
                  <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                    <Tile t={t} name={jobIcon(item.categorie)} tone={tone} size={46} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, flex: 1 }} numberOfLines={1}>{item.titre}</Text>
                        {urgent && (
                          <View style={{ backgroundColor: t.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontWeight: '700', fontSize: 10, color: t.dangerText }}>Urgent</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12.3, color: t.text2, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
                    </View>
                    <Ic name="chevR" size={18} color={t.text3} sw={2} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
                    <Badge t={t} tone={tone} dot={tone === 'warn'}>{label}</Badge>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ic name="user" size={14} color={t.text3} sw={1.9} />
                      <Text style={{ fontSize: 12, color: item.assigné_nom ? t.text2 : t.dangerText }}>
                        {item.assigné_nom ?? 'Non assigné'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ic name="check" size={36} color={t.accentText} sw={2} />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text }}>Aucune intervention</Text>
              <Text style={{ fontSize: 14, color: t.text2, marginTop: 6, textAlign: 'center', maxWidth: 260 }}>
                Tout le parc est en bon état.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
