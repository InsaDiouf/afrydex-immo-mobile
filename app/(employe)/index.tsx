import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, Wrench, ShoppingCart, CheckCircle, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';

export default function EmployeDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['employe-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/employee-dashboard/');
      return data;
    },
  });

  const todayWork = dashData?.today_work ?? [];
  const stats = dashData?.stats;
  const pendingTasks = todayWork.filter((t: any) => t.statut !== 'complete' && t.statut !== 'valide');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xs text-amber-500 font-semibold">Portail Employé</Text>
          <Text className="text-base font-bold text-gray-900">Bonjour, {user?.first_name} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} className="p-2 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <LogOut size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 12 }}>
        {isLoading ? (
          <View className="items-center py-12"><ActivityIndicator color="#d97706" /></View>
        ) : (
          <>
            {/* Task summary */}
            <View className="bg-amber-500 rounded-2xl p-5">
              <Text className="text-amber-100 text-xs font-semibold">Tâches en cours</Text>
              <Text className="text-white text-4xl font-bold mt-1">{stats?.total_in_progress ?? pendingTasks.length}</Text>
              <Text className="text-amber-100 text-xs mt-2">
                {stats?.total_pending ?? 0} en attente · {stats?.total_completed_today ?? 0} terminées aujourd'hui
              </Text>
            </View>

            {/* Stats row */}
            <View className="flex-row gap-3">
              {[
                { label: 'En retard', value: stats?.total_overdue ?? 0, color: '#dc2626', bg: '#fef2f2' },
                { label: 'À venir', value: stats?.upcoming_count ?? 0, color: '#2563eb', bg: '#eff6ff' },
              ].map((s) => (
                <View key={s.label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
                  <Text className="text-xl font-bold" style={{ color: s.color }}>{s.value}</Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Today tasks */}
            {todayWork.slice(0, 5).map((task: any, i: number) => (
              <TouchableOpacity
                key={task.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3"
                activeOpacity={0.85}
                onPress={() => router.push(`/(employe)/tasks` as any)}
              >
                <View className="w-9 h-9 bg-amber-50 rounded-xl items-center justify-center">
                  <ClipboardList size={16} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                    {task.titre ?? `Tâche #${task.id}`}
                  </Text>
                  {task.appartement_nom && (
                    <Text className="text-xs text-gray-400 mt-0.5">{task.appartement_nom}</Text>
                  )}
                </View>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: task.est_en_retard ? '#fef2f2' : '#fffbeb' }}
                >
                  <Text className="text-[10px] font-semibold" style={{ color: task.est_en_retard ? '#dc2626' : '#d97706' }}>
                    {task.est_en_retard ? 'Retard' : task.statut?.replace('_', ' ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
