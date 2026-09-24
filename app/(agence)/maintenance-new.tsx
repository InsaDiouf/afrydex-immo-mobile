import { useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { DetailHeader, Ic } from '@/components/agence/ui';

interface Residence  { id: number; nom: string; }
interface Appartement{ id: number; nom: string; residence_nom?: string; }
interface Employee   { id: number; user: number; user_nom: string; specialite?: string; }

/* ─── Static options ─────────────────────────────────────────────── */
const NATURES = [
  { value: 'reactif',   label: 'Réactif',   sub: 'Intervention urgente'  },
  { value: 'planifie',  label: 'Planifié',  sub: 'Tâche programmée'      },
  { value: 'preventif', label: 'Préventif', sub: 'Maintenance régulière' },
  { value: 'projet',    label: 'Projet',    sub: 'Travaux importants'    },
];

const TYPES = [
  { value: 'plomberie',     label: 'Plomberie'     },
  { value: 'electricite',   label: 'Électricité'   },
  { value: 'menuiserie',    label: 'Menuiserie'    },
  { value: 'peinture',      label: 'Peinture'      },
  { value: 'maconnerie',    label: 'Maçonnerie'    },
  { value: 'serrurerie',    label: 'Serrurerie'    },
  { value: 'climatisation', label: 'Climatisation' },
  { value: 'menage',        label: 'Ménage'        },
  { value: 'jardinage',     label: 'Jardinage'     },
  { value: 'vitrerie',      label: 'Vitrerie'      },
  { value: 'toiture',       label: 'Toiture'       },
  { value: 'securite',      label: 'Sécurité'      },
  { value: 'autre',         label: 'Autre'         },
];

const PRIORITES = [
  { value: 'basse',   label: 'Basse',   tone: '#6b7280' },
  { value: 'normale', label: 'Normale', tone: '#3b82f6' },
  { value: 'haute',   label: 'Haute',   tone: '#f59e0b' },
  { value: 'urgente', label: 'Urgente', tone: '#ef4444' },
];

const RECURRENCES = [
  { value: 'aucune',        label: 'Aucune'        },
  { value: 'quotidien',     label: 'Quotidien'     },
  { value: 'hebdomadaire',  label: 'Hebdomadaire'  },
  { value: 'mensuelle',     label: 'Mensuelle'     },
  { value: 'trimestrielle', label: 'Trimestrielle' },
  { value: 'annuelle',      label: 'Annuelle'      },
];

/* ─── Sub-components ─────────────────────────────────────────────── */
function SectionHeader({ icon, label, t }: { icon: string; label: string; t: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingTop: 22, marginTop: 4, borderTopWidth: 1, borderTopColor: t.border }}>
      <Ic name={icon} size={15} color={t.text3} sw={2} />
      <Text style={{ fontSize: 11, fontWeight: '800', color: t.text3,
        textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  );
}

function FieldLabel({ label, required, t }: { label: string; required?: boolean; t: any }) {
  return (
    <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.text2, marginBottom: 9 }}>
      {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
  );
}

function HChips({ items, active, onSelect, t }: {
  items: { value: string; label: string }[];
  active: string | null;
  onSelect: (v: string | null) => void;
  t: any;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}>
      {items.map(item => {
        const sel = active === item.value;
        return (
          <TouchableOpacity key={item.value} activeOpacity={0.7}
            onPress={() => onSelect(sel ? null : item.value)}
            style={{ borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8,
              borderColor: sel ? t.accent : t.border,
              backgroundColor: sel ? `${t.accent}18` : t.surface }}>
            <Text style={{ fontSize: 13, fontWeight: '600',
              color: sel ? t.accentText : t.text2 }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* ─── Main screen ────────────────────────────────────────────────── */
export default function MaintenanceNewScreen() {
  const router = useRouter();
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const submittingRef = useRef(false);

  const [titre,         setTitre]         = useState('');
  const [description,   setDescription]   = useState('');
  const [nature,        setNature]        = useState('reactif');
  const [typeTravail,   setTypeTravail]   = useState('autre');
  const [priorite,      setPriorite]      = useState('normale');
  const [appartementId, setAppartementId] = useState<number | null>(null);
  const [residenceId,   setResidenceId]   = useState<number | null>(null);
  const [assigneA,      setAssigneA]      = useState<number | null>(null);
  const [datePrevue,    setDatePrevue]    = useState('');
  const [recurrence,    setRecurrence]    = useState('aucune');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const { data: resRaw }  = useQuery({ queryKey: ['residences'],  queryFn: async () => { const { data } = await api.get('/residences/');  return data; } });
  const { data: aptRaw }  = useQuery({ queryKey: ['appartements'], queryFn: async () => { const { data } = await api.get('/appartements/'); return data; } });
  const { data: empRaw }  = useQuery({ queryKey: ['employees'],   queryFn: async () => { const { data } = await api.get('/employees/');   return data; } });

  const residences:   Residence[]   = Array.isArray(resRaw)  ? resRaw  : (resRaw?.results  ?? []);
  const appartements: Appartement[] = Array.isArray(aptRaw)  ? aptRaw  : (aptRaw?.results  ?? []);
  const employees:    Employee[]    = Array.isArray(empRaw)  ? empRaw  : (empRaw?.results  ?? []);

  const canSubmit = titre.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);
    try {
      let formattedDate: string | null = null;
      if (datePrevue.trim()) {
        formattedDate = datePrevue.includes('T') ? datePrevue : `${datePrevue}T09:00:00Z`;
      }
      await api.post('/travaux/', {
        titre:        titre.trim(),
        description:  description.trim(),
        nature,
        type_travail: typeTravail,
        priorite,
        appartement:  appartementId ?? null,
        residence:    appartementId ? null : (residenceId ?? null),
        assigne_a:    assigneA ?? null,
        date_prevue:  formattedDate,
        recurrence,
      });
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      router.back();
    } catch (err: any) {
      const d = err?.response?.data;
      setError(
        typeof d === 'string' ? d :
        d?.detail ?? d?.titre?.[0] ?? d?.non_field_errors?.[0] ?? 'Erreur lors de la création.'
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: t.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: t.text, backgroundColor: t.surface,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Nouveau signalement" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Error banner */}
        {error && (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        {/* ── Section 1 : Informations générales ─────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ic name="wrench" size={15} color={t.text3} sw={2} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.text3,
            textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Informations générales
          </Text>
        </View>

        <View>
          <FieldLabel label="Titre" required t={t} />
          <TextInput style={inputStyle} value={titre} onChangeText={setTitre}
            placeholder="Ex: Fuite d'eau salle de bain appt 3A"
            placeholderTextColor={t.text3} />
        </View>

        <View>
          <FieldLabel label="Description" required t={t} />
          <TextInput
            style={[inputStyle, { height: 88, textAlignVertical: 'top', paddingTop: 11 }]}
            value={description} onChangeText={setDescription}
            placeholder="Décrivez le problème en détail…"
            placeholderTextColor={t.text3} multiline />
        </View>

        {/* ── Section 2 : Type & Priorité ────────────────────────── */}
        <SectionHeader icon="settings" label="Type & Priorité" t={t} />

        <View>
          <FieldLabel label="Nature" required t={t} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {NATURES.map(n => {
              const sel = nature === n.value;
              return (
                <TouchableOpacity key={n.value} activeOpacity={0.7} onPress={() => setNature(n.value)}
                  style={{ flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1.5, padding: 11,
                    borderColor: sel ? t.accent : t.border,
                    backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                  <Text style={{ fontWeight: '700', fontSize: 13,
                    color: sel ? t.accentText : t.text }}>{n.label}</Text>
                  <Text style={{ fontSize: 11.5, color: t.text3, marginTop: 2 }}>{n.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <FieldLabel label="Type de travail" t={t} />
          <HChips items={TYPES} active={typeTravail}
            onSelect={v => setTypeTravail(v ?? 'autre')} t={t} />
        </View>

        <View>
          <FieldLabel label="Priorité" t={t} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PRIORITES.map(p => {
              const sel = priorite === p.value;
              return (
                <TouchableOpacity key={p.value} activeOpacity={0.7} onPress={() => setPriorite(p.value)}
                  style={{ flex: 1, borderRadius: 10, borderWidth: 1.5,
                    paddingVertical: 10, alignItems: 'center',
                    borderColor: sel ? p.tone : t.border,
                    backgroundColor: sel ? `${p.tone}18` : t.surface }}>
                  <Text style={{ fontWeight: '700', fontSize: 12.5,
                    color: sel ? p.tone : t.text2 }}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section 3 : Localisation ───────────────────────────── */}
        <SectionHeader icon="mapPin" label="Localisation" t={t} />

        {appartements.length > 0 && (
          <View>
            <FieldLabel label="Appartement" t={t} />
            <HChips
              items={appartements.map(a => ({
                value: String(a.id),
                label: a.residence_nom ? `${a.nom} · ${a.residence_nom}` : a.nom,
              }))}
              active={appartementId !== null ? String(appartementId) : null}
              onSelect={v => { setAppartementId(v ? Number(v) : null); if (v) setResidenceId(null); }}
              t={t}
            />
          </View>
        )}

        {!appartementId && residences.length > 0 && (
          <View>
            <FieldLabel label="Résidence" t={t} />
            <HChips
              items={residences.map(r => ({ value: String(r.id), label: r.nom }))}
              active={residenceId !== null ? String(residenceId) : null}
              onSelect={v => setResidenceId(v ? Number(v) : null)}
              t={t}
            />
          </View>
        )}

        {/* ── Section 4 : Planification & Assignation ─────────────── */}
        <SectionHeader icon="calendar" label="Planification & Assignation" t={t} />

        {/* Employee picker — always shown */}
        <View>
          <FieldLabel label="Assigner à un employé" t={t} />
          {employees.length === 0 ? (
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: t.border,
              backgroundColor: t.surface, padding: 14, flexDirection: 'row',
              alignItems: 'center', gap: 10 }}>
              <Ic name="user" size={18} color={t.text3} sw={1.8} />
              <Text style={{ fontSize: 13, color: t.text3 }}>Aucun employé disponible</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}>
              {/* "Plus tard" chip */}
              <TouchableOpacity activeOpacity={0.7} onPress={() => setAssigneA(null)}
                style={{ borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
                  paddingVertical: 10, alignItems: 'center', minWidth: 76,
                  borderColor: assigneA === null ? t.accent : t.border,
                  backgroundColor: assigneA === null ? `${t.accent}18` : t.surface }}>
                <Ic name="user" size={20}
                  color={assigneA === null ? t.accentText : t.text3} sw={1.8} />
                <Text style={{ fontSize: 11, fontWeight: '600', marginTop: 4,
                  color: assigneA === null ? t.accentText : t.text3 }}>Plus tard</Text>
              </TouchableOpacity>

              {employees.map(emp => {
                const sel = assigneA === emp.user;
                const initials = (emp.user_nom ?? '')
                  .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
                return (
                  <TouchableOpacity key={emp.id} activeOpacity={0.7}
                    onPress={() => setAssigneA(emp.user)}
                    style={{ borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14,
                      paddingVertical: 10, alignItems: 'center', minWidth: 88,
                      borderColor: sel ? t.accent : t.border,
                      backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18,
                      backgroundColor: sel ? t.accent : t.surface2,
                      alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '800', fontSize: 13,
                        color: sel ? '#fff' : t.text2 }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', marginTop: 5,
                      color: sel ? t.accentText : t.text }} numberOfLines={1}>
                      {emp.user_nom?.split(' ')[0] ?? '—'}
                    </Text>
                    {emp.specialite && (
                      <Text style={{ fontSize: 10, color: t.text3, marginTop: 1 }}
                        numberOfLines={1}>{emp.specialite}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Date prévue" t={t} />
            <TextInput style={inputStyle} value={datePrevue} onChangeText={setDatePrevue}
              placeholder="AAAA-MM-JJ" placeholderTextColor={t.text3}
              keyboardType="numeric" maxLength={10} />
          </View>

          <View style={{ flex: 1 }}>
            <FieldLabel label="Récurrence" t={t} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
              {RECURRENCES.map(r => {
                const sel = recurrence === r.value;
                return (
                  <TouchableOpacity key={r.value} activeOpacity={0.7}
                    onPress={() => setRecurrence(r.value)}
                    style={{ borderRadius: 10, borderWidth: 1.5,
                      paddingHorizontal: 12, paddingVertical: 9,
                      borderColor: sel ? t.accent : t.border,
                      backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                    <Text style={{ fontSize: 12, fontWeight: '600',
                      color: sel ? t.accentText : t.text2 }}>{r.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Sticky footer ─────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32,
        borderTopWidth: 1, borderTopColor: t.border, backgroundColor: t.bg }}>
        <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit || loading}
          activeOpacity={0.85}
          style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center',
            justifyContent: 'center', flexDirection: 'row', gap: 8,
            backgroundColor: canSubmit ? t.accent : t.border }}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff',
                letterSpacing: -0.2 }}>
                Créer le signalement
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
