import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import {
  Card, Ic, Avatar, Tile, Row, Divider,
  IconBtn, initials, STATUS_BAR_H, ErrorState,
} from '@/components/agence/ui';

/* ─── Helpers ────────────────────────────────────────────────────── */
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTH_NAMES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function todayLabel(): string {
  const d = new Date();
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

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

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployeDashboard() {
  const { user } = useAuth();
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: dashData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['employe-dashboard'],
    queryFn: async () => { const { data } = await api.get('/employee-dashboard/'); return data; },
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => { await api.post(`/employee-dashboard/${id}/start_work/`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employe-dashboard'] }); },
  });

  const todayWork: any[] = dashData?.today_work ?? [];
  const stats = dashData?.stats ?? {};

  const done = stats.total_completed_today ?? 0;
  const total = todayWork.length || 1;
  const pct = Math.round((done / total) * 100);

  const urgentCount = todayWork.filter((j: any) => j.priorite === 'urgente').length;

  const nextJob = todayWork.find((j: any) => !['complete', 'valide', 'annule'].includes(j.statut));

  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '—';
  const userInitials = initials(fullName);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={{
        paddingTop: STATUS_BAR_H, paddingHorizontal: 20, paddingBottom: 12,
        backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <Avatar t={t} initials={userInitials} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 12.5, color: t.text2 }}>Portail Employé</Text>
          <Text style={{ fontWeight: '700', fontSize: 19, color: t.text, letterSpacing: -0.3 }} numberOfLines={1}>{fullName}</Text>
        </View>
        <IconBtn t={t} name="settings" onPress={() => router.push('/(employe)/settings')} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
      >
        {isLoading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : isError ? (
          <ErrorState t={t} onRetry={refetch} />
        ) : (
          <>
            {/* ── Hero ─────────────────────────────────────────── */}
            <LinearGradient
              colors={[t.heroFrom, t.heroTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20, overflow: 'hidden', marginTop: 4 }}
            >
              {/* Background icon */}
              <View style={{ position: 'absolute', right: -26, top: -34, opacity: 0.14 }}>
                <Ic name="wrench" size={150} color="#fff" sw={1.2} />
              </View>

              <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
                Aujourd'hui · {todayLabel()}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <Text style={{ fontWeight: '700', fontSize: 40, color: '#fff', letterSpacing: -1.2 }}>
                  {done}/{todayWork.length}
                </Text>
                <Text style={{ fontWeight: '600', fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>
                  tâches faites
                </Text>
              </View>

              <View style={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginTop: 14 }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: '#fff' }} />
              </View>

              {urgentCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
                  <Ic name="alert" size={15} color="#fff" sw={2} />
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                    {urgentCount} tâche{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''} à traiter en priorité
                  </Text>
                </View>
              )}
            </LinearGradient>

            {/* ── Stats ───────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                ['À faire',   String(stats.total_pending   ?? 0), t.accentText],
                ['En cours',  String(stats.total_in_progress ?? 0), t.warnText],
                ['Terminées', String(stats.total_completed_today ?? 0), t.successText],
              ].map(([label, val, color]) => (
                <Card key={label} t={t} pad={14} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', fontSize: 23, color, letterSpacing: -0.6 }}>{val}</Text>
                  <Text style={{ fontSize: 11.5, color: t.text2, marginTop: 3, textAlign: 'center' }}>{label}</Text>
                </Card>
              ))}
            </View>

            {/* ── Prochaine intervention ───────────────────────── */}
            {nextJob && (
              <>
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2, marginTop: 8, marginHorizontal: 2 }}>
                  Prochaine intervention
                </Text>

                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/(employe)/task/${nextJob.id}` as any)}>
                <Card t={t} pad={16}>
                  <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                    <Tile t={t} name={jobIcon(nextJob.type_travail ?? '')} tone={nextJob.priorite === 'urgente' ? 'danger' : 'warn'} size={50} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        <Text style={{ fontWeight: '700', fontSize: 15.5, color: t.text, letterSpacing: -0.2, flex: 1 }} numberOfLines={1}>
                          {nextJob.titre}
                        </Text>
                        {nextJob.priorite === 'urgente' && (
                          <View style={{ backgroundColor: t.dangerSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontWeight: '700', fontSize: 10, color: t.dangerText }}>Urgent</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 3 }} numberOfLines={1}>
                        {nextJob.appartement_nom ?? nextJob.residence_nom ?? nextJob.bien_nom ?? '—'}
                      </Text>
                    </View>
                  </View>

                  {nextJob.date_prevue && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
                      <Ic name="clock" size={15} color={t.text3} sw={1.9} />
                      <Text style={{ fontSize: 12.5, color: t.text2 }}>
                        {new Date(nextJob.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                      </Text>
                    </View>
                  )}

                  {['signale', 'planifie', 'assigne'].includes(nextJob.statut) && (
                    <TouchableOpacity
                      onPress={() => startMutation.mutate(nextJob.id)}
                      disabled={startMutation.isPending}
                      activeOpacity={0.82}
                      style={{
                        marginTop: 14, borderRadius: 12, paddingVertical: 12,
                        alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 8, backgroundColor: t.accent,
                        opacity: startMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <Ic name="arrowR" size={16} color="#fff" sw={2} />
                      <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Démarrer</Text>
                    </TouchableOpacity>
                  )}
                </Card>
                </TouchableOpacity>
              </>
            )}

            {/* ── Planning du jour ────────────────────────────── */}
            {todayWork.length > 0 && (
              <>
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2, marginHorizontal: 2 }}>
                  Planning du jour
                </Text>

                <Card t={t} pad={14}>
                  {todayWork.map((job: any, i: number) => (
                    <TouchableOpacity key={job.id} activeOpacity={0.7}
                      onPress={() => router.push(`/(employe)/task/${job.id}` as any)}>
                      {i > 0 && <Divider t={t} m={12} />}
                      <Row
                        t={t}
                        tile={jobIcon(job.type_travail ?? '')}
                        tone={statusTone(job.statut)}
                        title={job.titre}
                        sub={`${statusLabel(job.statut)}${job.date_prevue ? ' · ' + new Date(job.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}`}
                        right={
                          ['complete', 'valide'].includes(job.statut)
                            ? <Text style={{ fontSize: 12, color: t.successText }}>✓</Text>
                            : <Ic name="chevR" size={18} color={t.text3} sw={2} />
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </Card>
              </>
            )}

            {/* ── Empty state ──────────────────────────────────── */}
            {todayWork.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 48, gap: 14 }}>
                <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ic name="check" size={44} color={t.accentText} sw={2} />
                </View>
                <Text style={{ fontWeight: '700', fontSize: 19, color: t.text, letterSpacing: -0.3 }}>Journée libre</Text>
                <Text style={{ fontSize: 14, color: t.text2, textAlign: 'center', lineHeight: 22, maxWidth: 260 }}>
                  Aucune tâche prévue pour aujourd'hui. Les nouvelles interventions apparaîtront ici.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
