import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, FileText, Wrench, CreditCard, Users, TrendingUp, AlertCircle, LogOut } from 'lucide-react-native';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';

interface DashboardData {
  total_residences?: number;
  total_appartements?: number;
  total_contrats_actifs?: number;
  total_maintenances_en_cours?: number;
  loyers_du_mois?: number;
  loyers_percus?: number;
  taux_occupation?: number;
  alertes?: { type: string; message: string }[];
}

export default function AgenceDashboard() {
  const { user, signOut } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/');
      return data;
    },
  });

  const stats = [
    {
      label: 'Résidences',
      value: data?.total_residences ?? '—',
      icon: Building2,
      color: '#2563eb',
      bg: '#eff6ff',
    },
    {
      label: 'Contrats actifs',
      value: data?.total_contrats_actifs ?? '—',
      icon: FileText,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    {
      label: 'Maintenance',
      value: data?.total_maintenances_en_cours ?? '—',
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Taux occupation',
      value: data?.taux_occupation ? `${data.taux_occupation}%` : '—',
      icon: TrendingUp,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xs text-gray-400 font-medium">Portail Agence</Text>
          <Text className="text-base font-bold text-gray-900">
            Bonjour, {user?.first_name} 👋
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          className="p-2 rounded-xl bg-gray-100"
          activeOpacity={0.7}
        >
          <LogOut size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <>
            {/* KPI Grid */}
            <View className="flex-row flex-wrap gap-3">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <View
                    key={s.label}
                    className="flex-1 min-w-[44%] rounded-2xl p-4 border border-gray-100 bg-white"
                    style={{ minWidth: '44%' }}
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mb-3"
                      style={{ backgroundColor: s.bg }}
                    >
                      <Icon size={18} color={s.color} />
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">{String(s.value)}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{s.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Revenue card */}
            {(data?.loyers_du_mois !== undefined) && (
              <View className="bg-blue-600 rounded-2xl p-5">
                <Text className="text-blue-100 text-xs font-semibold mb-1">Loyers du mois</Text>
                <Text className="text-white text-3xl font-bold">
                  {Number(data.loyers_du_mois).toLocaleString('fr-FR')} FCFA
                </Text>
                <View className="mt-3 flex-row items-center gap-2">
                  <View className="flex-1 h-1.5 bg-blue-500 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-white rounded-full"
                      style={{
                        width: `${data.loyers_du_mois && data.loyers_percus
                          ? Math.min(100, (data.loyers_percus / data.loyers_du_mois) * 100)
                          : 0}%`
                      }}
                    />
                  </View>
                  <Text className="text-blue-100 text-xs">
                    {Number(data.loyers_percus ?? 0).toLocaleString('fr-FR')} encaissés
                  </Text>
                </View>
              </View>
            )}

            {/* Alertes */}
            {data?.alertes && data.alertes.length > 0 && (
              <View className="bg-white rounded-2xl border border-gray-100">
                <View className="flex-row items-center gap-2 px-4 pt-4 pb-2">
                  <AlertCircle size={16} color="#d97706" />
                  <Text className="text-sm font-bold text-gray-900">Alertes</Text>
                </View>
                {data.alertes.map((a, i) => (
                  <View key={i} className="px-4 py-3 border-t border-gray-50">
                    <Text className="text-xs font-semibold text-amber-600">{a.type}</Text>
                    <Text className="text-sm text-gray-700 mt-0.5">{a.message}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
