import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Linking, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api, uploadTravailMedia } from '@/lib/api';
import { Card, Badge, KV, Divider, Tile, Ic, DetailHeader, money, fmt } from '@/components/agence/ui';

/* ─── Types ──────────────────────────────────────────────────────── */
interface ChecklistItem { id: number; description: string; is_completed: boolean; }
interface TravailMedia {
  id: number;
  type_media: string;
  fichier_url?: string | null;
  fichier?: string | null;
  description?: string;
}
interface Travail {
  id: number;
  numero_travail: string;
  titre: string;
  description?: string;
  nature: string;
  type_travail: string;
  priorite: string;
  statut: string;
  appartement?: number;
  appartement_nom?: string;
  residence?: number;
  residence_nom?: string;
  assigne_a?: number | null;
  assigne_a_nom?: string | null;
  signale_par_nom?: string | null;
  cree_par_nom?: string | null;
  date_prevue?: string | null;
  recurrence?: string;
  cout_estime?: string | null;
  cout_total_materiel?: number | null;
  est_en_retard?: boolean;
  checklist_items?: ChecklistItem[];
  medias?: TravailMedia[];
  created_at: string;
}

const PHOTO_TYPES: { key: string; label: string }[] = [
  { key: 'photo_avant', label: 'Avant' },
  { key: 'photo_apres', label: 'Après' },
  { key: 'photo_probleme', label: 'Problème' },
  { key: 'facture', label: 'Justificatif' },
];

/* ─── Static maps ────────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  signale: 'Signalé', planifie: 'Planifié', assigne: 'Assigné',
  en_cours: 'En cours', en_attente_materiel: 'Attente matériel',
  termine: 'Terminé', valide: 'Validé', annule: 'Annulé',
};
const STATUS_TONE: Record<string, 'danger' | 'warn' | 'info' | 'success' | 'neutral'> = {
  signale: 'danger', planifie: 'info', assigne: 'info',
  en_cours: 'warn', en_attente_materiel: 'warn',
  termine: 'success', valide: 'success', annule: 'neutral',
};
const PRIO_TONE: Record<string, 'neutral' | 'info' | 'warn' | 'danger'> = {
  basse: 'neutral', normale: 'info', haute: 'warn', urgente: 'danger',
};
const PRIO_LABEL: Record<string, string> = {
  basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente',
};
const NATURE_LABEL: Record<string, string> = {
  reactif: 'Réactif', planifie: 'Planifié', preventif: 'Préventif', projet: 'Projet',
};
const TYPE_LABEL: Record<string, string> = {
  plomberie: 'Plomberie', electricite: 'Électricité', menuiserie: 'Menuiserie',
  peinture: 'Peinture', maconnerie: 'Maçonnerie', serrurerie: 'Serrurerie',
  climatisation: 'Climatisation', menage: 'Ménage', jardinage: 'Jardinage',
  vitrerie: 'Vitrerie', toiture: 'Toiture', securite: 'Sécurité', autre: 'Autre',
};
const TYPE_ICON: Record<string, string> = {
  plomberie: 'drop', electricite: 'bolt', peinture: 'paint',
  serrurerie: 'key', climatisation: 'building', maconnerie: 'hammer', menuiserie: 'hammer',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function typeIcon(type?: string) {
  return TYPE_ICON[type ?? ''] ?? 'wrench';
}

/* Status order for timeline */
const ORDER = ['signale', 'planifie', 'assigne', 'en_cours', 'en_attente_materiel', 'termine', 'valide', 'annule'];
function atLeast(current: string, target: string) {
  return ORDER.indexOf(current) >= ORDER.indexOf(target);
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function SectionTitle({ label, t }: { label: string; t: any }) {
  return (
    <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text,
      letterSpacing: -0.2, marginTop: 22, marginBottom: 11 }}>
      {label}
    </Text>
  );
}

function TimelineStep({ label, done, current, last, t }: {
  label: string; done: boolean; current?: boolean; last?: boolean; t: any;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11,
          backgroundColor: done ? t.accent : t.surface2,
          borderWidth: done ? 0 : 2, borderColor: t.border,
          alignItems: 'center', justifyContent: 'center' }}>
          {done && <Ic name="check" size={13} color="#fff" sw={3} />}
        </View>
        {!last && (
          <View style={{ width: 2, flex: 1, minHeight: 26,
            backgroundColor: done ? t.accent : t.border }} />
        )}
      </View>
      <View style={{ paddingBottom: last ? 0 : 16, flex: 1 }}>
        <Text style={{ fontWeight: current ? '700' : '600', fontSize: 14,
          color: done ? t.text : t.text3 }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function MaintenanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const { data: job, isLoading } = useQuery<Travail>({
    queryKey: ['maintenance-detail', id],
    queryFn: async () => { const { data } = await api.get(`/travaux/${id}/`); return data; },
  });

  // Envoie l'image sélectionnée puis rafraîchit la fiche.
  const sendPhoto = async (typeMedia: string, uri: string) => {
    try {
      setUploadingType(typeMedia);
      await uploadTravailMedia({ travail: Number(id), type_media: typeMedia, uri });
      await queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
    } catch (e) {
      Alert.alert('Erreur', "L'envoi de la photo a échoué. Réessaie.");
    } finally {
      setUploadingType(null);
    }
  };

  const takePhoto = async (typeMedia: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation requise', "Autorise l'accès à l'appareil photo pour photographier les travaux.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;
    await sendPhoto(typeMedia, result.assets[0].uri);
  };

  const pickPhoto = async (typeMedia: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Autorisation requise', "Autorise l'accès aux photos pour ajouter une image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || !result.assets?.length) return;
    await sendPhoto(typeMedia, result.assets[0].uri);
  };

  // Sur le chantier, la prise de vue directe est le cas d'usage principal ;
  // la galerie reste disponible pour les photos déjà prises.
  const addPhoto = (typeMedia: string) => {
    if (uploadingType) return;
    Alert.alert('Ajouter une photo', 'Choisis la source de l’image.', [
      { text: 'Prendre une photo', onPress: () => takePhoto(typeMedia) },
      { text: 'Choisir dans la galerie', onPress: () => pickPhoto(typeMedia) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Intervention" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Intervention" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.text2 }}>Travail introuvable</Text>
        </View>
      </View>
    );
  }

  const statut      = job.statut ?? '';
  const statusTone  = STATUS_TONE[statut] ?? 'info';
  const statusLabel = STATUS_LABELS[statut] ?? statut;
  const localisation = [job.appartement_nom, job.residence_nom].filter(Boolean).join(' · ') || '—';
  const recurrenceLabel = job.recurrence === 'aucune' || !job.recurrence ? 'Aucune' : job.recurrence;
  const checklist   = job.checklist_items ?? [];
  const checkDone   = checklist.filter(i => i.is_completed).length;

  /* Edit allowed: not assigned OR assigned but not yet started */
  const canEdit = !job.assigne_a || ['signale', 'planifie', 'assigne'].includes(statut);

  /* Timeline */
  const steps = [
    { label: 'Signalé',  done: true,                                         last: false },
    { label: 'Assigné',  done: !!job.assigne_a,                              last: false },
    { label: 'En cours', done: atLeast(statut, 'en_cours'),                  last: false },
    { label: 'Terminé',  done: ['termine', 'valide'].includes(statut),       last: true  },
  ];
  const currentStep = steps.findLastIndex(s => s.done);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader
        t={t}
        title={job.numero_travail ?? 'Intervention'}
        onBack={() => router.back()}
        right={
          canEdit ? (
            <TouchableOpacity activeOpacity={0.8}
              onPress={() => router.push(`/(agence)/maintenance-edit/${id}`)}
              style={{ width: 38, height: 38, borderRadius: 12,
                backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="pen" size={17} color={t.text} sw={1.8} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero card ─────────────────────────────────────────── */}
        <Card t={t} pad={16}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <Tile t={t} name={typeIcon(job.type_travail)} tone={statusTone} size={48} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '800', fontSize: 17, color: t.text,
                letterSpacing: -0.4, lineHeight: 22 }}>
                {job.titre}
              </Text>
              <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 3 }}>
                {localisation}
              </Text>
            </View>
          </View>

          {job.description ? (
            <Text style={{ fontSize: 13.5, color: t.text2, marginTop: 14,
              lineHeight: 20, paddingTop: 14,
              borderTopWidth: 1, borderTopColor: t.border }}>
              {job.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            <Badge t={t} tone={statusTone} dot={statusTone === 'warn'}>{statusLabel}</Badge>
            <Badge t={t} tone={PRIO_TONE[job.priorite] ?? 'info'}>
              {PRIO_LABEL[job.priorite] ?? job.priorite}
            </Badge>
            {job.est_en_retard && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7,
                backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <Ic name="alert" size={13} color="#ef4444" sw={2.2} />
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#ef4444' }}>En retard</Text>
              </View>
            )}
          </View>
        </Card>

        {/* ── Détails ───────────────────────────────────────────── */}
        <SectionTitle label="Détails" t={t} />
        <Card t={t} pad={0}>
          {[
            { k: 'Nature',          v: NATURE_LABEL[job.nature]      ?? job.nature      },
            { k: 'Type de travail', v: TYPE_LABEL[job.type_travail]   ?? job.type_travail },
            { k: 'Localisation',    v: localisation                                      },
            { k: 'Date prévue',     v: fmtDate(job.date_prevue)                          },
            { k: 'Récurrence',      v: recurrenceLabel                                   },
            job.signale_par_nom ? { k: 'Signalé par',  v: job.signale_par_nom } : null,
            job.cree_par_nom    ? { k: 'Créé par',     v: job.cree_par_nom    } : null,
            { k: 'Date création',   v: fmtDate(job.created_at)                           },
          ].filter(Boolean).map((item, i, arr) => {
            const { k, v } = item as { k: string; v: string };
            return (
              <View key={k} style={{ paddingHorizontal: 16, paddingVertical: 13,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.text3,
                  textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{k}</Text>
                <Text style={{ fontSize: 14, color: t.text, fontWeight: '500' }}>{v}</Text>
              </View>
            );
          })}
        </Card>

        {/* ── Assignation ───────────────────────────────────────── */}
        <SectionTitle label="Assignation" t={t} />
        <Card t={t} pad={16}>
          {job.assigne_a && job.assigne_a_nom ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23,
                backgroundColor: t.accentSoft,
                alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: t.accentText }}>
                  {job.assigne_a_nom.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{job.assigne_a_nom}</Text>
                <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }}>Employé assigné</Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23,
                backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Ic name="user" size={22} color={t.text3} sw={1.8} />
              </View>
              <View>
                <Text style={{ fontSize: 14, color: t.dangerText, fontWeight: '600' }}>
                  Aucun employé assigné
                </Text>
                {canEdit && (
                  <TouchableOpacity activeOpacity={0.7}
                    onPress={() => router.push(`/(agence)/maintenance-edit/${id}`)}>
                    <Text style={{ fontSize: 12.5, color: t.accentText, marginTop: 4, fontWeight: '600' }}>
                      Assigner maintenant →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </Card>

        {/* ── Coûts ─────────────────────────────────────────────── */}
        <SectionTitle label="Coûts" t={t} />
        <View style={{ flexDirection: 'row', gap: 11 }}>
          <Card t={t} pad={14} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.text3,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Estimé</Text>
            <Text style={{ fontWeight: '800', fontSize: 17, color: t.accentText, letterSpacing: -0.4 }}>
              {job.cout_estime ? fmt(parseFloat(job.cout_estime)) : '—'}
            </Text>
            {job.cout_estime && (
              <Text style={{ fontSize: 10.5, color: t.text3, marginTop: 2 }}>FCFA</Text>
            )}
          </Card>
          <Card t={t} pad={14} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.text3,
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Réel</Text>
            <Text style={{ fontWeight: '800', fontSize: 17,
              color: job.cout_total_materiel ? '#16a34a' : t.text3, letterSpacing: -0.4 }}>
              {job.cout_total_materiel ? fmt(job.cout_total_materiel) : '—'}
            </Text>
            {job.cout_total_materiel ? (
              <Text style={{ fontSize: 10.5, color: t.text3, marginTop: 2 }}>FCFA</Text>
            ) : null}
          </Card>
        </View>

        {/* ── Checklist ─────────────────────────────────────────── */}
        {checklist.length > 0 && (
          <>
            <SectionTitle label={`Checklist ${checkDone}/${checklist.length}`} t={t} />
            <Card t={t} pad={0}>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: t.surface2, borderRadius: 4,
                margin: 12, marginBottom: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', borderRadius: 4, backgroundColor: t.accent,
                  width: `${checklist.length > 0 ? (checkDone / checklist.length) * 100 : 0}%` }} />
              </View>
              {checklist.map((item, i) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start',
                  gap: 12, paddingHorizontal: 16, paddingVertical: 11,
                  borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.border }}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, marginTop: 1,
                    backgroundColor: item.is_completed ? t.accent : 'transparent',
                    borderWidth: item.is_completed ? 0 : 2, borderColor: t.border,
                    alignItems: 'center', justifyContent: 'center' }}>
                    {item.is_completed && <Ic name="check" size={12} color="#fff" sw={3} />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 20,
                    color: item.is_completed ? t.text3 : t.text,
                    textDecorationLine: item.is_completed ? 'line-through' : 'none' }}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* ── Photos (avant / après / problème) ─────────────────── */}
        <SectionTitle label="Photos" t={t} />
        <Card t={t} pad={16}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: (job.medias?.length ?? 0) > 0 ? 14 : 0 }}>
            {PHOTO_TYPES.map(pt => (
              <TouchableOpacity
                key={pt.key}
                activeOpacity={0.8}
                disabled={!!uploadingType}
                onPress={() => addPhoto(pt.key)}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 6,
                  backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, opacity: uploadingType ? 0.6 : 1 }}>
                {uploadingType === pt.key
                  ? <ActivityIndicator color={t.accent} />
                  : <Ic name="camera" size={20} color={t.accentText} sw={1.8} />}
                <Text style={{ fontSize: 12, fontWeight: '700', color: t.text2 }}>{pt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(job.medias?.length ?? 0) > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {job.medias!.filter(m => PHOTO_TYPES.some(p => p.key === m.type_media)).map(m => {
                const uri = m.fichier_url ?? m.fichier ?? undefined;
                const label = PHOTO_TYPES.find(p => p.key === m.type_media)?.label;
                return (
                  <View key={m.id} style={{ width: '31.5%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden',
                    backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border }}>
                    {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
                    {label ? (
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: 2,
                        backgroundColor: 'rgba(0,0,0,0.45)' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', textAlign: 'center' }}>{label}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ fontSize: 12.5, color: t.text3, marginTop: 12 }}>
              Aucune photo. Ajoute une photo avant/après ou du problème.
            </Text>
          )}
        </Card>

        {/* ── Suivi / Timeline ──────────────────────────────────── */}
        <SectionTitle label="Suivi" t={t} />
        <Card t={t} pad={16}>
          {steps.map((s, i) => (
            <TimelineStep key={s.label} t={t} label={s.label} done={s.done}
              current={i === currentStep} last={s.last} />
          ))}
        </Card>

        <View style={{ height: canEdit ? 16 : 32 }} />
      </ScrollView>

      {/* ── Sticky footer — edit action ───────────────────────── */}
      {canEdit && (
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
          borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
          <TouchableOpacity activeOpacity={0.85}
            onPress={() => router.push(`/(agence)/maintenance-edit/${id}`)}
            style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center',
              justifyContent: 'center', flexDirection: 'row', gap: 10,
              backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }}>
            <Ic name="pen" size={17} color={t.text} sw={2} />
            <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>
              Modifier le signalement
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
