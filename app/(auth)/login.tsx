import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '@/ctx/auth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-8">
        {/* Logo / Brand */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">A</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900">Afrydex Immo</Text>
          <Text className="text-sm text-gray-500 mt-1">Gestion immobilière</Text>
        </View>

        {/* Error */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* Email */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-gray-500 mb-1.5">Adresse e-mail</Text>
          <TextInput
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
            placeholder="vous@exemple.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-gray-500 mb-1.5">Mot de passe</Text>
          <TextInput
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className="w-full py-3.5 bg-blue-600 rounded-xl items-center"
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text className="text-white font-semibold text-sm">Se connecter</Text>
          }
        </TouchableOpacity>

        <Text className="text-xs text-center text-gray-400 mt-6">
          Afrydex Immo v1.0 — Tous portails
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
