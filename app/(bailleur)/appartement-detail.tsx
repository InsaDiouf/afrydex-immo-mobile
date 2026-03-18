import { useQuery } from '@tanstack/react-query';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, Home, MapPin, Maximize2, Bed, Bath,
  Calendar, User, FileText, Check, X,
} from 'lucide-react-native';
import { api } from '@/lib/api';

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

const CONTRACT_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  actif: { bg: '#f0fdf4', text: '#16a34a', label: 'Actif' },
  actif_impaye: { bg: '#fef2f2', text: '#dc2626', label: 'Actif (impayé)' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  resilié: { bg: '#f9fafb', text: '#6b7280', label: 'Résilié' },
  expire: { bg: '#f9fafb', text: '#6b7280', label: 'Expiré' },
};

function AmenityRow({ label, has }: { label: string; has: boolean }) {
  return (
    <View className="flex-row items-center gap-2 py-1">
      {has
        ? <Check size={14} color="#22c55e" />
        : <X size={14} color="#d1d5db" />
      }
      <Text className={`text-sm ${has ? 'text-gray-800' : 'text-gray-300'}`}>{label}</Text>
    </View>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-3 items-center gap-1">
      {icon}
      <Text className="text-base font-bold text-gray-900">{value}</Text>
      <Text className="text-[10px] text-gray-400">{label}</Text>
    </View>
  );
}

export default function AppartementDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: apartment, isLoading: loadingApp } = useQuery({
    queryKey: ['bailleur-appartement', id],
    queryFn: async () => {
      const { data } = await api.get(`/appartements/${id}/`);
      return data;
    },
    enabled: !!id,
  });

  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['bailleur-appartement-contracts', id],
    queryFn: async () => {
      const { data } = await api.get('/contracts/', { params: { appartement: id } });
      return data;
    },
    enabled: !!id,
  });

  const isLoading = loadingApp || loadingContracts;
  const contracts = contractsData?.results ?? [];
  const activeContract = contracts.find((c: any) => c.statut === 'actif' || c.statut === 'actif_impaye');
  const coverPhotos = (apartment?.medias ?? []).filter((m: any) => m.type_media.startsWith('photo'));

  const occ = apartment ? (OCC_STATUS[apartment.statut_occupation] ?? OCC_STATUS.disponible) : null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

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
            {apartment?.nom ?? '—'}
          </Text>
          {apartment?.residence_nom && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>{apartment.residence_nom}</Text>
          )}
        </View>
        {occ && (
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: occ.bg }}>
            <Text className="text-xs font-semibold" style={{ color: occ.text }}>{occ.label}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : !apartment ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-400 text-sm">Appartement introuvable.</Text>
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
            <View className="bg-white rounded-2xl border border-gray-100 items-center justify-center" style={{ height: 90 }}>
              <Home size={36} color="#d1d5db" />
            </View>
          )}

          {/* Localisation */}
          {(apartment.residence_adresse || apartment.residence_quartier || apartment.residence_ville) && (
            <View className="flex-row items-center gap-2 -mt-2">
              <MapPin size={13} color="#9ca3af" />
              <Text className="text-sm text-gray-500 flex-1" numberOfLines={1}>
                {[apartment.residence_adresse, apartment.residence_quartier, apartment.residence_ville].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Caractéristiques */}
          <View className="flex-row gap-2">
            {apartment.superficie && (
              <StatTile
                icon={<Maximize2 size={16} color="#9ca3af" />}
                value={`${apartment.superficie} m²`}
                label="Superficie"
              />
            )}
            {apartment.nb_pieces > 0 && (
              <StatTile
                icon={<Home size={16} color="#9ca3af" />}
                value={String(apartment.nb_pieces)}
                label="Pièces"
              />
            )}
            {apartment.nb_chambres > 0 && (
              <StatTile
                icon={<Bed size={16} color="#9ca3af" />}
                value={String(apartment.nb_chambres)}
                label="Chambres"
              />
            )}
            {apartment.nb_sdb > 0 && (
              <StatTile
                icon={<Bath size={16} color="#9ca3af" />}
                value={String(apartment.nb_sdb)}
                label="SdB"
              />
            )}
          </View>

          {/* Loyer */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Finances</Text>
            <View className="flex-row flex-wrap gap-y-3">
              <View style={{ width: '50%' }}>
                <Text className="text-xs text-gray-400">Loyer de base</Text>
                <Text className="text-base font-bold mt-0.5" style={{ color: '#7c3aed' }}>
                  {Number(apartment.loyer_base).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
              {apartment.charges && Number(apartment.charges) > 0 && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Charges</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(apartment.charges).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
              {apartment.loyer_total && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Loyer total</Text>
                  <Text className="text-base font-bold text-green-600 mt-0.5">
                    {Number(apartment.loyer_total).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
              {apartment.depot_garantie && Number(apartment.depot_garantie) > 0 && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Dépôt de garantie</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(apartment.depot_garantie).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Contrat actif */}
          {activeContract ? (
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contrat en cours</Text>
                {(() => {
                  const cs = CONTRACT_STATUS[activeContract.statut] ?? CONTRACT_STATUS.actif;
                  return (
                    <View className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: cs.bg }}>
                      <Text className="text-xs font-semibold" style={{ color: cs.text }}>{cs.label}</Text>
                    </View>
                  );
                })()}
              </View>

              <View className="flex-row items-center gap-2 mb-3">
                <User size={16} color="#9ca3af" />
                <View>
                  <Text className="text-xs text-gray-400">Locataire</Text>
                  <Text className="text-sm font-semibold text-gray-900">{activeContract.locataire_nom ?? '—'}</Text>
                </View>
              </View>

              <View className="flex-row gap-4 pt-3 border-t border-gray-100 mb-3">
                <View className="flex-row items-center gap-2 flex-1">
                  <Calendar size={14} color="#9ca3af" />
                  <View>
                    <Text className="text-xs text-gray-400">Début</Text>
                    <Text className="text-sm font-semibold text-gray-900">{formatDate(activeContract.date_debut)}</Text>
                  </View>
                </View>
                {activeContract.date_fin && (
                  <View className="flex-row items-center gap-2 flex-1">
                    <Calendar size={14} color="#9ca3af" />
                    <View>
                      <Text className="text-xs text-gray-400">Fin</Text>
                      <Text className="text-sm font-semibold text-gray-900">{formatDate(activeContract.date_fin)}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View className="pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-400">Loyer mensuel</Text>
                <Text className="text-base font-bold text-green-600 mt-0.5">
                  {Number(activeContract.loyer_mensuel).toLocaleString('fr-FR')} FCFA / mois
                </Text>
              </View>

              <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <FileText size={13} color="#9ca3af" />
                <Text className="text-xs text-gray-400">{activeContract.numero_contrat}</Text>
              </View>
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center">
              <FileText size={28} color="#d1d5db" />
              <Text className="text-gray-400 text-sm mt-2">Aucun contrat actif</Text>
            </View>
          )}

          {/* Équipements */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Équipements</Text>
            <View className="flex-row">
              <View className="flex-1">
                <AmenityRow label="Meublé" has={apartment.is_meuble} />
                <AmenityRow label="Balcon" has={apartment.has_balcon} />
                <AmenityRow label="Terrasse" has={apartment.has_terrasse} />
                <AmenityRow label="Parking" has={apartment.has_parking} />
                <AmenityRow label="Garage" has={apartment.has_garage} />
                <AmenityRow label="Climatisation" has={apartment.has_climatisation} />
              </View>
              <View className="flex-1">
                <AmenityRow label="Cuisine équipée" has={apartment.has_cuisine_equipee} />
                <AmenityRow label="Jardin" has={apartment.has_jardin} />
                <AmenityRow label="Ascenseur" has={apartment.has_ascenseur} />
                <AmenityRow label="Gardien" has={apartment.has_gardien} />
                <AmenityRow label="Piscine" has={apartment.has_piscine} />
                <AmenityRow label="Cave" has={apartment.has_cave} />
              </View>
            </View>
            {apartment.equipements_inclus ? (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-xs text-gray-400 mb-1">Équipements inclus</Text>
                <Text className="text-sm text-gray-600">{apartment.equipements_inclus}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {apartment.description ? (
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</Text>
              <Text className="text-sm text-gray-600 leading-5">{apartment.description}</Text>
            </View>
          ) : null}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
