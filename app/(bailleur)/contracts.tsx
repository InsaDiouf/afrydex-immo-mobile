import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, MapPin, User, CheckCircle2, Clock, XCircle, ChevronRight, PauseCircle } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const FILTERS = ['Tous', 'Actifs', 'En cours', 'Expirés', 'Résiliés'] as const;

const STATUT: Record<string, { bg: string; text: string; label: string }> = {
  actif:     { bg: '#f0fdf4', text: '#16a34a', label: 'Actif' },
  expire:    { bg: '#f9fafb', text: '#6b7280', label: 'Expiré' },
  resilie:   { bg: '#fef2f2', text: '#dc2626', label: 'Résilié' },
  suspendu:  { bg: '#fff7ed', text: '#ea580c', label: 'Suspendu' },
  renouvele: { bg: '#eff6ff', text: '#2563eb', label: 'Renouvelé' },
  brouillon: { bg: '#fffbeb', text: '#d97706', label: 'En cours' },
};

const WORKFLOW_COLORS: Record<string, { bg: string; text: string }> = {
  verification_dossier: { bg: '#fffbeb', text: '#d97706' },
  attente_facture:      { bg: '#fff7ed', text: '#ea580c' },
  facture_validee:      { bg: '#eff6ff', text: '#2563eb' },
  redaction_contrat:    { bg: '#eef2ff', text: '#4338ca' },
  visite_entree:        { bg: '#f5f3ff', text: '#7c3aed' },
  remise_cles:          { bg: '#ecfeff', text: '#0891b2' },
  termine:              { bg: '#f0fdf4', text: '#16a34a' },
};

export default function BailleurContracts() {
  const router = useRouter();
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
    if (filter === 'En cours') return c.statut === 'brouillon';
    if (filter === 'Expirés') return c.statut === 'expire';
    if (filter === 'Résiliés') return c.statut === 'resilie';
    return true;
  });

  const activeCount = contracts.filter((c: any) => c.statut === 'actif').length;
  const enCoursCount = contracts.filter((c: any) => c.statut === 'brouillon').length;

  const getBadge = (c: any) => {
    if (c.statut === 'brouillon' && c.workflow_etape && c.workflow_etape_display) {
      return { ...(WORKFLOW_COLORS[c.workflow_etape] ?? WORKFLOW_COLORS.verification_dossier), label: c.workflow_etape_display };
    }
    return STATUT[c.statut] ?? STATUT.brouillon;
  };

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
            { label: 'Total',    value: contracts.length, color: '#2563eb' },
            { label: 'Actifs',   value: activeCount,      color: '#16a34a' },
            { label: 'En cours', value: enCoursCount,     color: '#d97706' },
          ].map(({ label, value, color }) => (
            <View key={label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
              <Text className="text-xl font-bold" style={{ color }}>{isLoading ? '—' : value}</Text>
              <Text className="text-[10px] text-gray-400 mt-0.5">{label}</Text>
            </View>
          ))}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: filter === f ? '#7c3aed' : 'white', borderColor: filter === f ? '#7c3aed' : '#e5e7eb' }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold" style={{ color: filter === f ? 'white' : '#6b7280' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
              const badge = getBadge(c);
              return (
                <TouchableOpacity
                  key={c.id}
                  className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/(bailleur)/contrat-detail', params: { id: c.id } })}
                >
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                    <FileText size={15} color="#2563eb" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-bold text-gray-900">{c.numero_contrat}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                      {c.locataire_nom && (
                        <View className="flex-row items-center gap-0.5">
                          <User size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400" numberOfLines={1}>{c.locataire_nom}</Text>
                        </View>
                      )}
                      {c.appartement_nom && (
                        <View className="flex-row items-center gap-0.5">
                          <MapPin size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400" numberOfLines={1}>{c.appartement_nom}</Text>
                        </View>
                      )}
                    </View>
                    {/* Mini barre progression si en cours */}
                    {c.statut === 'brouillon' && c.workflow_progression != null && (
                      <View className="flex-row items-center gap-2 mt-1.5">
                        <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                          <View className="h-full rounded-full" style={{ width: `${c.workflow_progression}%`, backgroundColor: '#7c3aed' }} />
                        </View>
                        <Text className="text-[10px] font-semibold text-gray-400">{c.workflow_progression}%</Text>
                      </View>
                    )}
                  </View>
                  <View className="items-end gap-1.5 ml-1">
                    <Text className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                      {Number(c.loyer_mensuel).toLocaleString('fr-FR')}
                    </Text>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: badge.bg }}>
                      <Text className="text-[10px] font-semibold" style={{ color: badge.text }}>{badge.label}</Text>
                    </View>
                  </View>
                  <ChevronRight size={14} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
