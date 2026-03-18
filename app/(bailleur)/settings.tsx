import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Mail, Phone, MapPin, User,
  Shield, Key, ChevronRight, LogOut, Building2,
} from 'lucide-react-native';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';

interface TiersInfo {
  id: number;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  telephone_2?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  type_tiers: string;
}

export default function BailleurSettings() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Récupère le Tiers correspondant au compte bailleur connecté
  const { data: tiersData, isLoading } = useQuery<{ results: TiersInfo[] }>({
    queryKey: ['bailleur-tiers-me'],
    queryFn: async () => {
      const { data } = await api.get('/tiers/', { params: { type_tiers: 'proprietaire' } });
      return data;
    },
  });

  // Le bailleur connecté a un seul Tiers lié à son compte
  const tiers = tiersData?.results?.[0] ?? null;

  const getInitials = () =>
    `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Mon profil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Profil utilisateur */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: '#7c3aed' }}>
              <Text className="text-white text-lg font-bold">{getInitials()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </Text>
              <Text className="text-sm text-gray-400 mt-0.5">{user?.email}</Text>
              <View className="mt-1.5 self-start px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#f5f3ff' }}>
                <Text className="text-xs font-semibold" style={{ color: '#7c3aed' }}>Propriétaire</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informations de contact (depuis Tiers) */}
        {isLoading ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center">
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : tiers && (
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Informations de contact</Text>

            {[
              { icon: User, label: [tiers.prenom, tiers.nom].filter(Boolean).join(' ') || null },
              { icon: Mail, label: tiers.email ?? null },
              { icon: Phone, label: tiers.telephone ?? null },
              { icon: Phone, label: tiers.telephone_2 ?? null },
              { icon: MapPin, label: [tiers.adresse, tiers.ville, tiers.pays].filter(Boolean).join(', ') || null },
            ].filter((r) => r.label).map((r, i) => {
              const Icon = r.icon;
              return (
                <View
                  key={i}
                  className={`flex-row items-center gap-2 py-2.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                >
                  <Icon size={14} color="#9ca3af" />
                  <Text className="text-sm text-gray-600 flex-1">{r.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Compte */}
        <View className="bg-white rounded-2xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">Compte</Text>
          {[
            { label: 'Changer le mot de passe', icon: Key, color: '#6b7280' },
            { label: 'Sécurité', icon: Shield, color: '#6b7280' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                activeOpacity={0.7}
              >
                <View className="w-8 h-8 rounded-xl bg-gray-100 items-center justify-center">
                  <Icon size={15} color={item.color} />
                </View>
                <Text className="flex-1 text-sm font-semibold text-gray-800">{item.label}</Text>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          className="bg-red-50 rounded-2xl border border-red-100 flex-row items-center gap-3 px-4 py-3.5"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <View className="w-8 h-8 rounded-xl bg-red-100 items-center justify-center">
            <LogOut size={15} color="#dc2626" />
          </View>
          <Text className="flex-1 text-sm font-semibold text-red-600">Se déconnecter</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-300 pb-4">Afrydex Immo v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
