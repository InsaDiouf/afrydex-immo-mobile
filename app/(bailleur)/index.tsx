import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, FileText, TrendingUp, CreditCard, FolderOpen, Clock, CheckCircle2, MapPin, LogOut, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/ctx/auth';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function BailleurDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const { data: dashData, isLoading: loadingDash } = useQuery({
    queryKey: ['bailleur-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/');
      return data;
    },
  });

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['bailleur-contracts-recent'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/', { params: { statut: 'actif', limit: 4 } });
      return data;
    },
  });

  const contracts = contractsData?.results ?? [];
  const isLoading = loadingDash || loadingContracts;

  const quickActions = [
    { label: 'Mes biens', icon: Building2, color: '#7c3aed', bg: '#f5f3ff', route: '/(bailleur)/properties' },
    { label: 'Contrats', icon: FileText, color: '#2563eb', bg: '#eff6ff', route: '/(bailleur)/contracts' },
    { label: 'Revenus', icon: CreditCard, color: '#16a34a', bg: '#f0fdf4', route: '/(bailleur)/payments' },
    { label: 'Documents', icon: FolderOpen, color: '#d97706', bg: '#fffbeb', route: '/(bailleur)/documents' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xs font-semibold" style={{ color: '#7c3aed' }}>Portail Bailleur</Text>
          <Text className="text-base font-bold text-gray-900">Bonjour, {user?.first_name} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} className="p-2 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <LogOut size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 12 }}>
        {/* Revenue card */}
        <View className="rounded-2xl p-5" style={{ backgroundColor: '#7c3aed' }}>
          <Text className="text-xs font-semibold" style={{ color: '#c4b5fd' }}>Revenus du mois</Text>
          <Text className="text-3xl font-bold text-white mt-1">
            {loadingDash ? '—' : Number(dashData?.loyers_percus ?? 0).toLocaleString('fr-FR')} FCFA
          </Text>
          <Text className="text-xs mt-2" style={{ color: '#c4b5fd' }}>
            Attendu : {loadingDash ? '—' : Number(dashData?.loyers_du_mois ?? 0).toLocaleString('fr-FR')} FCFA
          </Text>
        </View>

        {/* KPI stats */}
        <View className="flex-row gap-3">
          {[
            { label: 'Biens loués', value: dashData?.total_appartements, icon: Building2, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Contrats actifs', value: dashData?.total_contrats_actifs, icon: FileText, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Taux occu.', value: dashData?.taux_occupation ? `${dashData.taux_occupation}%` : null, icon: TrendingUp, color: '#d97706', bg: '#fffbeb' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <View key={s.label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
                <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
                  <Icon size={16} color={s.color} />
                </View>
                <Text className="text-xl font-bold text-gray-900">
                  {loadingDash ? '—' : s.value != null ? String(s.value) : '—'}
                </Text>
                <Text className="text-[10px] text-gray-400 text-center mt-0.5">{s.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick actions */}
        <View className="flex-row flex-wrap gap-3">
          {quickActions.map(({ label, icon: Icon, color, bg, route }) => (
            <TouchableOpacity
              key={label}
              className="bg-white rounded-2xl border border-gray-100 p-4 items-center"
              style={{ width: '47%' }}
              activeOpacity={0.7}
              onPress={() => router.push(route as any)}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: bg }}>
                <Icon size={18} color={color} />
              </View>
              <Text className="text-xs font-semibold text-gray-800 text-center">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent contracts */}
        {!loadingContracts && contracts.length > 0 && (
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <FileText size={14} color="#7c3aed" />
                <Text className="text-sm font-bold text-gray-900">Contrats actifs</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(bailleur)/contracts' as any)} activeOpacity={0.7}>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold" style={{ color: '#7c3aed' }}>Voir tout</Text>
                  <ArrowRight size={12} color="#7c3aed" />
                </View>
              </TouchableOpacity>
            </View>
            {contracts.slice(0, 3).map((c: any, i: number) => (
              <View
                key={c.id}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
              >
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#7c3aed' }} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-800">{c.locataire_nom ?? c.numero_contrat}</Text>
                  {c.appartement_nom && (
                    <View className="flex-row items-center gap-0.5 mt-0.5">
                      <MapPin size={10} color="#9ca3af" />
                      <Text className="text-[10px] text-gray-400">{c.appartement_nom}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                  {Number(c.loyer_mensuel).toLocaleString('fr-FR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {isLoading && (
          <View className="items-center py-8">
            <ActivityIndicator color="#7c3aed" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
