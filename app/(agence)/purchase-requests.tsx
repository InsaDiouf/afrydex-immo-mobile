import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingCart, User, Calendar, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react-native';
import { api } from '@/lib/api';

interface PurchaseRequest {
  id: number;
  titre: string;
  description?: string;
  montant_estime?: number;
  statut: string;
  priorite?: string;
  demandeur_nom?: string;
  date_demande: string;
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  approuve: { bg: '#f0fdf4', text: '#16a34a', label: 'Approuvé' },
  rejete: { bg: '#fef2f2', text: '#dc2626', label: 'Rejeté' },
  commande: { bg: '#eff6ff', text: '#2563eb', label: 'Commandé' },
  recu: { bg: '#f0fdf4', text: '#16a34a', label: 'Reçu' },
};

export default function PurchaseRequestsScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ results: PurchaseRequest[] }>({
    queryKey: ['purchase-requests'],
    queryFn: async () => {
      const { data } = await api.get('/purchase-requests/');
      return data;
    },
  });

  const items = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Demandes d'achat</Text>
          <Text className="text-xs text-gray-400">{items.length} demande(s)</Text>
        </View>
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
            const s = STATUS[item.statut] ?? STATUS.en_attente;
            return (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className="w-9 h-9 bg-amber-50 rounded-xl items-center justify-center flex-shrink-0">
                      <ShoppingCart size={16} color="#d97706" />
                    </View>
                    <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={2}>
                      {item.titre}
                    </Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg }}>
                    <Text className="text-xs font-bold" style={{ color: s.text }}>{s.label}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-row items-center gap-1">
                    <User size={11} color="#9ca3af" />
                    <Text className="text-xs text-gray-400">{item.demandeur_nom ?? '—'}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    {item.montant_estime !== undefined && (
                      <Text className="text-xs font-bold text-blue-600">
                        {Number(item.montant_estime).toLocaleString('fr-FR')} FCFA
                      </Text>
                    )}
                    <View className="flex-row items-center gap-1">
                      <Calendar size={11} color="#9ca3af" />
                      <Text className="text-xs text-gray-400">
                        {new Date(item.date_demande).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <ShoppingCart size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucune demande</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
