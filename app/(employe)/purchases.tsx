import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Calendar, FileText, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  brouillon: { bg: '#f9fafb', text: '#6b7280', label: 'Brouillon' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  valide_responsable: { bg: '#eff6ff', text: '#2563eb', label: 'Validé resp.' },
  comptable: { bg: '#eff6ff', text: '#2563eb', label: 'Comptable' },
  validation_dg: { bg: '#fff7ed', text: '#ea580c', label: 'Validation DG' },
  approuve: { bg: '#f0fdf4', text: '#16a34a', label: 'Approuvé' },
  recue: { bg: '#f0fdf4', text: '#16a34a', label: 'Reçue' },
  paye: { bg: '#ecfdf5', text: '#059669', label: 'Payé' },
  refuse: { bg: '#fef2f2', text: '#dc2626', label: 'Refusé' },
  annule: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

const FILTERS = ['Tous', 'En attente', 'Approuvés', 'Refusés'] as const;

export default function EmployePurchases() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');

  const { data, isLoading } = useQuery({
    queryKey: ['employe-purchases'],
    queryFn: async () => {
      const { data } = await api.get('/purchase-requests/');
      return data;
    },
  });

  const requests = Array.isArray(data) ? data : (data?.results ?? []);

  const filtered = requests.filter((r: any) => {
    if (filter === 'Tous') return true;
    if (filter === 'En attente') return ['brouillon', 'en_attente', 'valide_responsable', 'comptable', 'validation_dg'].includes(r.etape_workflow);
    if (filter === 'Approuvés') return ['approuve', 'recue', 'paye'].includes(r.etape_workflow);
    if (filter === 'Refusés') return r.etape_workflow === 'refuse' || r.etape_workflow === 'annule';
    return true;
  });

  const totalApprouve = requests
    .filter((r: any) => ['approuve', 'recue', 'paye'].includes(r.etape_workflow))
    .reduce((a: number, r: any) => a + Number(r.montant_ttc ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Demandes d'achat</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Demandes d'approvisionnement</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Summary */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <ShoppingCart size={14} color="#d97706" />
              <Text className="text-xs font-semibold text-gray-400">Total</Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: '#d97706' }}>
              {isLoading ? '—' : requests.length}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle2 size={14} color="#16a34a" />
              <Text className="text-xs font-semibold text-gray-400">Approuvé</Text>
            </View>
            <Text className="text-xl font-bold" style={{ color: '#16a34a' }}>
              {isLoading ? '—' : totalApprouve.toLocaleString('fr-FR')}
            </Text>
            <Text className="text-[10px] text-gray-400">FCFA</Text>
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
                backgroundColor: filter === f ? '#d97706' : 'white',
                borderColor: filter === f ? '#d97706' : '#e5e7eb',
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
            <ActivityIndicator color="#d97706" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <ShoppingCart size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucune demande</Text>
          </View>
        ) : (
          <View className="space-y-3" style={{ gap: 10 }}>
            {filtered.map((r: any) => {
              const s = STATUS[r.etape_workflow] ?? STATUS.brouillon;
              return (
                <View key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                        {r.motif_principal || 'Sans motif'}
                      </Text>
                      <Text className="text-xs font-mono text-gray-400 mt-0.5">{r.numero_facture}</Text>
                      <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
                        <View className="flex-row items-center gap-1">
                          <Calendar size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {new Date(r.date_demande).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                        {r.categorie_achat && (
                          <View className="flex-row items-center gap-1">
                            <FileText size={10} color="#9ca3af" />
                            <Text className="text-[10px] text-gray-400">{r.categorie_achat}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="items-end gap-1.5">
                      <Text className="text-sm font-bold" style={{ color: '#d97706' }}>
                        {Number(r.montant_ttc ?? 0).toLocaleString('fr-FR')}
                      </Text>
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                        <Text className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</Text>
                      </View>
                    </View>
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
