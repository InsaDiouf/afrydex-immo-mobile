import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';
import { Ic } from '@/components/agence/ui';

function strengthOf(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Très faible', color: '#dc2626' };
  if (score === 2) return { score, label: 'Faible', color: '#f97316' };
  if (score === 3) return { score, label: 'Moyen', color: '#eab308' };
  if (score === 4) return { score, label: 'Fort', color: '#22c55e' };
  return { score, label: 'Très fort', color: '#16a34a' };
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, tempPassword, mustChangePassword, clearMustChangePassword, signOut } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Le mot de passe temporaire n'est gardé qu'en mémoire : s'il est perdu
  // (app relancée en plein flux) on demande sa saisie plutôt que de bloquer l'écran.
  const needsCurrentPw = !mustChangePassword || !tempPassword;

  const strength = strengthOf(newPw);
  const mismatch = confirmPw.length > 0 && newPw !== confirmPw;
  const canSubmit =
    newPw.length >= 8 && newPw === confirmPw && !loading &&
    (!needsCurrentPw || currentPw.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/change-password/', {
        current_password: needsCurrentPw ? currentPw : tempPassword,
        new_password: newPw,
      });
      await clearMustChangePassword();
      if (!mustChangePassword) {
        Alert.alert('Mot de passe modifié', 'Ton nouveau mot de passe est actif.');
        router.back();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Une erreur est survenue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputRow = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: 'rgba(28,23,16,0.1)',
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
  };

  const inputBase = {
    flex: 1, fontSize: 14.5, color: '#111827', paddingVertical: 13, marginLeft: 10,
  } as const;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f3f0ea' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            paddingTop: 82, paddingHorizontal: 28, paddingBottom: 44,
            borderBottomLeftRadius: 34, borderBottomRightRadius: 34,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }} />

          <View style={{
            width: 60, height: 60, borderRadius: 17, backgroundColor: '#fff',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24,
            elevation: 8, marginBottom: 20,
          }}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>

          <Text style={{ fontWeight: '700', fontSize: 27, color: '#fff', letterSpacing: -0.4 }}>
            Bienvenue{user?.first_name ? `, ${user.first_name}` : ''} !
          </Text>
          <Text style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.82)', marginTop: 7, lineHeight: 21 }}>
            Pour votre sécurité, veuillez{'\n'}définir un mot de passe personnel.
          </Text>
        </LinearGradient>

        {/* ── Form ──────────────────────────────────────────────── */}
        <View style={{ padding: 24, flex: 1, gap: 16 }}>
          {/* Info banner */}
          <View style={{
            backgroundColor: '#eff6ff', borderRadius: 14, padding: 14,
            flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            borderWidth: 1, borderColor: '#bfdbfe',
          }}>
            <Ic name="shield" size={16} color="#2563eb" sw={2} />
            <Text style={{ flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 19 }}>
              {mustChangePassword
                ? 'Un mot de passe temporaire vous a été attribué. Choisissez-en un personnel que vous seul connaissez.'
                : 'Choisissez un mot de passe personnel d’au moins 8 caractères.'}
            </Text>
          </View>

          {/* Current password — saisie requise hors flux temporaire */}
          {needsCurrentPw && (
            <View>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#6b6155', marginBottom: 9 }}>
                Mot de passe actuel
              </Text>
              <View style={inputRow}>
                <Ic name="lock" size={18} color="#a89c8c" sw={1.8} />
                <TextInput
                  style={inputBase}
                  placeholder="Votre mot de passe actuel"
                  placeholderTextColor="#a89c8c"
                  secureTextEntry={!showCur}
                  autoComplete="current-password"
                  value={currentPw}
                  onChangeText={v => { setCurrentPw(v); setError(null); }}
                  returnKeyType="next"
                />
                <TouchableOpacity onPress={() => setShowCur(v => !v)} activeOpacity={0.7}>
                  <Ic name={showCur ? 'eyeOff' : 'eye'} size={19} color="#a89c8c" sw={1.8} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={{ backgroundColor: '#fbe7e7', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ic name="alert" size={15} color="#b91c1c" sw={2} />
              <Text style={{ flex: 1, fontSize: 13, color: '#b91c1c', lineHeight: 19 }}>{error}</Text>
            </View>
          )}

          {/* New password */}
          <View>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#6b6155', marginBottom: 9 }}>
              Nouveau mot de passe
            </Text>
            <View style={inputRow}>
              <Ic name="lock" size={18} color="#a89c8c" sw={1.8} />
              <TextInput
                style={inputBase}
                placeholder="8 caractères minimum"
                placeholderTextColor="#a89c8c"
                secureTextEntry={!showNew}
                autoComplete="new-password"
                autoFocus={!needsCurrentPw}
                value={newPw}
                onChangeText={v => { setNewPw(v); setError(null); }}
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} activeOpacity={0.7}>
                <Ic name={showNew ? 'eyeOff' : 'eye'} size={19} color="#a89c8c" sw={1.8} />
              </TouchableOpacity>
            </View>

            {/* Strength */}
            {newPw.length > 0 && (
              <View style={{ marginTop: 8, gap: 5 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      backgroundColor: i <= strength.score ? strength.color : '#e5e7eb',
                    }} />
                  ))}
                </View>
                <Text style={{ fontSize: 11.5, color: strength.color, fontWeight: '600' }}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm */}
          <View>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#6b6155', marginBottom: 9 }}>
              Confirmer le mot de passe
            </Text>
            <View style={[inputRow, mismatch && { borderColor: '#fca5a5' }]}>
              <Ic name="lock" size={18} color={mismatch ? '#f87171' : '#a89c8c'} sw={1.8} />
              <TextInput
                style={inputBase}
                placeholder="Répétez le nouveau mot de passe"
                placeholderTextColor="#a89c8c"
                secureTextEntry={!showConf}
                autoComplete="new-password"
                value={confirmPw}
                onChangeText={v => { setConfirmPw(v); setError(null); }}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowConf(v => !v)} activeOpacity={0.7}>
                <Ic name={showConf ? 'eyeOff' : 'eye'} size={19} color="#a89c8c" sw={1.8} />
              </TouchableOpacity>
            </View>
            {mismatch && (
              <Text style={{ fontSize: 12, color: '#dc2626', marginTop: 5, marginLeft: 2 }}>
                Les mots de passe ne correspondent pas
              </Text>
            )}
            {!mismatch && confirmPw.length > 0 && newPw === confirmPw && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                <Ic name="check" size={13} color="#16a34a" sw={2.4} />
                <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '600' }}>
                  Les mots de passe correspondent
                </Text>
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            style={{
              marginTop: 4,
              borderRadius: 14, paddingVertical: 15, alignItems: 'center',
              justifyContent: 'center', flexDirection: 'row', gap: 8,
              backgroundColor: '#2563eb',
              opacity: canSubmit ? 1 : 0.5,
              shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 22,
              elevation: 6,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ic name="check" size={18} color="#fff" sw={2.4} />
                  <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>
                    Définir mon mot de passe
                  </Text>
                </>
            }
          </TouchableOpacity>

          {/* Porte de sortie : sans elle, un compte en changement forcé est piégé sur cet écran. */}
          <TouchableOpacity
            onPress={() => (mustChangePassword ? signOut() : router.back())}
            activeOpacity={0.7}
            style={{ paddingVertical: 10, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#6b6155' }}>
              {mustChangePassword ? 'Se déconnecter' : 'Annuler'}
            </Text>
          </TouchableOpacity>

          {mustChangePassword && (
            <Text style={{ fontSize: 12, color: '#a89c8c', textAlign: 'center', lineHeight: 18 }}>
              Vous serez redirigé vers votre espace automatiquement.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
