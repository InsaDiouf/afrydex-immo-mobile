import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Calendar, User, AlertCircle, CheckCircle2, Clock, Wrench, Camera } from 'lucide-react-native';
import { api } from '@/lib/api';

interface Maintenance {
  id: number;
  titre: string;
  description?: string;
  statut: string;
  priorite: string;
  type_travail?: string;
  date_signalement: string;
  date_intervention?: string;
  date_resolution?: string;
  appartement_nom?: string;
  residence_nom?: string;
  signale_par_nom?: string;
  assigne_a_nom?: string;
  cout_prevu?: number;
  cout_reel?: number;
  notes_resolution?: string;
  medias?: { id: number; fichier_url: string }[];
}

const PRIORITY: Record<string, { bg: string; text: string; label: string }> = {
  urgente: { bg: '#fef2f2', text: '#dc2626', label: 'Urgente' },
  haute: { bg: '#fff7ed', text: '#ea580c', label: 'Haute' },
  normale: { bg: '#eff6ff', text: '#2563eb', label: 'Normale' },
  basse: { bg: '#f9fafb', text: '#6b7280', label: 'Basse' },
};

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  signale: { bg: '#fef9c3', text: '#ca8a04', label: 'Signalé' },
  en_cours: { bg: '#eff6ff', text: '#2563eb', label: 'En cours' },
  termine: { bg: '#f0fdf4', text: '#16a34a', label: 'Terminé' },
  annule: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

export default function MaintenanceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: item, isLoading } = useQuery<Maintenance>({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const { data } = await api.get(`/maintenance/${id}/`);
      return data;
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!item) return null;

  const priority = PRIORITY[item.priorite] ?? PRIORITY.normale;
  const status = STATUS[item.statut] ?? STATUS.signale;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{item.titre}</Text>
          <Text className="text-xs text-gray-400">Détail intervention</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: priority.bg }}>
            <Text className="text-xs font-bold" style={{ color: priority.text }}>{priority.label}</Text>
          </View>
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
            <Text className="text-xs font-bold" style={{ color: status.text }}>{status.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Location */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Localisation</Text>
          <View className="flex-row items-center gap-2">
            <MapPin size={16} color="#9ca3af" />
            <View>
              <Text className="text-sm font-semibold text-gray-900">{item.appartement_nom ?? '—'}</Text>
              {item.residence_nom && <Text className="text-xs text-gray-400 mt-0.5">{item.residence_nom}</Text>}
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</Text>
            <Text className="text-sm text-gray-600 leading-5">{item.description}</Text>
          </View>
        )}

        {/* Timeline */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Chronologie</Text>
          {[
            { label: 'Signalement', date: item.date_signalement, icon: AlertCircle, color: '#d97706' },
            { label: 'Intervention', date: item.date_intervention, icon: Wrench, color: '#2563eb' },
            { label: 'Résolution', date: item.date_resolution, icon: CheckCircle2, color: '#16a34a' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <View key={t.label} className="flex-row items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <View className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: t.date ? t.color + '15' : '#f9fafb' }}>
                  <Icon size={14} color={t.date ? t.color : '#d1d5db'} />
                </View>
                <View>
                  <Text className="text-xs text-gray-400">{t.label}</Text>
                  <Text className={`text-sm font-semibold ${t.date ? 'text-gray-900' : 'text-gray-300'}`}>
                    {formatDate(t.date)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Personnes */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personnes</Text>
          {[
            { label: 'Signalé par', value: item.signale_par_nom },
            { label: 'Assigné à', value: item.assigne_a_nom },
          ].map((r) => (
            <View key={r.label} className="flex-row items-center gap-2 py-2 border-b border-gray-50 last:border-0">
              <User size={14} color="#9ca3af" />
              <Text className="text-xs text-gray-400 w-24">{r.label}</Text>
              <Text className="text-sm font-semibold text-gray-900">{r.value ?? '—'}</Text>
            </View>
          ))}
        </View>

        {/* Coûts */}
        {(item.cout_prevu !== undefined || item.cout_reel !== undefined) && (
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Coûts</Text>
            {[
              { label: 'Coût prévu', value: item.cout_prevu },
              { label: 'Coût réel', value: item.cout_reel },
            ].map((r) => (
              <View key={r.label} className="flex-row justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <Text className="text-sm text-gray-600">{r.label}</Text>
                <Text className="text-sm font-bold text-gray-900">
                  {r.value !== undefined ? `${Number(r.value).toLocaleString('fr-FR')} FCFA` : '—'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes résolution */}
        {item.notes_resolution && (
          <View className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <Text className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Notes de résolution</Text>
            <Text className="text-sm text-green-800 leading-5">{item.notes_resolution}</Text>
          </View>
        )}

        {/* Photos */}
        {item.medias && item.medias.length > 0 && (
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Camera size={14} color="#6b7280" />
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Photos ({item.medias.length})
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {item.medias.map((m) => (
                <Image
                  key={m.id}
                  source={{ uri: m.fichier_url }}
                  className="rounded-xl"
                  style={{ width: 80, height: 80 }}
                  resizeMode="cover"
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
