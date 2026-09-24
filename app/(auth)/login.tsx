import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/ctx/auth';
import { openSupport } from '@/lib/legal';
import { Ic } from '@/components/agence/ui';

const PORTALS = [
  ['Agence',    '#2563eb'],
  ['Bailleur',  '#7c3aed'],
  ['Locataire', '#16a34a'],
  ['Employé',   '#d97706'],
] as const;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 400 || status === 401) {
        setError('Email ou mot de passe incorrect');
      } else if (e?.code === 'ERR_NETWORK' || e?.code === 'ECONNREFUSED' || e?.code === 'ECONNABORTED') {
        setError('Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.');
      } else {
        setError('Une erreur est survenue. Réessaie dans un instant.');
      }
    } finally {
      setLoading(false);
    }
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
        {/* ── Hero gradient header ────────────────────────────── */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e3a8a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={{
            paddingTop: 82, paddingHorizontal: 28, paddingBottom: 44,
            borderBottomLeftRadius: 34, borderBottomRightRadius: 34,
            overflow: 'hidden', position: 'relative',
          }}
        >
          {/* Background bubble */}
          <View style={{ position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' }} />

          {/* Logo */}
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
            Afrydex<Text style={{ opacity: 0.7, fontWeight: '600' }}>Immo</Text>
          </Text>
          <Text style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.82)', marginTop: 7, lineHeight: 20 }}>
            Votre plateforme de gestion{'\n'}immobilière en Afrique.
          </Text>
        </LinearGradient>

        {/* ── Form ────────────────────────────────────────────── */}
        <View style={{ padding: 24, flex: 1, gap: 16 }}>
          <Text style={{ fontWeight: '700', fontSize: 19, color: '#1c1710', letterSpacing: -0.2 }}>
            Connexion
          </Text>

          {/* Error */}
          {error && (
            <View style={{ backgroundColor: '#fbe7e7', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ic name="alert" size={15} color="#b91c1c" sw={2} />
              <Text style={{ flex: 1, fontSize: 13, color: '#b91c1c', lineHeight: 19 }}>{error}</Text>
            </View>
          )}

          {/* Email / Téléphone */}
          <View>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#6b6155', marginBottom: 9 }}>
              E-mail ou téléphone
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5, borderColor: 'rgba(28,23,16,0.1)', borderRadius: 14,
              backgroundColor: '#fff', paddingHorizontal: 14,
            }}>
              <Ic name="mail" size={18} color="#a89c8c" sw={1.8} />
              <TextInput
                style={inputBase}
                placeholder="vous@agence.ci"
                placeholderTextColor="#a89c8c"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={v => { setEmail(v); setError(null); }}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View>
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#6b6155', marginBottom: 9 }}>
              Mot de passe
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              borderWidth: 1.5, borderColor: 'rgba(28,23,16,0.1)', borderRadius: 14,
              backgroundColor: '#fff', paddingHorizontal: 14,
            }}>
              <Ic name="lock" size={18} color="#a89c8c" sw={1.8} />
              <TextInput
                style={inputBase}
                placeholder="••••••••"
                placeholderTextColor="#a89c8c"
                secureTextEntry={!showPass}
                autoComplete="password"
                value={password}
                onChangeText={v => { setPassword(v); setError(null); }}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} activeOpacity={0.7}>
                <Ic name={showPass ? 'eyeOff' : 'eye'} size={19} color="#a89c8c" sw={1.8} />
              </TouchableOpacity>
            </View>

            {/* Les comptes sont provisionnés par l'agence : la réinitialisation
                passe par elle, il n'existe pas d'auto-service côté API. */}
            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Mot de passe oublié',
                  "Votre agence gère les accès. Contactez-la pour obtenir un nouveau mot de passe temporaire.",
                  [
                    { text: 'Écrire au support', onPress: openSupport },
                    { text: 'Fermer', style: 'cancel' },
                  ]
                )
              }
            >
              <Text style={{ fontWeight: '600', fontSize: 13, color: '#2563eb' }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !email || !password}
            activeOpacity={0.85}
            style={{
              borderRadius: 14, paddingVertical: 15, alignItems: 'center',
              justifyContent: 'center', flexDirection: 'row', gap: 8,
              backgroundColor: '#2563eb',
              opacity: loading || !email || !password ? 0.65 : 1,
              shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 22,
              elevation: 6,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ic name="arrowR" size={18} color="#fff" sw={2.2} />
                  <Text style={{ fontWeight: '800', fontSize: 15, color: '#fff', letterSpacing: -0.2 }}>Se connecter</Text>
                </>
            }
          </TouchableOpacity>

          {/* Shield info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 }}>
            <Ic name="shield" size={14} color="#a89c8c" sw={1.8} />
            <Text style={{ fontSize: 12, color: '#a89c8c', textAlign: 'center' }}>
              Redirection automatique vers votre espace
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* Portal legend */}
          <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(28,23,16,0.08)', paddingTop: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {PORTALS.map(([name, color]) => (
                <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                  <Text style={{ fontWeight: '600', fontSize: 11.5, color: '#6b6155' }}>{name}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ic name="globe" size={14} color="#a89c8c" sw={1.7} />
              <Text style={{ fontWeight: '600', fontSize: 12.5, color: '#6b6155' }}>Français</Text>
              <Ic name="chevDown" size={12} color="#a89c8c" sw={2} />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
