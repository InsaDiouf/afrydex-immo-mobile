import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react-native';
import { api } from '@/lib/api';

interface Invoice {
  id: number;
  montant_total: number;
  statut: string;
  date_echeance: string;
  date_paiement?: string;
  type_facture?: string;
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  payee: { bg: '#f0fdf4', text: '#16a34a', label: 'Payé' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  en_retard: { bg: '#fef2f2', text: '#dc2626', label: 'En retard' },
  annulee: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

const FILTERS = ['Tous', 'En attente', 'Payés', 'En retard'] as const;

export default function LocataireRent() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');

  const { data, isLoading } = useQuery<{ results: Invoice[] }>({
    queryKey: ['locataire-invoices'],
    queryFn: async () => {
      const { data } = await api.get('/invoices/');
      return data;
    },
  });

  const invoices = data?.results ?? [];

  const filtered = invoices.filter(inv => {
    if (filter === 'Tous') return true;
    if (filter === 'En attente') return inv.statut === 'en_attente';
    if (filter === 'Payés') return inv.statut === 'payee';
    if (filter === 'En retard') return inv.statut === 'en_retard';
    return true;
  });

  const totalPaye = invoices.filter(i => i.statut === 'payee').reduce((a, i) => a + Number(i.montant_total), 0);
  const totalDu = invoices.filter(i => i.statut === 'en_attente' || i.statut === 'en_retard').reduce((a, i) => a + Number(i.montant_total), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes loyers</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Historique de vos paiements</Text>
      </View>

      {/* Summary */}
      <View className="flex-row gap-3 mx-4 mt-4">
        <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
          <View className="flex-row items-center gap-1.5 mb-1">
            <CheckCircle2 size={14} color="#16a34a" />
            <Text className="text-xs text-gray-400">Total payé</Text>
          </View>
          <Text className="text-xl font-bold text-green-600">{totalPaye.toLocaleString('fr-FR')}</Text>
          <Text className="text-[10px] text-gray-400">FCFA</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Clock size={14} color="#d97706" />
            <Text className="text-xs text-gray-400">Solde dû</Text>
          </View>
          <Text className={`text-xl font-bold ${totalDu > 0 ? 'text-amber-500' : 'text-green-500'}`}>
            {totalDu.toLocaleString('fr-FR')}
          </Text>
          <Text className="text-[10px] text-gray-400">FCFA</Text>
        </View>
      </View>

      {/* Filters */}
      <View className="flex-row gap-2 px-4 py-3">
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-green-600' : 'bg-white border border-gray-200'}`}
            activeOpacity={0.7}>
            <Text className={`text-xs font-semibold ${filter === f ? 'text-white' : 'text-gray-500'}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
          renderItem={({ item }) => {
            const s = STATUS[item.statut] ?? STATUS.en_attente;
            return (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-gray-900">
                    {Number(item.montant_total).toLocaleString('fr-FR')} FCFA
                  </Text>
                  <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg }}>
                    <Text className="text-xs font-bold" style={{ color: s.text }}>{s.label}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1 mt-2">
                  <Calendar size={11} color="#9ca3af" />
                  <Text className="text-xs text-gray-400">
                    Échéance : {new Date(item.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                {item.date_paiement && (
                  <Text className="text-xs text-green-500 mt-1">
                    Payé le {new Date(item.date_paiement).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </View>
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
