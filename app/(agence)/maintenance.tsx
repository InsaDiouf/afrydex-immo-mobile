import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, MapPin, Calendar, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Maintenance {
  id: number;
  titre: string;
  appartement_nom?: string;
  statut: string;
  priorite: string;
  date_signalement: string;
}

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  urgente: { bg: '#fef2f2', text: '#dc2626' },
  haute: { bg: '#fff7ed', text: '#ea580c' },
  normale: { bg: '#eff6ff', text: '#2563eb' },
  basse: { bg: '#f9fafb', text: '#6b7280' },
};

const STATUS_LABEL: Record<string, string> = {
  signale: 'Signalé',
  en_cours: 'En cours',
  termine: 'Terminé',
  annule: 'Annulé',
};

export default function MaintenanceScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ results: Maintenance[] }>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const { data } = await api.get('/maintenance/');
      return data;
    },
  });

  const items = data?.results ?? [];
  const open = items.filter((i) => i.statut !== 'termine' && i.statut !== 'annule');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Maintenance</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{open.length} intervention(s) en cours</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const priority = PRIORITY_COLOR[item.priorite] ?? PRIORITY_COLOR.normale;
            return (
              <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-start gap-3"
                activeOpacity={0.85}
                onPress={() => router.push(`/(agence)/maintenance/${item.id}`)}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: priority.bg }}>
                  <Wrench size={18} color={priority.text} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                    {item.titre}
                  </Text>
                  {item.appartement_nom && (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <MapPin size={11} color="#9ca3af" />
                      <Text className="text-xs text-gray-400">{item.appartement_nom}</Text>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center gap-1">
                      <Calendar size={11} color="#9ca3af" />
                      <Text className="text-xs text-gray-400">
                        {new Date(item.date_signalement).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold" style={{ color: priority.text }}>
                      {STATUS_LABEL[item.statut] ?? item.statut}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Wrench size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucune intervention</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
