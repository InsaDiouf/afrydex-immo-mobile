import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList, MapPin, Calendar, AlertTriangle, Play } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const PRIORITY: Record<string, { bg: string; text: string; label: string }> = {
  urgente: { bg: '#fef2f2', text: '#dc2626', label: 'Urgente' },
  haute: { bg: '#fff7ed', text: '#ea580c', label: 'Haute' },
  normale: { bg: '#eff6ff', text: '#2563eb', label: 'Normale' },
  basse: { bg: '#f9fafb', text: '#6b7280', label: 'Basse' },
};

const STATUS_DOT: Record<string, string> = {
  complete: '#22c55e', valide: '#22c55e',
  en_cours: '#3b82f6',
  signale: '#f59e0b', planifie: '#a855f7', assigne: '#f59e0b',
  annule: '#d1d5db',
};

const FILTERS = ['Tous', "Aujourd'hui", 'À venir', 'En cours', 'Planifiés', 'Terminés'] as const;

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isFuture(dateStr: string): boolean {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return d.getTime() > t.getTime();
}

export default function EmployeTasks() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employe-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/travaux/');
      return data;
    },
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/employee-dashboard/${id}/start_work/`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employe-tasks'] }),
  });

  const travaux: any[] = Array.isArray(data) ? data : (data?.results ?? []);

  const todayWork = travaux.filter(t => t.date_prevue && isToday(t.date_prevue));
  const upcomingWork = travaux.filter(t => t.date_prevue && isFuture(t.date_prevue));
  const completed = travaux.filter(t => t.statut === 'complete' || t.statut === 'valide');

  const displayed = (() => {
    if (filter === "Aujourd'hui") return todayWork;
    if (filter === 'À venir') return upcomingWork;
    if (filter === 'En cours') return travaux.filter(t => t.statut === 'en_cours');
    if (filter === 'Planifiés') return travaux.filter(t => ['planifie', 'signale', 'assigne'].includes(t.statut));
    if (filter === 'Terminés') return completed;
    return travaux;
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes tâches</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Travaux assignés</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Summary */}
        <View className="flex-row gap-3">
          {[
            { label: "Aujourd'hui", value: todayWork.length, color: '#d97706' },
            { label: 'À venir', value: upcomingWork.length, color: '#2563eb' },
            { label: 'Terminés', value: completed.length, color: '#16a34a' },
          ].map(({ label, value, color }) => (
            <View key={label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
              <Text className="text-xl font-bold" style={{ color }}>
                {isLoading ? '—' : value}
              </Text>
              <Text className="text-[10px] text-gray-400 text-center mt-0.5">{label}</Text>
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
        ) : displayed.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <ClipboardList size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucune tâche</Text>
          </View>
        ) : (
          displayed.map((task: any) => {
            const p = PRIORITY[task.priorite] ?? PRIORITY.normale;
            const dot = STATUS_DOT[task.statut] ?? '#d1d5db';
            const canStart = task.statut === 'signale' || task.statut === 'planifie' || task.statut === 'assigne';
            return (
              <View key={task.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-start gap-3">
                  <View className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="text-sm font-bold text-gray-900 flex-1" numberOfLines={2}>
                        {task.titre}
                      </Text>
                      <View className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.bg }}>
                        <Text className="text-[10px] font-semibold" style={{ color: p.text }}>{p.label}</Text>
                      </View>
                    </View>
                    {task.description ? (
                      <Text className="text-xs text-gray-400 mt-1" numberOfLines={2}>{task.description}</Text>
                    ) : null}
                    <View className="flex-row items-center gap-3 mt-2 flex-wrap">
                      {(task.appartement_nom || task.residence_nom) && (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {task.appartement_nom ?? task.residence_nom}
                          </Text>
                        </View>
                      )}
                      {task.date_prevue && (
                        <View className="flex-row items-center gap-1">
                          <Calendar size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {new Date(task.date_prevue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                      )}
                      {task.est_en_retard && (
                        <View className="flex-row items-center gap-1">
                          <AlertTriangle size={10} color="#dc2626" />
                          <Text className="text-[10px] font-semibold" style={{ color: '#dc2626' }}>En retard</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {canStart && (
                  <View className="mt-3 pt-3 border-t border-gray-100 items-end">
                    <TouchableOpacity
                      onPress={() => startMutation.mutate(task.id)}
                      disabled={startMutation.isPending}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: '#d97706', opacity: startMutation.isPending ? 0.6 : 1 }}
                      activeOpacity={0.8}
                    >
                      <Play size={12} color="white" />
                      <Text className="text-xs font-semibold text-white">Démarrer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
