import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, MapPin, User, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const FILTERS = ['Tous', 'Actifs', 'Terminés'] as const;

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  actif: { bg: '#f0fdf4', text: '#16a34a', label: 'Actif' },
  termine: { bg: '#f9fafb', text: '#6b7280', label: 'Terminé' },
  resilie: { bg: '#fef2f2', text: '#dc2626', label: 'Résilié' },
};

export default function BailleurContracts() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');

  const { data, isLoading } = useQuery({
    queryKey: ['bailleur-contracts'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/');
      return data;
    },
  });

  const contracts = data?.results ?? [];

  const filtered = contracts.filter((c: any) => {
    if (filter === 'Tous') return true;
    if (filter === 'Actifs') return c.statut === 'actif';
    if (filter === 'Terminés') return c.statut === 'termine' || c.statut === 'resilie';
    return true;
  });

  const activeCount = contracts.filter((c: any) => c.statut === 'actif').length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes contrats</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Gestion de vos baux</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Stats */}
        <View className="flex-row gap-3">
          {[
            { label: 'Total', value: contracts.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Actifs', value: activeCount, color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Autres', value: contracts.length - activeCount, color: '#6b7280', bg: '#f9fafb' },
          ].map(({ label, value, color, bg }) => (
            <View key={label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
              <Text className="text-xl font-bold" style={{ color }}>
                {isLoading ? '—' : value}
              </Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">{label}</Text>
            </View>
          ))}
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
            <FileText size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucun contrat</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((c: any, i: number) => {
              const s = STATUS[c.statut] ?? STATUS.termine;
              return (
                <View
                  key={c.id}
                  className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                    <FileText size={15} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-900">{c.numero_contrat}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                      {c.locataire_nom && (
                        <View className="flex-row items-center gap-0.5">
                          <User size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">{c.locataire_nom}</Text>
                        </View>
                      )}
                      {c.appartement_nom && (
                        <View className="flex-row items-center gap-0.5">
                          <MapPin size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">{c.appartement_nom}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                      {Number(c.loyer_mensuel).toLocaleString('fr-FR')}
                    </Text>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</Text>
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
