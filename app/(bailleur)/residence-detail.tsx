import { useQuery } from '@tanstack/react-query';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Building2, Home, MapPin, ChevronRight,
  Calendar, Layers, TrendingUp,
} from 'lucide-react-native';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');

const OCC_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  disponible: { bg: '#f0fdf4', text: '#16a34a', label: 'Disponible' },
  libre: { bg: '#f0fdf4', text: '#16a34a', label: 'Disponible' },
  loue: { bg: '#eff6ff', text: '#2563eb', label: 'Loué' },
  occupe: { bg: '#eff6ff', text: '#2563eb', label: 'Loué' },
  en_travaux: { bg: '#fffbeb', text: '#d97706', label: 'En travaux' },
  maintenance: { bg: '#fffbeb', text: '#d97706', label: 'En travaux' },
  indisponible: { bg: '#f9fafb', text: '#6b7280', label: 'Indisponible' },
  reserve: { bg: '#f5f3ff', text: '#7c3aed', label: 'Réservé' },
};

export default function ResidenceDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: residence, isLoading: loadingRes } = useQuery({
    queryKey: ['bailleur-residence', id],
    queryFn: async () => {
      const { data } = await api.get(`/residences/${id}/`);
      return data;
    },
    enabled: !!id,
  });

  const { data: appsData, isLoading: loadingApps } = useQuery({
    queryKey: ['bailleur-residence-apps', id],
    queryFn: async () => {
      const { data } = await api.get('/appartements/', { params: { residence: id } });
      return data;
    },
    enabled: !!id,
  });

  const apartments = appsData?.results ?? [];
  const isLoading = loadingRes || loadingApps;
  const coverPhotos = (residence?.medias ?? []).filter((m: any) => m.type_media.startsWith('photo'));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1.5 rounded-xl bg-gray-100"
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {residence?.nom ?? '—'}
          </Text>
          <Text className="text-xs text-gray-400">Détail résidence</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : !residence ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-400 text-sm">Résidence introuvable.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, padding: 16 }}>

          {/* Photo principale */}
          {coverPhotos.length > 0 ? (
            <View className="rounded-2xl overflow-hidden" style={{ height: 200 }}>
              <Image
                source={{ uri: coverPhotos[0].fichier_url }}
                style={{ width: '100%', height: 200 }}
                resizeMode="cover"
              />
              {coverPhotos.length > 1 && (
                <View
                  className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  <Text className="text-white text-xs font-semibold">
                    +{coverPhotos.length - 1} photo{coverPhotos.length > 2 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-100 items-center justify-center" style={{ height: 100 }}>
              <Building2 size={40} color="#d1d5db" />
            </View>
          )}

          {/* Infos générales */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4 gap-3">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informations</Text>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-xs text-gray-400">Référence</Text>
                <Text className="text-sm font-semibold text-gray-900 mt-0.5">{residence.reference}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-400">Type</Text>
                <Text className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                  {residence.type_residence?.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              {residence.annee_construction ? (
                <View className="flex-1">
                  <Text className="text-xs text-gray-400">Année</Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Calendar size={12} color="#9ca3af" />
                    <Text className="text-sm font-semibold text-gray-900">{residence.annee_construction}</Text>
                  </View>
                </View>
              ) : null}
              {residence.nb_etages !== undefined && (
                <View className="flex-1">
                  <Text className="text-xs text-gray-400">Étages</Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Layers size={12} color="#9ca3af" />
                    <Text className="text-sm font-semibold text-gray-900">{residence.nb_etages}</Text>
                  </View>
                </View>
              )}
            </View>

            {(residence.adresse || residence.quartier || residence.ville) && (
              <View className="flex-row items-start gap-2 pt-3 border-t border-gray-100">
                <MapPin size={14} color="#9ca3af" style={{ marginTop: 2 }} />
                <Text className="text-sm text-gray-600 flex-1">
                  {[residence.adresse, residence.quartier, residence.ville].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {residence.description ? (
              <View className="pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-400 mb-1">Description</Text>
                <Text className="text-sm text-gray-600">{residence.description}</Text>
              </View>
            ) : null}
          </View>

          {/* Statistiques occupation */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center">
              <Text className="text-2xl font-bold text-blue-600">{residence.nb_appartements_total}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Total</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center">
              <Text className="text-2xl font-bold text-green-600">{residence.nb_appartements_disponibles}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Disponibles</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4 items-center">
              <Text className="text-2xl font-bold" style={{ color: '#2563eb' }}>{residence.nb_appartements_occupes}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">Loués</Text>
            </View>
          </View>

          {/* Taux d'occupation */}
          {residence.taux_occupation !== undefined && (
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <TrendingUp size={16} color="#7c3aed" />
                  <Text className="text-sm font-semibold text-gray-800">Taux d'occupation</Text>
                </View>
                <Text className="text-base font-bold" style={{ color: '#7c3aed' }}>{residence.taux_occupation}%</Text>
              </View>
              <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${residence.taux_occupation}%`, backgroundColor: '#7c3aed' }}
                />
              </View>
            </View>
          )}

          {/* Liste des appartements */}
          <View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Appartements</Text>
            {apartments.length === 0 ? (
              <View className="bg-white rounded-2xl border border-gray-100 p-8 items-center">
                <Home size={32} color="#d1d5db" />
                <Text className="text-gray-400 text-sm mt-2">Aucun appartement</Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {apartments.map((app: any, i: number) => {
                  const s = OCC_STATUS[app.statut_occupation] ?? OCC_STATUS.disponible;
                  return (
                    <TouchableOpacity
                      key={app.id}
                      className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/(bailleur)/appartement-detail', params: { id: app.id } })}
                    >
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
                      <View className="items-end gap-1 mr-1">
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
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
