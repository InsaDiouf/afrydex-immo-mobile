import { useRef, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { DetailHeader, Ic } from '@/components/agence/ui';

/* ─── Static options ─────────────────────────────────────────────── */
const SPECIALITES = [
  { value: 'technique',     label: 'Technique',     icon: 'wrench'   },
  { value: 'plomberie',     label: 'Plomberie',     icon: 'drop'     },
  { value: 'electricite',   label: 'Électricité',   icon: 'bolt'     },
  { value: 'serrurerie',    label: 'Serrurerie',    icon: 'key'      },
  { value: 'climatisation', label: 'Climatisation', icon: 'building' },
  { value: 'peinture',      label: 'Peinture',      icon: 'paint'    },
  { value: 'menuiserie',    label: 'Menuiserie',    icon: 'hammer'   },
  { value: 'menage',        label: 'Ménage',        icon: 'check'    },
  { value: 'jardinage',     label: 'Jardinage',     icon: 'mapPin'   },
  { value: 'polyvalent',    label: 'Polyvalent',    icon: 'star'     },
];

const NIVEAUX = [
  { value: 'debutant',      label: 'Débutant'      },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance',        label: 'Avancé'        },
  { value: 'expert',        label: 'Expert'        },
];

const STATUTS = [
  { value: 'actif',    label: 'Actif'          },
  { value: 'inactif',  label: 'Inactif'        },
  { value: 'conge',    label: 'En congé'       },
  { value: 'maladie',  label: 'Arrêt maladie'  },
  { value: 'suspendu', label: 'Suspendu'       },
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

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployeeNewScreen() {
  const router = useRouter();
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const submittingRef = useRef(false);

  const today = new Date().toISOString().split('T')[0];

  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [specialite,  setSpecialite]  = useState('technique');
  const [dateEmbauche,setDateEmbauche]= useState(today);
  const [salaire,     setSalaire]     = useState('');
  const [niveau,      setNiveau]      = useState('intermediaire');
  const [statut,      setStatut]      = useState('actif');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length  > 0 &&
    email.trim().length     > 0 &&
    phone.trim().length     > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setLoading(true);
    try {
      await api.post('/employees/', {
        first_name:        firstName.trim(),
        last_name:         lastName.trim(),
        email:             email.trim().toLowerCase(),
        phone:             phone.trim(),
        specialite,
        date_embauche:     dateEmbauche,
        salaire:           salaire.trim() || undefined,
        niveau_competence: niveau,
        statut,
      });
      qc.invalidateQueries({ queryKey: ['employees'] });
      router.back();
    } catch (err: any) {
      const d = err?.response?.data;
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d).map(([k, v]) =>
          k === 'detail' ? String(v) : `${k} : ${Array.isArray(v) ? v.join(', ') : v}`
        );
        setError(msgs.join('\n'));
      } else {
        setError(typeof d === 'string' ? d : "Erreur lors de la création.");
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: t.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: t.text, backgroundColor: t.surface,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Nouvel employé" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Error */}
        {error && (
          <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14 }}>
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600', lineHeight: 20 }}>
              {error}
            </Text>
          </View>
        )}

        {/* ── Section 1 : Informations personnelles ──────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ic name="user" size={15} color={t.text3} sw={2} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: t.text3,
            textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Informations personnelles
          </Text>
        </View>

        {/* Prénom + Nom on same row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Prénom" required t={t} />
            <TextInput style={inputStyle} value={firstName} onChangeText={setFirstName}
              placeholder="Mamadou" placeholderTextColor={t.text3}
              autoCapitalize="words" returnKeyType="next" />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Nom" required t={t} />
            <TextInput style={inputStyle} value={lastName} onChangeText={setLastName}
              placeholder="Diallo" placeholderTextColor={t.text3}
              autoCapitalize="words" returnKeyType="next" />
          </View>
        </View>

        <View>
          <FieldLabel label="Email (identifiant de connexion)" required t={t} />
          <View style={{ flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: t.border, borderRadius: 12,
            backgroundColor: t.surface, paddingHorizontal: 14 }}>
            <Ic name="mail" size={17} color={t.text3} sw={1.8} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: t.text, paddingVertical: 12, marginLeft: 10 }}
              value={email} onChangeText={setEmail}
              placeholder="mamadou@exemple.com"
              placeholderTextColor={t.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>
        </View>

        <View>
          <FieldLabel label="Téléphone" required t={t} />
          <View style={{ flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: t.border, borderRadius: 12,
            backgroundColor: t.surface, paddingHorizontal: 14 }}>
            <Ic name="phone" size={17} color={t.text3} sw={1.8} />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: t.text, paddingVertical: 12, marginLeft: 10 }}
              value={phone} onChangeText={setPhone}
              placeholder="+221 77 000 00 00"
              placeholderTextColor={t.text3}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* ── Section 2 : Informations professionnelles ───────────── */}
        <SectionHeader icon="briefcase" label="Informations professionnelles" t={t} />

        <View>
          <FieldLabel label="Spécialité" required t={t} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {SPECIALITES.map(s => {
              const sel = specialite === s.value;
              return (
                <TouchableOpacity key={s.value} activeOpacity={0.7}
                  onPress={() => setSpecialite(s.value)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 7,
                    borderRadius: 11, borderWidth: 1.5, paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderColor: sel ? t.accent : t.border,
                    backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                  <Ic name={s.icon} size={14} color={sel ? t.accentText : t.text3} sw={2} />
                  <Text style={{ fontSize: 13, fontWeight: '600',
                    color: sel ? t.accentText : t.text2 }}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Date d'embauche" required t={t} />
            <TextInput style={inputStyle} value={dateEmbauche} onChangeText={setDateEmbauche}
              placeholder="AAAA-MM-JJ" placeholderTextColor={t.text3}
              keyboardType="numeric" maxLength={10} />
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel label="Salaire mensuel (FCFA)" t={t} />
            <TextInput style={inputStyle} value={salaire} onChangeText={setSalaire}
              placeholder="500 000" placeholderTextColor={t.text3}
              keyboardType="numeric" />
          </View>
        </View>

        <View>
          <FieldLabel label="Niveau de compétence" t={t} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {NIVEAUX.map(n => {
              const sel = niveau === n.value;
              return (
                <TouchableOpacity key={n.value} activeOpacity={0.7}
                  onPress={() => setNiveau(n.value)}
                  style={{ flex: 1, borderRadius: 10, borderWidth: 1.5,
                    paddingVertical: 10, alignItems: 'center',
                    borderColor: sel ? t.accent : t.border,
                    backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                  <Text style={{ fontWeight: '700', fontSize: 11.5,
                    color: sel ? t.accentText : t.text2, textAlign: 'center' }}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View>
          <FieldLabel label="Statut" t={t} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}>
            {STATUTS.map(s => {
              const sel = statut === s.value;
              return (
                <TouchableOpacity key={s.value} activeOpacity={0.7}
                  onPress={() => setStatut(s.value)}
                  style={{ borderRadius: 10, borderWidth: 1.5,
                    paddingHorizontal: 14, paddingVertical: 9,
                    borderColor: sel ? t.accent : t.border,
                    backgroundColor: sel ? `${t.accent}18` : t.surface }}>
                  <Text style={{ fontSize: 13, fontWeight: '600',
                    color: sel ? t.accentText : t.text2 }}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Mot de passe info */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10,
          padding: 12, borderRadius: 12,
          backgroundColor: t.accentSoft ?? `${t.accent}12` }}>
          <Ic name="info" size={15} color={t.accentText} sw={2} />
          <Text style={{ flex: 1, fontSize: 12.5, color: t.accentText, lineHeight: 18 }}>
            Un mot de passe temporaire sera généré automatiquement. L'employé pourra le modifier à sa première connexion.
          </Text>
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
            : <>
                <Ic name="user" size={17} color="#fff" sw={2.2} />
                <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff',
                  letterSpacing: -0.2 }}>Créer l'employé</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
