import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Receipt, ClipboardList, Building2, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function BailleurDocuments() {
  const router = useRouter();

  const { data: contractsData } = useQuery({
    queryKey: ['bailleur-contracts-docs'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/', { params: { statut: 'actif' } });
      return data;
    },
  });

  const contracts = contractsData?.results ?? [];

  const staticDocs = [
    {
      label: 'Relevés de loyers',
      desc: 'Historique des encaissements',
      icon: Receipt,
      color: '#16a34a',
      bg: '#f0fdf4',
      route: '/(bailleur)/payments',
    },
    {
      label: 'Mes baux actifs',
      desc: `${contracts.length} contrat(s) en cours`,
      icon: FileText,
      color: '#2563eb',
      bg: '#eff6ff',
      route: '/(bailleur)/contracts',
    },
    {
      label: 'Inventaire des biens',
      desc: 'Résidences et appartements',
      icon: Building2,
      color: '#7c3aed',
      bg: '#f5f3ff',
      route: '/(bailleur)/properties',
    },
    {
      label: 'États des lieux',
      desc: 'Documents de remise de clés',
      icon: ClipboardList,
      color: '#d97706',
      bg: '#fffbeb',
      route: null,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Documents</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Vos documents propriétaire</Text>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 12 }}>
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {staticDocs.map((doc, i) => {
            const Icon = doc.icon;
            return (
              <TouchableOpacity
                key={doc.label}
                className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                activeOpacity={doc.route ? 0.7 : 1}
                onPress={() => doc.route && router.push(doc.route as any)}
              >
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: doc.bg }}>
                  <Icon size={18} color={doc.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">{doc.label}</Text>
                  <Text className="text-xs text-gray-400 mt-0.5">{doc.desc}</Text>
                </View>
                {doc.route ? (
                  <ChevronRight size={16} color="#d1d5db" />
                ) : (
                  <View className="px-2 py-1 rounded-full bg-gray-100">
                    <Text className="text-[10px] text-gray-400 font-semibold">Bientôt</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Per-contract PDFs */}
        {contracts.length > 0 && (
          <>
            <Text className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Baux en cours
            </Text>
            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {contracts.map((c: any, i: number) => (
                <View
                  key={c.id}
                  className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                    <FileText size={18} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{c.numero_contrat}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {c.locataire_nom ?? '—'} · {c.appartement_nom ?? '—'}
                    </Text>
                  </View>
                  <View className="px-2 py-1 rounded-full bg-gray-100">
                    <Text className="text-[10px] text-gray-400 font-semibold">PDF</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
