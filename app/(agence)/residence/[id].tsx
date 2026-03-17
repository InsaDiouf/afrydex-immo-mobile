import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, MapPin, Building2, Home, Users, TrendingUp,
  Calendar, Layers, ChevronRight, ImageOff,
} from 'lucide-react-native';
import { api } from '@/lib/api';

interface Appartement {
  id: number;
  nom: string;
  type_bien: string;
  etage: number;
  superficie?: number;
  loyer_base: number;
  statut_occupation: string;
  photo_principale_url?: string | null;
}

interface Residence {
  id: number;
  nom: string;
  adresse: string;
  quartier: string;
  ville: string;
  pays: string;
  nombre_etages: number;
  nombre_appartements: number;
  statut: string;
  description?: string;
  date_construction?: string;
  taux_occupation?: number;
  photo_principale_url?: string | null;
  appartements?: Appartement[];
}

const OCCUPATION_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  libre: { bg: '#f0fdf4', text: '#16a34a', label: 'Libre' },
  occupe: { bg: '#eff6ff', text: '#2563eb', label: 'Occupé' },
  maintenance: { bg: '#fffbeb', text: '#d97706', label: 'Maintenance' },
  reserve: { bg: '#f5f3ff', text: '#7c3aed', label: 'Réservé' },
  hors_service: { bg: '#fef2f2', text: '#dc2626', label: 'Hors service' },
};

export default function ResidenceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: residence, isLoading } = useQuery<Residence>({
    queryKey: ['residence', id],
    queryFn: async () => {
      const { data } = await api.get(`/residences/${id}/`);
      return data;
    },
  });

  const { data: apparts } = useQuery<{ results: Appartement[] }>({
    queryKey: ['appartements', id],
    queryFn: async () => {
      const { data } = await api.get(`/appartements/?residence=${id}`);
      return data;
    },
    enabled: !!id,
  });

  const appartements = apparts?.results ?? [];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!residence) return null;

  const stats = [
    { label: 'Appartements', value: residence.nombre_appartements, icon: Home, color: '#2563eb', bg: '#eff6ff' },
    { label: 'Étages', value: residence.nombre_etages, icon: Layers, color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Occupation', value: `${residence.taux_occupation ?? 0}%`, icon: TrendingUp, color: '#16a34a', bg: '#f0fdf4' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover photo */}
        <View className="relative">
          {residence.photo_principale_url ? (
            <Image
              source={{ uri: residence.photo_principale_url }}
              className="w-full h-52"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-52 bg-blue-50 items-center justify-center">
              <Building2 size={48} color="#93c5fd" />
            </View>
          )}
          {/* Back button overlay */}
          <TouchableOpacity
            className="absolute top-4 left-4 w-9 h-9 bg-black/40 rounded-full items-center justify-center"
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
        </View>

        <View className="p-4 gap-4">
          {/* Header */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xl font-bold text-gray-900">{residence.nom}</Text>
            <View className="flex-row items-center gap-1.5 mt-1">
              <MapPin size={13} color="#9ca3af" />
              <Text className="text-sm text-gray-400">
                {residence.adresse}, {residence.quartier}, {residence.ville}
              </Text>
            </View>
            {residence.description ? (
              <Text className="text-sm text-gray-600 mt-3 leading-5">{residence.description}</Text>
            ) : null}
            {residence.date_construction && (
              <View className="flex-row items-center gap-1.5 mt-3">
                <Calendar size={13} color="#9ca3af" />
                <Text className="text-xs text-gray-400">
                  Construction : {new Date(residence.date_construction).getFullYear()}
                </Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View className="flex-row gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <View key={s.label} className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center">
                  <View className="w-9 h-9 rounded-xl items-center justify-center mb-2"
                    style={{ backgroundColor: s.bg }}>
                    <Icon size={16} color={s.color} />
                  </View>
                  <Text className="text-lg font-bold text-gray-900">{String(s.value)}</Text>
                  <Text className="text-[10px] text-gray-400 text-center mt-0.5">{s.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Appartements */}
          <View className="bg-white rounded-2xl border border-gray-100">
            <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
              <Text className="text-sm font-bold text-gray-900">Appartements</Text>
              <Text className="text-xs text-gray-400">{appartements.length} unité(s)</Text>
            </View>

            {appartements.length === 0 ? (
              <View className="items-center py-8">
                <Home size={32} color="#e5e7eb" />
                <Text className="text-gray-400 text-sm mt-2">Aucun appartement</Text>
              </View>
            ) : (
              appartements.map((apt, i) => {
                const occ = OCCUPATION_COLOR[apt.statut_occupation] ?? OCCUPATION_COLOR.libre;
                return (
                  <TouchableOpacity
                    key={apt.id}
                    className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(agence)/apartment/${apt.id}`)}
                  >
                    {apt.photo_principale_url ? (
                      <Image
                        source={{ uri: apt.photo_principale_url }}
                        className="w-12 h-12 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                        <Home size={18} color="#d1d5db" />
                      </View>
                    )}
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {apt.nom}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">
                        {apt.type_bien.toUpperCase()} · Étage {apt.etage}
                        {apt.superficie ? ` · ${apt.superficie} m²` : ''}
                      </Text>
                      <Text className="text-xs font-semibold text-blue-600 mt-1">
                        {Number(apt.loyer_base).toLocaleString('fr-FR')} FCFA/mois
                      </Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: occ.bg }}>
                        <Text className="text-[10px] font-bold" style={{ color: occ.text }}>
                          {occ.label}
                        </Text>
                      </View>
                      <ChevronRight size={14} color="#d1d5db" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
