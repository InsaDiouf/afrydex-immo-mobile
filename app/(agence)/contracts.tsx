import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, User, Calendar, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  appartement_nom?: string;
  statut: string;
  date_debut: string;
  loyer_base: number;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  actif: { bg: '#f0fdf4', text: '#16a34a', label: 'Actif' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  termine: { bg: '#f9fafb', text: '#6b7280', label: 'Terminé' },
  resilié: { bg: '#fef2f2', text: '#dc2626', label: 'Résilié' },
};

export default function ContractsScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ results: Contract[] }>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/');
      return data;
    },
  });

  const contracts = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Contrats</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{contracts.length} contrat(s)</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const status = STATUS_COLOR[item.statut] ?? STATUS_COLOR.en_attente;
            return (
              <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3"
                activeOpacity={0.85}
                onPress={() => router.push(`/(agence)/contract/${item.id}`)}
              >
                <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center flex-shrink-0">
                  <FileText size={18} color="#2563eb" />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                      {item.numero_contrat}
                    </Text>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: status.bg }}>
                      <Text className="text-xs font-semibold" style={{ color: status.text }}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 mt-1">
                    <User size={11} color="#9ca3af" />
                    <Text className="text-xs text-gray-400" numberOfLines={1}>
                      {item.locataire_prenom} {item.locataire_nom} · {item.appartement_nom}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-2">
                    <View className="flex-row items-center gap-1">
                      <Calendar size={11} color="#9ca3af" />
                      <Text className="text-xs text-gray-400">
                        {new Date(item.date_debut).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-blue-600">
                      {Number(item.loyer_base).toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <FileText size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucun contrat</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
