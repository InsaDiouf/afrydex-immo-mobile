import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Home, MapPin, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  disponible: { bg: '#f0fdf4', text: '#16a34a', label: 'Disponible' },
  libre: { bg: '#f0fdf4', text: '#16a34a', label: 'Disponible' },
  loue: { bg: '#eff6ff', text: '#2563eb', label: 'Loué' },
  occupe: { bg: '#eff6ff', text: '#2563eb', label: 'Loué' },
  en_travaux: { bg: '#fffbeb', text: '#d97706', label: 'En travaux' },
  maintenance: { bg: '#fffbeb', text: '#d97706', label: 'En travaux' },
  indisponible: { bg: '#f9fafb', text: '#6b7280', label: 'Indisponible' },
  reserve: { bg: '#f5f3ff', text: '#7c3aed', label: 'Réservé' },
};

export default function BailleurProperties() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: residencesData, isLoading: loadingRes } = useQuery({
    queryKey: ['bailleur-residences'],
    queryFn: async () => {
      const { data } = await api.get('/residences/');
      return data;
    },
  });

  const { data: appsData, isLoading: loadingApps } = useQuery({
    queryKey: ['bailleur-appartements'],
    queryFn: async () => {
      const { data } = await api.get('/appartements/');
      return data;
    },
  });

  const residences = residencesData?.results ?? [];
  const appartements = appsData?.results ?? [];
  const isLoading = loadingRes || loadingApps;

  const getApps = (residenceId: number) =>
    appartements.filter((a: any) => a.residence === residenceId);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes biens</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Résidences & appartements</Text>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 10 }}>
        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: '#f5f3ff' }}>
              <Building2 size={18} color="#7c3aed" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{residences.length}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Résidences</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: '#eff6ff' }}>
              <Home size={18} color="#2563eb" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{appartements.length}</Text>
            <Text className="text-xs text-gray-400 mt-0.5">Appartements</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator color="#7c3aed" />
          </View>
        ) : residences.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <Building2 size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucune résidence</Text>
          </View>
        ) : (
          residences.map((res: any) => {
            const apps = getApps(res.id);
            const isOpen = expandedId === res.id;
            return (
              <View key={res.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center gap-3 p-4"
                  activeOpacity={0.7}
                  onPress={() => setExpandedId(isOpen ? null : res.id)}
                >
                  {/* Photo ou icône résidence */}
                  <View className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: '#f5f3ff' }}>
                    {res.photo_principale_url ? (
                      <Image
                        source={{ uri: res.photo_principale_url }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Building2 size={20} color="#7c3aed" />
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-sm">{res.nom}</Text>
                    {res.adresse && (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <MapPin size={10} color="#9ca3af" />
                        <Text className="text-xs text-gray-400" numberOfLines={1}>
                          {res.adresse}{res.ville ? `, ${res.ville}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center gap-2">
                    {/* Bouton détail */}
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: '/(bailleur)/residence-detail', params: { id: res.id } });
                      }}
                    >
                      <ChevronRight size={18} color="#7c3aed" />
                    </TouchableOpacity>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f3ff' }}>
                      <Text className="text-xs font-semibold" style={{ color: '#7c3aed' }}>{apps.length} appt</Text>
                    </View>
                    {isOpen
                      ? <ChevronUp size={16} color="#9ca3af" />
                      : <ChevronDown size={16} color="#9ca3af" />
                    }
                  </View>
                </TouchableOpacity>

                {isOpen && apps.length > 0 && (
                  <View className="border-t border-gray-100">
                    {apps.map((app: any, i: number) => {
                      const s = STATUS[app.statut_occupation] ?? STATUS.disponible;
                      return (
                        <TouchableOpacity
                          key={app.id}
                          className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                          activeOpacity={0.7}
                          onPress={() => router.push({ pathname: '/(bailleur)/appartement-detail', params: { id: app.id } })}
                        >
                          {/* Photo ou icône appartement */}
                          <View className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                            {app.photo_principale_url ? (
                              <Image
                                source={{ uri: app.photo_principale_url }}
                                style={{ width: 40, height: 40 }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View className="w-full h-full items-center justify-center">
                                <Home size={16} color="#2563eb" />
                              </View>
                            )}
                          </View>

                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-800">{app.nom}</Text>
                            <Text className="text-xs text-gray-400 mt-0.5">
                              {app.superficie ? `${app.superficie} m²` : ''}
                              {app.nb_pieces ? ` · ${app.nb_pieces} pièces` : ''}
                            </Text>
                          </View>

                          <View className="items-end gap-1">
                            <Text className="text-sm font-bold" style={{ color: '#7c3aed' }}>
                              {Number(app.loyer_base).toLocaleString('fr-FR')}
                            </Text>
                            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                              <Text className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</Text>
                            </View>
                          </View>
                          <ChevronRight size={14} color="#9ca3af" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                {isOpen && apps.length === 0 && (
                  <View className="border-t border-gray-100 px-4 py-3 items-center">
                    <Text className="text-xs text-gray-400">Aucun appartement</Text>
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
