import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { openPrivacy, openTerms, openDataDeletion } from '@/lib/legal';
import {
  Card, DetailHeader, Tile, Avatar, Badge, Divider, KV, Ic, initials,
} from '@/components/agence/ui';

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrateur',
  manager:    'Manager',
  accountant: 'Comptable',
  landlord:   'Propriétaire',
  tenant:     'Locataire',
  employe:    'Employé',
};

function Section({ label }: { label: string }) {
  return (
    <Text style={{ fontWeight: '700', fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 8, marginBottom: 8, color: '#888' }}>
      {label}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme: t } = useAgencyTheme();

  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Utilisateur';
  const role = ROLE_LABELS[user?.user_type ?? ''] ?? user?.user_type ?? '';

  const handleChangePassword = async () => {
    setPwdError(null);
    setPwdSuccess(false);
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError('Tous les champs sont requis.');
      return;
    }
    if (newPwd.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwdLoading(true);
    try {
      await api.post('/auth/change-password/', { current_password: oldPwd, new_password: newPwd });
      setPwdSuccess(true);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPwd(false);
    } catch (err: any) {
      setPwdError(err?.response?.data?.error ?? err?.response?.data?.detail ?? 'Erreur lors du changement.');
    } finally {
      setPwdLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: t.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: t.text, backgroundColor: t.surface,
    marginBottom: 10,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Paramètres" onBack={() => router.back()} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <Card t={t} pad={16} style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar t={t} initials={initials(name)} size={56} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text, letterSpacing: -0.2 }}>{name}</Text>
              <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }} numberOfLines={1}>{user?.email}</Text>
            </View>
            <Badge t={t} tone="info">{role}</Badge>
          </View>
        </Card>

        {/* Sécurité */}
        <Section label="Sécurité" />
        <Card t={t} pad={14} style={{ marginBottom: 22 }}>
          {/* Change password toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { setShowPwd(v => !v); setPwdError(null); setPwdSuccess(false); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 4 }}
          >
            <Tile t={t} name="key" tone="accent" size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>Changer le mot de passe</Text>
              <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>Modifier votre mot de passe actuel</Text>
            </View>
            <Ic name={showPwd ? 'chevD' : 'chevR'} size={18} color={t.text3} sw={2} />
          </TouchableOpacity>

          {showPwd && (
            <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: t.border }}>
              {pwdError && (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>{pwdError}</Text>
                </View>
              )}
              {pwdSuccess && (
                <View style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: '#22c55e', fontWeight: '600' }}>Mot de passe modifié avec succès.</Text>
                </View>
              )}
              <Text style={{ fontSize: 12, color: t.text2, marginBottom: 6, fontWeight: '600' }}>Mot de passe actuel</Text>
              <TextInput
                style={inputStyle} value={oldPwd} onChangeText={setOldPwd}
                secureTextEntry placeholder="••••••••"
                placeholderTextColor={t.text3}
              />
              <Text style={{ fontSize: 12, color: t.text2, marginBottom: 6, fontWeight: '600' }}>Nouveau mot de passe</Text>
              <TextInput
                style={inputStyle} value={newPwd} onChangeText={setNewPwd}
                secureTextEntry placeholder="••••••••"
                placeholderTextColor={t.text3}
              />
              <Text style={{ fontSize: 12, color: t.text2, marginBottom: 6, fontWeight: '600' }}>Confirmer</Text>
              <TextInput
                style={inputStyle} value={confirmPwd} onChangeText={setConfirmPwd}
                secureTextEntry placeholder="••••••••"
                placeholderTextColor={t.text3}
              />
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={pwdLoading}
                activeOpacity={0.8}
                style={{ backgroundColor: t.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, opacity: pwdLoading ? 0.6 : 1 }}
              >
                {pwdLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Enregistrer</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Informations légales */}
        <Section label="Informations légales" />
        <Card t={t} pad={14} style={{ marginBottom: 22 }}>
          {[
            { icon: 'shield', title: 'Politique de confidentialité', sub: 'Traitement de vos données',  onPress: openPrivacy,      last: false },
            { icon: 'contract', title: "Conditions d'utilisation",   sub: 'Règles du service',          onPress: openTerms,        last: false },
            { icon: 'alert',  title: 'Suppression des données',      sub: 'Demander la suppression',    onPress: openDataDeletion, last: true  },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: item.last ? 0 : 1, borderBottomColor: t.border }}
            >
              <Tile t={t} name={item.icon} tone="neutral" size={40} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>{item.title}</Text>
                <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>{item.sub}</Text>
              </View>
              <Ic name="chevR" size={18} color={t.text3} sw={2} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* À propos */}
        <Section label="À propos" />
        <Card t={t} pad={14} style={{ marginBottom: 22 }}>
          <KV t={t} k="Version" v="1.0.0" />
          <KV t={t} k="Plateforme" v="AfrydexImmo" last />
        </Card>

        {/* Déconnexion */}
        <Card t={t} pad={14} style={{ marginBottom: 32 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={signOut}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 4 }}
          >
            <Tile t={t} name="logout" tone="danger" size={40} />
            <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.dangerText, flex: 1 }}>Déconnexion</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}
