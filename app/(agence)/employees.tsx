import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Phone, Mail, Briefcase, ChevronRight } from 'lucide-react-native';
import { api } from '@/lib/api';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone?: string;
  poste?: string;
  statut?: string;
  tasks_count?: number;
}

export default function EmployeesScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ results: Employee[] }>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees/');
      return data;
    },
  });

  const employees = data?.results ?? [];

  const getInitials = (e: Employee) =>
    `${e.first_name?.[0] ?? ''}${e.last_name?.[0] ?? ''}`.toUpperCase();

  const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#d97706', '#dc2626', '#0891b2'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Employés</Text>
          <Text className="text-xs text-gray-400">{employees.length} membre(s)</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => {
            const color = COLORS[index % COLORS.length];
            return (
              <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3">
                {/* Avatar */}
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color + '18' }}
                >
                  <Text className="text-sm font-bold" style={{ color }}>{getInitials(item)}</Text>
                </View>

                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold text-gray-900">
                    {item.first_name} {item.last_name}
                  </Text>
                  {item.poste && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Briefcase size={11} color="#9ca3af" />
                      <Text className="text-xs text-gray-400">{item.poste}</Text>
                    </View>
                  )}
                  <View className="flex-row gap-3 mt-2">
                    {item.telephone && (
                      <TouchableOpacity
                        className="flex-row items-center gap-1"
                        onPress={() => Linking.openURL(`tel:${item.telephone}`)}
                        activeOpacity={0.7}
                      >
                        <Phone size={12} color="#2563eb" />
                        <Text className="text-xs text-blue-600">{item.telephone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {item.tasks_count !== undefined && (
                  <View className="items-center bg-gray-50 rounded-xl px-2.5 py-1.5">
                    <Text className="text-lg font-bold text-gray-900">{item.tasks_count}</Text>
                    <Text className="text-[9px] text-gray-400">tâches</Text>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Users size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucun employé</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
