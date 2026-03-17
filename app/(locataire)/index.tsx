import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, CreditCard, Wrench, Home, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';

export default function LocataireDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['locataire-contracts'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/?my=true');
      return data.results ?? data;
    },
  });

  const activeContract = contracts?.[0];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xs text-green-600 font-semibold">Portail Locataire</Text>
          <Text className="text-base font-bold text-gray-900">
            Bonjour, {user?.first_name} 👋
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} className="p-2 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <LogOut size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 12 }}>
        {isLoading ? (
          <View className="items-center py-12"><ActivityIndicator color="#16a34a" /></View>
        ) : (
          <>
            {/* Logement card */}
            {activeContract && (
              <View className="bg-green-600 rounded-2xl p-5">
                <View className="flex-row items-center gap-2 mb-1">
                  <Home size={16} color="rgba(255,255,255,0.7)" />
                  <Text className="text-green-100 text-xs font-semibold">Mon logement</Text>
                </View>
                <Text className="text-white text-xl font-bold">{activeContract.appartement_nom}</Text>
                <Text className="text-green-100 text-xs mt-1">
                  Contrat {activeContract.numero_contrat}
                </Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-green-100 text-[10px]">Loyer mensuel</Text>
                    <Text className="text-white text-lg font-bold">
                      {Number(activeContract.loyer_base).toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-bold">Actif</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick actions */}
            <View className="bg-white rounded-2xl border border-gray-100">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
                Actions rapides
              </Text>
              {[
                { label: 'Voir mon contrat', icon: FileText, color: '#2563eb', route: '/(locataire)/contract' },
                { label: 'Mes loyers', icon: CreditCard, color: '#16a34a', route: '/(locataire)/rent' },
                { label: 'Signaler un problème', icon: Wrench, color: '#d97706', route: '/(locataire)/maintenance' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View className="w-8 h-8 rounded-xl items-center justify-center"
                      style={{ backgroundColor: item.color + '15' }}>
                      <Icon size={16} color={item.color} />
                    </View>
                    <Text className="flex-1 text-sm font-semibold text-gray-800">{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
