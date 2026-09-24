import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Tile, Ic, DetailHeader, KV, Divider, fmt } from '@/components/agence/ui';

/* ─── Types ──────────────────────────────────────────────────────── */
interface EmployeeDetail {
  id: number;
  user: number;
  user_nom: string;
  user_email: string;
  specialite: string;
  date_embauche?: string;
  salaire?: string | null;
  statut: string;
  telephone_professionnel?: string;
  niveau_competence?: string;
  note_moyenne?: string | null;
  is_available?: boolean;
  notes?: string;
  mot_de_passe_temporaire?: string;
  created_at: string;
}

interface Travail {
  id: number;
  numero_travail: string;
  titre: string;
  type_travail: string;
  statut: string;
  priorite: string;
  appartement_nom?: string;
  residence_nom?: string;
  date_prevue?: string;
}

/* ─── Static maps ────────────────────────────────────────────────── */
const SPECIALITE_LABEL: Record<string, string> = {
  technique: 'Technique', menage: 'Ménage', jardinage: 'Jardinage',
  peinture: 'Peinture', plomberie: 'Plomberie', electricite: 'Électricité',
  serrurerie: 'Serrurerie', climatisation: 'Climatisation', polyvalent: 'Polyvalent',
};
const SPECIALITE_ICON: Record<string, string> = {
  plomberie: 'drop', electricite: 'bolt', serrurerie: 'key',
  climatisation: 'building', peinture: 'paint', menuiserie: 'hammer',
};
const STATUT_LABEL: Record<string, string> = {
  actif: 'Actif', inactif: 'Inactif', conge: 'En congé',
  maladie: 'Arrêt maladie', suspendu: 'Suspendu',
};
const STATUT_TONE: Record<string, 'success' | 'neutral' | 'warn' | 'danger'> = {
  actif: 'success', inactif: 'neutral', conge: 'warn', maladie: 'warn', suspendu: 'danger',
};
const NIVEAU_LABEL: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert',
};
const WORK_TONE: Record<string, 'danger' | 'info' | 'warn' | 'success' | 'neutral'> = {
  signale: 'danger', planifie: 'info', assigne: 'info',
  en_cours: 'warn', en_attente_materiel: 'warn',
  termine: 'success', valide: 'success', complete: 'success', annule: 'neutral',
};
const WORK_STATUS_LABEL: Record<string, string> = {
  signale: 'Signalé', planifie: 'Planifié', assigne: 'Assigné',
  en_cours: 'En cours', en_attente_materiel: 'Attente mat.',
  termine: 'Terminé', valide: 'Validé', annule: 'Annulé',
};
const PRIO_TONE: Record<string, 'neutral' | 'info' | 'warn' | 'danger'> = {
  basse: 'neutral', normale: 'info', haute: 'warn', urgente: 'danger',
};

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function specIcon(s?: string) { return SPECIALITE_ICON[s ?? ''] ?? 'user'; }

function empInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function SectionTitle({ label, t }: { label: string; t: any }) {
  return (
    <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text,
      letterSpacing: -0.2, marginTop: 24, marginBottom: 11 }}>
      {label}
    </Text>
  );
}

function StatCard({ label, value, color, t }: { label: string; value: number; color: string; t: any }) {
  return (
    <Card t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontWeight: '800', fontSize: 22, color, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: t.text3, marginTop: 3, textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { data: emp, isLoading } = useQuery<EmployeeDetail>({
    queryKey: ['employee', id],
    queryFn: async () => { const { data } = await api.get(`/employees/${id}/`); return data; },
  });

  const { data: travauxRaw } = useQuery({
    queryKey: ['employee-travaux', emp?.user],
    queryFn: async () => { const { data } = await api.get(`/travaux/?assigne_a=${emp!.user}`); return data; },
    enabled: !!emp?.user,
  });

  const travaux: Travail[] = Array.isArray(travauxRaw) ? travauxRaw : (travauxRaw?.results ?? []);

  const stats = {
    assigne:  travaux.filter(w => ['assigne', 'planifie', 'signale'].includes(w.statut)).length,
    en_cours: travaux.filter(w => ['en_cours', 'en_attente_materiel'].includes(w.statut)).length,
    termine:  travaux.filter(w => ['termine', 'valide', 'complete'].includes(w.statut)).length,
    total:    travaux.length,
  };

  const handleShareCredentials = async () => {
    if (!emp) return;
    let msg = `Identifiants AfrydexImmo\n\nNom : ${emp.user_nom}\nEmail : ${emp.user_email}`;
    if (emp.mot_de_passe_temporaire) {
      msg += `\nMot de passe temporaire : ${emp.mot_de_passe_temporaire}\n\n⚠️ À changer dès la première connexion.`;
    }
    try { await Share.share({ message: msg }); } catch {}
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Employé" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  if (!emp) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Employé" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: t.text2 }}>Employé introuvable</Text>
        </View>
      </View>
    );
  }

  const statutTone  = STATUT_TONE[emp.statut]  ?? 'neutral';
  const statutLabel = STATUT_LABEL[emp.statut]  ?? emp.statut;
  const specLabel   = SPECIALITE_LABEL[emp.specialite] ?? emp.specialite;
  const niveauLabel = NIVEAU_LABEL[emp.niveau_competence ?? ''] ?? emp.niveau_competence ?? '—';
  const hasTempPassword = !!emp.mot_de_passe_temporaire;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title={emp.user_nom} onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <Card t={t} pad={20}>
          {/* Avatar + Name */}
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={{ width: 76, height: 76, borderRadius: 38,
              backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 28, color: '#fff', letterSpacing: -0.5 }}>
                {empInitials(emp.user_nom)}
              </Text>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontWeight: '800', fontSize: 19, color: t.text, letterSpacing: -0.5 }}>
                {emp.user_nom}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                  backgroundColor: t.surface2 }}>
                  <Ic name={specIcon(emp.specialite)} size={13} color={t.accentText} sw={2} />
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.accentText }}>{specLabel}</Text>
                </View>
                <Badge t={t} tone={statutTone} dot={statutTone === 'success'}>{statutLabel}</Badge>
              </View>
            </View>
          </View>

          {/* Note moyenne */}
          {emp.note_moyenne && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border }}>
              <Ic name="star" size={15} color="#f59e0b" sw={2} fill />
              <Text style={{ fontWeight: '800', fontSize: 15, color: '#f59e0b' }}>
                {parseFloat(emp.note_moyenne).toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12.5, color: t.text3 }}>/5</Text>
            </View>
          )}
        </Card>

        {/* ── Informations ─────────────────────────────────────── */}
        <SectionTitle label="Informations" t={t} />
        <Card t={t} pad={0}>
          {[
            { icon: 'mail',     label: 'Email',           value: emp.user_email },
            emp.telephone_professionnel
              ? { icon: 'phone',    label: 'Téléphone',       value: emp.telephone_professionnel }
              : null,
            { icon: 'calendar', label: "Date d'embauche",  value: fmtDate(emp.date_embauche) },
            emp.salaire
              ? { icon: 'coins',    label: 'Salaire mensuel', value: `${fmt(parseFloat(emp.salaire))} FCFA` }
              : null,
            { icon: 'star',     label: 'Niveau',           value: niveauLabel },
            { icon: 'check',    label: 'Disponible',       value: emp.is_available ? 'Oui' : 'Non' },
          ].filter(Boolean).map((item, i, arr) => {
            const { icon, label, value } = item as { icon: string; label: string; value: string };
            return (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center',
                gap: 14, paddingHorizontal: 16, paddingVertical: 13,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
                <View style={{ width: 34, height: 34, borderRadius: 10,
                  backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Ic name={icon} size={16} color={t.accentText} sw={1.9} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11.5, color: t.text3, fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 }}>
                    {label}
                  </Text>
                  <Text style={{ fontSize: 14, color: t.text, fontWeight: '500' }}>{value}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* ── Identifiants de connexion ─────────────────────────── */}
        <SectionTitle label="Identifiants de connexion" t={t} />
        <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1,
          borderColor: t.border, borderLeftWidth: 4, borderLeftColor: t.accent }}>
          <View style={{ backgroundColor: t.surface, padding: 16, gap: 12 }}>

            {/* Email row */}
            <View style={{ flexDirection: 'row', alignItems: 'center',
              backgroundColor: t.surface2, borderRadius: 11, padding: 12, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.text3,
                  textTransform: 'uppercase', letterSpacing: 0.5 }}>Email / Identifiant</Text>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: t.text,
                  marginTop: 3 }} numberOfLines={1}>{emp.user_email}</Text>
              </View>
            </View>

            {/* Temp password row */}
            {hasTempPassword ? (
              <View style={{ backgroundColor: 'rgba(245,158,11,0.1)',
                borderRadius: 11, padding: 12, borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.3)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center',
                  gap: 5, marginBottom: 6 }}>
                  <Ic name="alert" size={13} color="#f59e0b" sw={2} />
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#b45309',
                    textTransform: 'uppercase', letterSpacing: 0.5 }}>Mot de passe temporaire</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#92400e',
                    letterSpacing: showPassword ? 0 : 2 }}>
                    {showPassword ? emp.mot_de_passe_temporaire : '••••••••••'}
                  </Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPassword(v => !v)}
                    style={{ padding: 6 }}>
                    <Ic name={showPassword ? 'eye' : 'eye'} size={17} color="#b45309" sw={2} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: '#b45309', marginTop: 5 }}>
                  Effacé après la première connexion
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: t.surface2, borderRadius: 11, padding: 12 }}>
                <Ic name="check" size={16} color={t.accentText} sw={2.5} />
                <Text style={{ fontSize: 13, color: t.text2 }}>Mot de passe temporaire effacé</Text>
              </View>
            )}

            {/* Share button */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleShareCredentials}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, backgroundColor: t.accent, borderRadius: 11, paddingVertical: 11 }}>
              <Ic name="share" size={16} color="#fff" sw={2} />
              <Text style={{ fontWeight: '700', fontSize: 13.5, color: '#fff' }}>
                Partager les identifiants
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Statistiques travaux ──────────────────────────────── */}
        <SectionTitle label="Travaux assignés" t={t} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatCard label="Assigné"  value={stats.assigne}  color={t.infoText  ?? t.accentText} t={t} />
          <StatCard label="En cours" value={stats.en_cours} color={t.warnText}                  t={t} />
          <StatCard label="Terminé"  value={stats.termine}  color={t.accentText}                t={t} />
          <StatCard label="Total"    value={stats.total}    color={t.text}                      t={t} />
        </View>

        {/* ── Liste des travaux ──────────────────────────────────── */}
        {travaux.length > 0 ? (
          <Card t={t} pad={6} style={{ marginTop: 14 }}>
            {travaux.slice(0, 8).map((w, i) => {
              const wTone  = WORK_TONE[w.statut]        ?? 'info';
              const wLabel = WORK_STATUS_LABEL[w.statut] ?? w.statut;
              const pTone  = PRIO_TONE[w.priorite]      ?? 'info';
              const loc = [w.appartement_nom, w.residence_nom].filter(Boolean).join(' · ') || null;
              return (
                <TouchableOpacity key={w.id} activeOpacity={0.78}
                  onPress={() => router.push(`/(agence)/maintenance/${w.id}`)}
                  style={{ paddingHorizontal: 12, paddingVertical: 13,
                    borderBottomWidth: i < Math.min(travaux.length, 8) - 1 ? 1 : 0,
                    borderBottomColor: t.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}
                        numberOfLines={1}>{w.titre}</Text>
                      {loc && (
                        <View style={{ flexDirection: 'row', alignItems: 'center',
                          gap: 4, marginTop: 3 }}>
                          <Ic name="mapPin" size={11} color={t.text3} sw={2} />
                          <Text style={{ fontSize: 12, color: t.text2 }} numberOfLines={1}>{loc}</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 5 }}>
                      <Badge t={t} tone={wTone}>{wLabel}</Badge>
                      <Badge t={t} tone={pTone}>{w.priorite}</Badge>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {travaux.length > 8 && (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 12.5, color: t.accentText, fontWeight: '600' }}>
                  + {travaux.length - 8} travaux supplémentaires
                </Text>
              </View>
            )}
          </Card>
        ) : (
          <Card t={t} pad={20} style={{ marginTop: 14, alignItems: 'center', gap: 8 }}>
            <Ic name="wrench" size={28} color={t.text3} sw={1.5} />
            <Text style={{ fontSize: 14, color: t.text2, textAlign: 'center' }}>
              Aucun travail assigné à cet employé
            </Text>
          </Card>
        )}

        {/* Notes internes */}
        {emp.notes ? (
          <>
            <SectionTitle label="Notes internes" t={t} />
            <Card t={t} pad={14}>
              <Text style={{ fontSize: 13.5, color: t.text2, lineHeight: 20 }}>{emp.notes}</Text>
            </Card>
          </>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
