import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Home, Layers, Maximize2, BedDouble, Bath,
  Sofa, Car, Wind, ChevronRight, FileText, Wrench,
} from 'lucide-react-native';
import { api } from '@/lib/api';

interface Appartement {
  id: number;
  nom: string;
  type_bien: string;
  etage: number;
  superficie?: number;
  nb_pieces: number;
  nb_chambres: number;
  nb_sdb: number;
  loyer_base: number;
  charges: number;
  depot_garantie: number;
  statut_occupation: string;
  mode_location: string;
  is_meuble: boolean;
  has_balcon: boolean;
  has_parking: boolean;
  has_climatisation: boolean;
  has_cuisine_equipee: boolean;
  description?: string;
  photo_principale_url?: string | null;
  residence_nom?: string;
}

const OCCUPATION_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  libre: { bg: '#f0fdf4', text: '#16a34a', label: 'Libre' },
  occupe: { bg: '#eff6ff', text: '#2563eb', label: 'Occupé' },
  maintenance: { bg: '#fffbeb', text: '#d97706', label: 'Maintenance' },
  reserve: { bg: '#f5f3ff', text: '#7c3aed', label: 'Réservé' },
  hors_service: { bg: '#fef2f2', text: '#dc2626', label: 'Hors service' },
};

export default function ApartmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: apt, isLoading } = useQuery<Appartement>({
    queryKey: ['apartment', id],
    queryFn: async () => {
      const { data } = await api.get(`/appartements/${id}/`);
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

  if (!apt) return null;

  const occ = OCCUPATION_COLOR[apt.statut_occupation] ?? OCCUPATION_COLOR.libre;

  const amenities = [
    { key: 'is_meuble', label: 'Meublé', icon: Sofa },
    { key: 'has_balcon', label: 'Balcon', icon: Layers },
    { key: 'has_parking', label: 'Parking', icon: Car },
    { key: 'has_climatisation', label: 'Clim.', icon: Wind },
  ] as const;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View className="relative">
          {apt.photo_principale_url ? (
            <Image source={{ uri: apt.photo_principale_url }} className="w-full h-52" resizeMode="cover" />
          ) : (
            <View className="w-full h-52 bg-blue-50 items-center justify-center">
              <Home size={48} color="#93c5fd" />
            </View>
          )}
          <TouchableOpacity
            className="absolute top-4 left-4 w-9 h-9 bg-black/40 rounded-full items-center justify-center"
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color="white" />
          </TouchableOpacity>
          <View className="absolute top-4 right-4 px-3 py-1 rounded-full" style={{ backgroundColor: occ.bg }}>
            <Text className="text-xs font-bold" style={{ color: occ.text }}>{occ.label}</Text>
          </View>
        </View>

        <View className="p-4 gap-4">
          {/* Header */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">{apt.nom}</Text>
                {apt.residence_nom && (
                  <Text className="text-sm text-gray-400 mt-0.5">{apt.residence_nom}</Text>
                )}
              </View>
              <Text className="text-lg font-bold text-blue-600">
                {Number(apt.loyer_base).toLocaleString('fr-FR')}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 text-right">FCFA / mois</Text>

            {/* Key specs row */}
            <View className="flex-row gap-3 mt-4 pt-4 border-t border-gray-50">
              {[
                { icon: Layers, label: `Étage ${apt.etage}` },
                { icon: Maximize2, label: apt.superficie ? `${apt.superficie} m²` : '—' },
                { icon: BedDouble, label: `${apt.nb_chambres} ch.` },
                { icon: Bath, label: `${apt.nb_sdb} SDB` },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <View key={s.label} className="flex-1 items-center">
                    <Icon size={16} color="#6b7280" />
                    <Text className="text-xs text-gray-500 mt-1 text-center">{s.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tarification */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tarification</Text>
            {[
              { label: 'Loyer de base', value: apt.loyer_base },
              { label: 'Charges', value: apt.charges },
              { label: 'Dépôt de garantie', value: apt.depot_garantie },
            ].map((r) => (
              <View key={r.label} className="flex-row justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <Text className="text-sm text-gray-600">{r.label}</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {Number(r.value).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            ))}
          </View>

          {/* Équipements */}
          <View className="flex-row flex-wrap gap-2">
            {amenities.map(({ key, label, icon: Icon }) => {
              const active = (apt as any)[key];
              if (!active) return null;
              return (
                <View key={key} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
                  <Icon size={12} color="#2563eb" />
                  <Text className="text-xs font-semibold text-blue-600">{label}</Text>
                </View>
              );
            })}
          </View>

          {/* Description */}
          {apt.description ? (
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</Text>
              <Text className="text-sm text-gray-600 leading-5">{apt.description}</Text>
            </View>
          ) : null}

          {/* Quick actions */}
          <View className="bg-white rounded-2xl border border-gray-100">
            {[
              { label: 'Voir les contrats', icon: FileText, color: '#2563eb' },
              { label: 'Interventions maintenance', icon: Wrench, color: '#d97706' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.color + '15' }}>
                    <Icon size={16} color={item.color} />
                  </View>
                  <Text className="flex-1 text-sm font-semibold text-gray-800">{item.label}</Text>
                  <ChevronRight size={16} color="#d1d5db" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
