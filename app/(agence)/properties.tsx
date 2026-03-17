import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, MapPin, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Residence {
  id: number;
  nom: string;
  quartier: string;
  ville: string;
  nombre_appartements: number;
  taux_occupation?: number;
  photo_principale_url?: string | null;
}

export default function PropertiesScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery<{ results: Residence[] }>({
    queryKey: ['residences'],
    queryFn: async () => {
      const { data } = await api.get('/residences/');
      return data;
    },
  });

  const residences = data?.results ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Propriétés</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{residences.length} résidence(s)</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={residences}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              activeOpacity={0.85}
              onPress={() => router.push(`/(agence)/residence/${item.id}`)}
            >
              {/* Cover photo */}
              {item.photo_principale_url ? (
                <Image
                  source={{ uri: item.photo_principale_url }}
                  className="w-full h-32"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-32 bg-blue-50 items-center justify-center">
                  <Building2 size={32} color="#93c5fd" />
                </View>
              )}

              <View className="p-4">
                <Text className="text-base font-bold text-gray-900">{item.nom}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin size={12} color="#9ca3af" />
                  <Text className="text-xs text-gray-400">{item.quartier}, {item.ville}</Text>
                </View>
                <View className="flex-row items-center justify-between mt-3">
                  <View className="flex-row items-center gap-1.5">
                    <Home size={14} color="#2563eb" />
                    <Text className="text-xs font-semibold text-blue-600">
                      {item.nombre_appartements} appart.
                    </Text>
                  </View>
                  {item.taux_occupation !== undefined && (
                    <View className="bg-green-50 px-2.5 py-1 rounded-full">
                      <Text className="text-xs font-bold text-green-600">
                        {item.taux_occupation}% occupé
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Building2 size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucune propriété</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
