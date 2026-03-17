import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Clock, Calendar, CheckCircle2, CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const FILTERS = ['Tous', 'Payés', 'En attente', 'En retard'] as const;

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  payee: { bg: '#f0fdf4', text: '#16a34a', label: 'Payé' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  en_retard: { bg: '#fef2f2', text: '#dc2626', label: 'En retard' },
  annulee: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

export default function BailleurPayments() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');

  const { data, isLoading } = useQuery({
    queryKey: ['bailleur-invoices'],
    queryFn: async () => {
      const { data } = await api.get('/invoices/');
      return data;
    },
  });

  const invoices = data?.results ?? [];

  const filtered = invoices.filter((inv: any) => {
    if (filter === 'Tous') return true;
    if (filter === 'Payés') return inv.statut === 'payee';
    if (filter === 'En attente') return inv.statut === 'en_attente';
    if (filter === 'En retard') return inv.statut === 'en_retard';
    return true;
  });

  const totalEncaisse = invoices
    .filter((i: any) => i.statut === 'payee')
    .reduce((a: number, i: any) => a + Number(i.montant_ttc), 0);
  const totalDu = invoices
    .filter((i: any) => i.statut !== 'payee' && i.statut !== 'annulee')
    .reduce((a: number, i: any) => a + Number(i.montant_ttc), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes revenus</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Suivi des encaissements</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Summary */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <TrendingUp size={14} color="#16a34a" />
              <Text className="text-xs font-semibold text-gray-400">Encaissé</Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: '#16a34a' }}>
              {isLoading ? '—' : totalEncaisse.toLocaleString('fr-FR')}
            </Text>
            <Text className="text-xs text-gray-400">FCFA</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Clock size={14} color="#d97706" />
              <Text className="text-xs font-semibold text-gray-400">En attente</Text>
            </View>
            <Text
              className="text-2xl font-bold"
              style={{ color: totalDu > 0 ? '#d97706' : '#16a34a' }}
            >
              {isLoading ? '—' : totalDu.toLocaleString('fr-FR')}
            </Text>
            <Text className="text-xs text-gray-400">FCFA</Text>
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2 flex-wrap">
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full border"
              style={{
                backgroundColor: filter === f ? '#7c3aed' : 'white',
                borderColor: filter === f ? '#7c3aed' : '#e5e7eb',
              }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold" style={{ color: filter === f ? 'white' : '#6b7280' }}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <CreditCard size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucun paiement</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((inv: any, i: number) => {
              const s = STATUS[inv.statut] ?? STATUS.en_attente;
              return (
                <View
                  key={inv.id}
                  className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#f5f3ff' }}>
                    <CreditCard size={15} color="#7c3aed" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">
                      {Number(inv.montant_ttc).toLocaleString('fr-FR')} FCFA
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Calendar size={10} color="#9ca3af" />
                      <Text className="text-[10px] text-gray-400">
                        {new Date(inv.date_echeance).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</Text>
                    </View>
                    {inv.is_paid && <CheckCircle2 size={12} color="#16a34a" />}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
