import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList, View, Text, ActivityIndicator, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, Plus, X, ChevronDown } from 'lucide-react-native';
import { api } from '@/lib/api';

interface MaintenanceItem {
  id: number;
  titre: string;
  description?: string;
  statut: string;
  priorite: string;
  date_signalement: string;
}

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  signale: { bg: '#fef9c3', text: '#ca8a04', label: 'Signalé' },
  en_cours: { bg: '#eff6ff', text: '#2563eb', label: 'En cours' },
  termine: { bg: '#f0fdf4', text: '#16a34a', label: 'Terminé' },
  annule: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

const PRIORITIES = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'haute', label: 'Haute' },
  { value: 'normale', label: 'Normale' },
  { value: 'basse', label: 'Basse' },
];

export default function LocataireMaintenance() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState('normale');

  const { data, isLoading } = useQuery<{ results?: MaintenanceItem[] } | MaintenanceItem[]>({
    queryKey: ['locataire-maintenance'],
    queryFn: async () => {
      const { data } = await api.get('/travaux/');
      return data;
    },
  });

  const items: MaintenanceItem[] = Array.isArray(data) ? data : (data as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: (payload: object) => api.post('/travaux/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locataire-maintenance'] });
      setShowForm(false);
      setTitre('');
      setDescription('');
      setPriorite('normale');
    },
  });

  const handleSubmit = () => {
    if (!titre.trim()) return;
    mutation.mutate({ titre, description, priorite });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xl font-bold text-gray-900">Signalements</Text>
          <Text className="text-xs text-gray-400 mt-0.5">{items.length} signalement(s)</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 px-3 py-2 bg-green-600 rounded-xl"
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="white" />
          <Text className="text-white text-xs font-bold">Signaler</Text>
        </TouchableOpacity>
      </View>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-gray-900">Nouveau signalement</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} className="p-1.5 bg-gray-100 rounded-xl">
                <X size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-xs font-semibold text-gray-500 mb-1.5">Titre *</Text>
              <TextInput
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                placeholder="Ex: Fuite d'eau dans la salle de bain"
                placeholderTextColor="#9ca3af"
                value={titre}
                onChangeText={setTitre}
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-gray-500 mb-1.5">Description</Text>
              <TextInput
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm"
                placeholder="Décrivez le problème..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: 'top', minHeight: 80 }}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-gray-500 mb-1.5">Priorité</Text>
              <View className="flex-row gap-2 flex-wrap">
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    onPress={() => setPriorite(p.value)}
                    className={`px-3 py-1.5 rounded-full border ${priorite === p.value ? 'bg-green-600 border-green-600' : 'border-gray-200 bg-white'}`}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-xs font-semibold ${priorite === p.value ? 'text-white' : 'text-gray-500'}`}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              className="w-full py-3.5 bg-green-600 rounded-xl items-center"
              onPress={handleSubmit}
              disabled={mutation.isPending || !titre.trim()}
              activeOpacity={0.85}
            >
              {mutation.isPending
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-semibold">Envoyer le signalement</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const s = STATUS[item.statut] ?? STATUS.signale;
            return (
              <View className="bg-white rounded-2xl border border-gray-100 p-4">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-row items-start gap-3 flex-1">
                    <View className="w-9 h-9 bg-amber-50 rounded-xl items-center justify-center flex-shrink-0 mt-0.5">
                      <Wrench size={16} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900">{item.titre}</Text>
                      {item.description && (
                        <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>{item.description}</Text>
                      )}
                      <Text className="text-xs text-gray-400 mt-1.5">
                        {new Date(item.date_signalement).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.bg }}>
                    <Text className="text-xs font-bold" style={{ color: s.text }}>{s.label}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Wrench size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">Aucun signalement</Text>
              <Text className="text-gray-300 text-xs mt-1">Appuyez sur "Signaler" pour créer un signalement</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
