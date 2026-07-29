import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { openDirections } from '@/lib/legal';
import {
  Card, Ic, Tile, Badge, KV, Row, Divider, Btn, DetailHeader,
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

/* ─── Timeline steps ─────────────────────────────────────────────── */
function buildSteps(statut: string, dates: any) {
  const done = (s: string) => ['complete', 'valide', 'en_cours', 'assigne', 'planifie', 'signale'].indexOf(statut) <=
    ['complete', 'valide', 'en_cours', 'assigne', 'planifie', 'signale'].indexOf(s)
      ? false
      : true;
  const isEnCours = statut === 'en_cours';
  const isComplete = ['complete', 'valide'].includes(statut);

  return [
    { label: 'Tâche reçue', sub: dates.created ?? 'Reçue', done: true, active: false },
    { label: 'Assigné', sub: statut !== 'signale' ? 'Confirmé' : 'En attente', done: statut !== 'signale', active: false },
    { label: 'Intervention démarrée', sub: isEnCours ? 'En cours' : isComplete ? 'Démarrée' : 'En attente', done: isEnCours || isComplete, active: isEnCours },
    { label: 'Terminée', sub: isComplete ? 'Complété' : 'En attente', done: isComplete, active: false },
  ];
}

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployeTaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const submittingRef = useRef(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['employe-task', id],
    queryFn: async () => { const { data } = await api.get(`/travaux/${id}/`); return data; },
    enabled: !!id,
  });

  const startMutation = useMutation({
    mutationFn: async () => { await api.post(`/employee-dashboard/${id}/start_work/`); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employe-task', id] });
      qc.invalidateQueries({ queryKey: ['employe-dashboard'] });
      qc.invalidateQueries({ queryKey: ['employe-tasks'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => { await api.patch(`/travaux/${id}/`, { statut: 'complete' }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employe-task', id] });
      qc.invalidateQueries({ queryKey: ['employe-dashboard'] });
      qc.invalidateQueries({ queryKey: ['employe-tasks'] });
    },
  });

  if (isLoading || !job) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Tâche" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  const statut: string = job.statut ?? 'signale';
  const priorite: string = job.priorite ?? 'normale';
  const tone = statusTone(statut);
  const canStart = ['signale', 'planifie', 'assigne'].includes(statut);
  const canComplete = statut === 'en_cours';
  const isDone = ['complete', 'valide'].includes(statut);

  const location = [job.appartement_nom, job.residence_nom].filter(Boolean).join(' · ') || job.bien_nom || '—';
  const steps = buildSteps(statut, { created: job.date_creation ? new Date(job.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }) : null });

  const checklist: any[] = Array.isArray(job.checklist) ? job.checklist : [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader
        t={t}
        title="Tâche"
        onBack={() => router.back()}
        right={
          job.contact_phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${job.contact_phone}`)} activeOpacity={0.7}>
              <Ic name="phone" size={20} color={t.accentText} sw={1.9} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ─────────────────────────────────────────── */}
        <Card t={t}>
          <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
            <Tile t={t} name={jobIcon(job.type_travail ?? '')} tone={priorite === 'urgente' ? 'danger' : tone} size={48} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text, letterSpacing: -0.3 }} numberOfLines={2}>
                {job.titre}
              </Text>
              <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }} numberOfLines={1}>
                {[job.type_travail, location].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Badge t={t} tone={tone} dot={statut === 'en_cours'}>{statusLabel(statut)}</Badge>
            {priorite === 'urgente' && <Badge t={t} tone="danger">Urgent</Badge>}
            {priorite === 'haute' && <Badge t={t} tone="warn">Haute priorité</Badge>}
            {job.est_en_retard && <Badge t={t} tone="danger">En retard</Badge>}
          </View>

          {job.description ? (
            <Text style={{ fontSize: 13.5, color: t.text2, marginTop: 14, lineHeight: 21 }}>
              {job.description}
            </Text>
          ) : null}
        </Card>

        {/* ── Lieu + horaire ────────────────────────────────────── */}
        <Card t={t} pad={14}>
          <Row
            t={t}
            tile="mapPin"
            tone="accent"
            title={location}
            sub={job.adresse ?? job.appartement_nom ?? undefined}
            right={
              job.latitude && job.longitude ? (
                <TouchableOpacity
                  onPress={() => openDirections(job.latitude!, job.longitude!)}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                    backgroundColor: t.accentSoft, flexDirection: 'row', alignItems: 'center', gap: 5,
                  }}
                >
                  <Ic name="pin2" size={13} color={t.accentText} sw={2} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: t.accentText }}>Itinéraire</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />

          {job.date_prevue && (
            <>
              <Divider t={t} m={12} />
              <KV t={t} k="Date prévue" v={new Date(job.date_prevue).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} />
            </>
          )}

          {job.contact_nom && (
            <KV t={t} k="Contact" v={job.contact_nom} last />
          )}
        </Card>

        {/* ── Checklist / Matériel ─────────────────────────────── */}
        {checklist.length > 0 && (
          <>
            <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2, marginHorizontal: 2 }}>
              Matériel requis
            </Text>
            <Card t={t} pad={14}>
              {checklist.map((item: any, i: number) => (
                <View key={i}>
                  {i > 0 && <Divider t={t} m={12} />}
                  <Row
                    t={t}
                    tile="wrench"
                    tone={item.checked ? 'success' : 'neutral'}
                    title={item.label ?? item.texte ?? `Item ${i + 1}`}
                    sub={item.checked ? 'Fait' : 'À faire'}
                    right={item.checked
                      ? <Ic name="check" size={16} color={t.successText} sw={2.4} />
                      : undefined
                    }
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={() => router.push('/(employe)/(tabs)/purchases' as any)}
                activeOpacity={0.8}
                style={{
                  marginTop: 14, borderRadius: 11, paddingVertical: 10,
                  alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'row', gap: 7,
                  backgroundColor: t.accentSoft,
                }}
              >
                <Ic name="cart" size={14} color={t.accentText} sw={2} />
                <Text style={{ fontWeight: '700', fontSize: 13, color: t.accentText }}>Demander du matériel</Text>
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* ── Timeline / Suivi ─────────────────────────────────── */}
        <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2, marginHorizontal: 2 }}>
          Suivi
        </Text>
        <Card t={t}>
          {steps.map((step, i) => (
            <View key={step.label} style={{ flexDirection: 'row', gap: 14 }}>
              {/* dot + connector */}
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: step.done ? t.accent : t.surface2,
                  borderWidth: step.done ? 0 : 2, borderColor: t.border,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.done && <Ic name="check" size={13} color="#fff" sw={3} />}
                  {!step.done && step.active && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent }} />
                  )}
                </View>
                {i < steps.length - 1 && (
                  <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: step.done ? t.accent : t.border }} />
                )}
              </View>

              {/* text */}
              <View style={{ paddingBottom: i < steps.length - 1 ? 16 : 0, flex: 1 }}>
                <Text style={{ fontWeight: step.active ? '700' : '600', fontSize: 14, color: step.done || step.active ? t.text : t.text3 }}>
                  {step.label}
                </Text>
                <Text style={{ fontSize: 12, color: t.text3, marginTop: 2 }}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* ── Sticky footer CTA ────────────────────────────────────── */}
      {!isDone && (
        <View style={{
          paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
          borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg,
        }}>
          {canStart && (
            <TouchableOpacity
              onPress={() => { if (!submittingRef.current) { submittingRef.current = true; startMutation.mutate(undefined, { onSettled: () => { submittingRef.current = false; } }); } }}
              disabled={startMutation.isPending}
              activeOpacity={0.85}
              style={{
                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                justifyContent: 'center', flexDirection: 'row', gap: 8,
                backgroundColor: t.accent, opacity: startMutation.isPending ? 0.6 : 1,
              }}
            >
              {startMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ic name="arrowR" size={18} color="#fff" sw={2.2} />
                    <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>Démarrer l'intervention</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {canComplete && (
            <TouchableOpacity
              onPress={() => { if (!submittingRef.current) { submittingRef.current = true; completeMutation.mutate(undefined, { onSettled: () => { submittingRef.current = false; } }); } }}
              disabled={completeMutation.isPending}
              activeOpacity={0.85}
              style={{
                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                justifyContent: 'center', flexDirection: 'row', gap: 8,
                backgroundColor: t.success, opacity: completeMutation.isPending ? 0.6 : 1,
              }}
            >
              {completeMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ic name="check" size={18} color="#fff" sw={2.4} />
                    <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>Marquer comme terminée</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      {isDone && (
        <View style={{
          paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
          borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg,
          flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center',
        }}>
          <Ic name="check" size={18} color={t.successText} sw={2.4} />
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.successText }}>Intervention terminée</Text>
        </View>
      )}
    </View>
  );
}
