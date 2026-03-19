import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Home, CheckCircle2, Clock, AlertCircle, MapPin, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  statut: string;
  date_debut: string;
  date_fin?: string;
  loyer_mensuel: number;
  appartement_nom?: string;
  residence_nom?: string;
}

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  actif:      { label: 'Actif',       bg: '#f0fdf4', text: '#16a34a' },
  expire:     { label: 'Expiré',     bg: '#f9fafb', text: '#6b7280' },
  resilie:    { label: 'Résilié',    bg: '#fef2f2', text: '#dc2626' },
  en_attente: { label: 'En attente', bg: '#fffbeb', text: '#d97706' },
};

export default function LocataireContractList() {
  const router = useRouter();

  const { data, isLoading } = useQuery<Contract[]>({
    queryKey: ['locataire-all-contracts'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/');
      return data.results ?? data ?? [];
    },
  });

  const contracts = data ?? [];

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes contrats</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Tous vos baux de location</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : contracts.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <FileText size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-base font-semibold mt-4">Aucun contrat</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const s = STATUS[item.statut] ?? STATUS.en_attente;
            return (
              <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-100 p-4"
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: '/(locataire)/contract-detail', params: { id: item.id } })}
              >
                {/* Top row */}
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-row items-start gap-3 flex-1 min-w-0">
                    <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center flex-shrink-0">
                      <Home size={18} color="#2563eb" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                        {item.appartement_nom ?? '—'}
                      </Text>
                      {item.residence_nom && (
                        <View className="flex-row items-center gap-1 mt-0.5">
                          <MapPin size={11} color="#9ca3af" />
                          <Text className="text-xs text-gray-400" numberOfLines={1}>{item.residence_nom}</Text>
                        </View>
                      )}
                      <Text className="text-[10px] text-gray-400 mt-1 font-mono">{item.numero_contrat}</Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg }}>
                    <Text className="text-xs font-bold" style={{ color: s.text }}>{s.label}</Text>
                  </View>
                </View>

                {/* Bottom row */}
                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <View className="flex-row gap-4">
                    <View>
                      <Text className="text-[10px] text-gray-400">Début</Text>
                      <Text className="text-xs font-semibold text-gray-700 mt-0.5">{formatDate(item.date_debut)}</Text>
                    </View>
                    <View>
                      <Text className="text-[10px] text-gray-400">Loyer</Text>
                      <Text className="text-xs font-semibold text-green-600 mt-0.5">
                        {Number(item.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>
                  </View>
                  <ArrowRight size={16} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
