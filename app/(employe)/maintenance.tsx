import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, MapPin, Calendar, AlertTriangle } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const PRIORITY: Record<string, { bg: string; text: string; label: string }> = {
  urgente: { bg: '#fef2f2', text: '#dc2626', label: 'Urgente' },
  haute: { bg: '#fff7ed', text: '#ea580c', label: 'Haute' },
  normale: { bg: '#eff6ff', text: '#2563eb', label: 'Normale' },
  basse: { bg: '#f9fafb', text: '#6b7280', label: 'Basse' },
};

const STATUS: Record<string, { dot: string; label: string }> = {
  signale: { dot: '#f59e0b', label: 'Signalé' },
  planifie: { dot: '#a855f7', label: 'Planifié' },
  en_cours: { dot: '#3b82f6', label: 'En cours' },
  complete: { dot: '#22c55e', label: 'Terminé' },
  valide: { dot: '#22c55e', label: 'Validé' },
  annule: { dot: '#d1d5db', label: 'Annulé' },
};

const FILTERS = ['Tous', 'En cours', 'Planifiés', 'Terminés'] as const;

export default function EmployeMaintenance() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');

  const { data, isLoading } = useQuery({
    queryKey: ['employe-travaux'],
    queryFn: async () => {
      const { data } = await api.get('/travaux/');
      return data;
    },
  });

  const travaux = Array.isArray(data) ? data : (data?.results ?? []);

  const filtered = travaux.filter((t: any) => {
    if (filter === 'Tous') return true;
    if (filter === 'En cours') return t.statut === 'en_cours';
    if (filter === 'Planifiés') return t.statut === 'planifie' || t.statut === 'signale';
    if (filter === 'Terminés') return t.statut === 'complete' || t.statut === 'valide';
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes travaux</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Interventions de maintenance</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
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
            <Wrench size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucun travail</Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {filtered.map((t: any, i: number) => {
              const p = PRIORITY[t.priorite] ?? PRIORITY.normale;
              const s = STATUS[t.statut] ?? { dot: '#d1d5db', label: t.statut };
              return (
                <View
                  key={t.id}
                  className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <View className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-sm font-bold text-gray-900 flex-shrink" numberOfLines={1}>
                        {t.titre}
                      </Text>
                      {t.est_en_retard && (
                        <AlertTriangle size={12} color="#dc2626" />
                      )}
                    </View>
                    <View className="flex-row items-center gap-3 mt-0.5 flex-wrap">
                      {(t.appartement_nom || t.residence_nom) && (
                        <View className="flex-row items-center gap-0.5">
                          <MapPin size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {t.appartement_nom ?? t.residence_nom}
                          </Text>
                        </View>
                      )}
                      {t.date_prevue && (
                        <View className="flex-row items-center gap-0.5">
                          <Calendar size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[10px] text-gray-400">{s.label}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: p.bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: p.text }}>{p.label}</Text>
                    </View>
                    <Text className="text-[10px] font-mono text-gray-400">{t.numero_travail}</Text>
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
