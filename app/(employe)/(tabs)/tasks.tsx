import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import {
  Card, Ic, Tile, Badge, Chips, TabHeader, ErrorState,
} from '@/components/agence/ui';

/* ─── Helpers ────────────────────────────────────────────────────── */
function jobIcon(typeOrSpecialite: string): string {
  const map: Record<string, string> = {
    plomberie: 'drop',
    electricite: 'bolt',
    électricité: 'bolt',
    peinture: 'paint',
    serrurerie: 'key',
    climatisation: 'building',
    menuiserie: 'hammer',
    maconnerie: 'hammer',
    jardinage: 'mapPin',
    menage: 'check',
    ménage: 'check',
  };
  return map[(typeOrSpecialite ?? '').toLowerCase()] ?? 'wrench';
}

function statusTone(statut: string): 'success' | 'warn' | 'danger' | 'info' | 'neutral' {
  if (['complete', 'valide'].includes(statut)) return 'success';
  if (statut === 'en_cours') return 'warn';
  if (statut === 'annule') return 'neutral';
  return 'info';
}

function statusLabel(statut: string): string {
  const map: Record<string, string> = {
    signale: 'Signalé',
    planifie: 'Planifié',
    assigne: 'Assigné',
    en_cours: 'En cours',
    complete: 'Terminé',
    valide: 'Validé',
    annule: 'Annulé',
  };
  return map[statut] ?? statut;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isFuture(dateStr: string): boolean {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d.getTime() > now.getTime();
}

const FILTERS = ["Aujourd'hui", 'À faire', 'En cours', 'Terminé', 'Toutes'] as const;
type Filter = typeof FILTERS[number];

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployeTasks() {
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("Aujourd'hui");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['employe-tasks'],
    queryFn: async () => { const { data } = await api.get('/travaux/'); return data; },
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => { await api.post(`/employee-dashboard/${id}/start_work/`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employe-tasks'] }); },
  });

  const allTasks: any[] = Array.isArray(data) ? data : (data?.results ?? []);

  const displayed = (() => {
    if (filter === "Aujourd'hui") return allTasks.filter(t => t.date_prevue && isToday(t.date_prevue));
    if (filter === 'À faire') return allTasks.filter(t => ['signale', 'planifie', 'assigne'].includes(t.statut));
    if (filter === 'En cours') return allTasks.filter(t => t.statut === 'en_cours');
    if (filter === 'Terminé') return allTasks.filter(t => ['complete', 'valide'].includes(t.statut));
    return allTasks;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader t={t} title="Tâches" kicker="Mes interventions" />

      <FlatList
        data={displayed}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
        ListHeaderComponent={
          <View style={{ paddingBottom: 14 }}>
            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
              <Chips t={t} items={FILTERS as unknown as string[]} active={filter} onSelect={v => setFilter(v as Filter)} />
            </ScrollView>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const tone = statusTone(item.statut);
          const canStart = ['signale', 'planifie', 'assigne'].includes(item.statut);
          return (
            <TouchableOpacity activeOpacity={0.92} onPress={() => router.push(`/(employe)/task/${item.id}` as any)}>
            <Card t={t} pad={14}>
              {/* Top row: tile + title + urgent badge */}
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                <Tile t={t} name={jobIcon(item.type_travail ?? '')} tone={tone} size={46} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, letterSpacing: -0.2, flex: 1 }} numberOfLines={1}>
                      {item.titre}
                    </Text>
                    {item.priorite === 'urgente' && (
                      <View style={{ backgroundColor: t.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexShrink: 0 }}>
                        <Text style={{ fontWeight: '700', fontSize: 10, color: t.dangerText }}>Urgent</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12.3, color: t.text2, marginTop: 2 }} numberOfLines={1}>
                    {item.appartement_nom ?? item.residence_nom ?? item.bien_nom ?? '—'}
                  </Text>
                </View>
                <Ic name="chevR" size={18} color={t.text3} sw={2} />
              </View>

              {/* Bottom row: status badge + date/retard */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
                <Badge t={t} tone={tone} dot={item.statut === 'en_cours'}>
                  {statusLabel(item.statut)}
                </Badge>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {item.est_en_retard && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ic name="alert" size={12} color={t.dangerText} sw={2} />
                      <Text style={{ fontSize: 11, color: t.dangerText, fontWeight: '600' }}>Retard</Text>
                    </View>
                  )}
                  {item.date_prevue && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ic name="clock" size={14} color={t.text3} sw={1.9} />
                      <Text style={{ fontSize: 12, color: t.text2 }}>
                        {new Date(item.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Démarrer button */}
              {canStart && (
                <TouchableOpacity
                  onPress={() => startMutation.mutate(item.id)}
                  disabled={startMutation.isPending}
                  activeOpacity={0.82}
                  style={{
                    marginTop: 12, borderRadius: 11, paddingVertical: 10,
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', gap: 7,
                    backgroundColor: t.accent,
                    opacity: startMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Ic name="arrowR" size={14} color="#fff" sw={2} />
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#fff' }}>Démarrer</Text>
                </TouchableOpacity>
              )}
            </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator color={t.accent} />
            </View>
          ) : isError ? (
            <ErrorState t={t} onRetry={refetch} />
          ) : (
            <View style={{ paddingTop: 64, paddingHorizontal: 24, alignItems: 'center' }}>
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
                <Ic name="check" size={44} color={t.accentText} sw={2} />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 19, color: t.text, letterSpacing: -0.3 }}>Journée terminée</Text>
              <Text style={{ fontSize: 14, color: t.text2, marginTop: 8, lineHeight: 22, textAlign: 'center', maxWidth: 280 }}>
                {filter === 'Toutes'
                  ? 'Aucune tâche assignée pour le moment.'
                  : 'Aucune tâche dans cette catégorie.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
