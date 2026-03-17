import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, User, Calendar, CheckCircle2, Clock, XCircle, ChevronRight, TrendingUp } from 'lucide-react-native';
import { api } from '@/lib/api';

interface Invoice {
  id: number;
  numero_facture?: string;
  locataire_nom?: string;
  locataire_prenom?: string;
  appartement_nom?: string;
  montant_total: number;
  statut: string;
  date_echeance: string;
  date_paiement?: string;
  type_facture?: string;
}

const STATUS: Record<string, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  payee: { bg: '#f0fdf4', text: '#16a34a', label: 'Payée', icon: CheckCircle2 },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente', icon: Clock },
  en_retard: { bg: '#fef2f2', text: '#dc2626', label: 'En retard', icon: XCircle },
  annulee: { bg: '#f9fafb', text: '#6b7280', label: 'Annulée', icon: XCircle },
};

const FILTERS = ['Toutes', 'En attente', 'Payées', 'En retard'] as const;
type Filter = typeof FILTERS[number];

export default function PaymentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('Toutes');

  const { data, isLoading } = useQuery<{ results: Invoice[]; total_attendu?: number; total_percu?: number }>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.get('/payments/invoices/');
      return data;
    },
  });

  const allInvoices = data?.results ?? [];

  const filtered = allInvoices.filter((inv) => {
    if (filter === 'Toutes') return true;
    if (filter === 'En attente') return inv.statut === 'en_attente';
    if (filter === 'Payées') return inv.statut === 'payee';
    if (filter === 'En retard') return inv.statut === 'en_retard';
    return true;
  });

  const totalPercu = allInvoices.filter((i) => i.statut === 'payee').reduce((acc, i) => acc + Number(i.montant_total), 0);
  const totalAttendu = allInvoices.reduce((acc, i) => acc + Number(i.montant_total), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Paiements</Text>
          <Text className="text-xs text-gray-400">{allInvoices.length} facture(s)</Text>
        </View>
      </View>

      {/* Revenue summary */}
      {!isLoading && (
        <View className="mx-4 mt-4 bg-blue-600 rounded-2xl p-4 flex-row gap-3">
          <View className="flex-1">
            <Text className="text-blue-100 text-xs font-semibold">Encaissé</Text>
            <Text className="text-white text-xl font-bold mt-0.5">
              {totalPercu.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
          <View className="w-px bg-blue-500" />
          <View className="flex-1">
            <Text className="text-blue-100 text-xs font-semibold">Attendu</Text>
            <Text className="text-white text-xl font-bold mt-0.5">
              {totalAttendu.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
            activeOpacity={0.7}
          >
            <Text className={`text-xs font-semibold ${filter === f ? 'text-white' : 'text-gray-500'}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
          renderItem={({ item }) => {
            const s = STATUS[item.statut] ?? STATUS.en_attente;
            const StatusIcon = s.icon;
            return (
              <TouchableOpacity
                className="bg-white rounded-2xl border border-gray-100 p-4"
                activeOpacity={0.85}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center">
                      <CreditCard size={16} color="#2563eb" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                        {item.locataire_prenom} {item.locataire_nom}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                        {item.appartement_nom}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {Number(item.montant_total).toLocaleString('fr-FR')} FCFA
                    </Text>
                    <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                      <StatusIcon size={10} color={s.text} />
                      <Text className="text-[10px] font-bold" style={{ color: s.text }}>{s.label}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center gap-1 mt-2.5">
                  <Calendar size={11} color="#9ca3af" />
                  <Text className="text-xs text-gray-400">
                    Échéance : {new Date(item.date_echeance).toLocaleDateString('fr-FR')}
                  </Text>
                  {item.date_paiement && (
                    <Text className="text-xs text-green-500 ml-3">
                      · Payé le {new Date(item.date_paiement).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <CreditCard size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucun paiement</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
