import { useQuery } from '@tanstack/react-query';
import { View, Text, ActivityIndicator, TouchableOpacity, Linking, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderOpen, FileText, Receipt, ClipboardList, Download, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  appartement_nom?: string;
  fichier_contrat?: string | null;
}

interface Workflow {
  id: number;
  rapport_etat_lieux?: string | null;
}

interface ContractWithWorkflow {
  contract: Contract;
  workflow: Workflow | null;
}

export default function LocataireDocuments() {
  const router = useRouter();

  const { data: items = [], isLoading } = useQuery<ContractWithWorkflow[]>({
    queryKey: ['locataire-documents'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/');
      const contracts: Contract[] = data.results ?? data ?? [];
      const pairs = await Promise.all(
        contracts.map(async (c) => {
          try {
            const wfRes = await api.get(`/contracts/pmo/workflows/?contrat=${c.id}`);
            const list = wfRes.data.results ?? wfRes.data;
            return { contract: c, workflow: list[0] ?? null };
          } catch {
            return { contract: c, workflow: null };
          }
        })
      );
      return pairs;
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mes documents</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Documents liés à vos locations</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <FolderOpen size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-base font-semibold mt-4 text-center">
            Aucun document disponible
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.contract.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          renderItem={({ item: { contract, workflow } }) => {
            const contratPdfUrl = contract.fichier_contrat ?? null;
            const edlPdfUrl = workflow?.rapport_etat_lieux ?? null;

            const docs = [
              {
                label: 'Contrat de bail',
                description: contratPdfUrl ? `Réf. ${contract.numero_contrat}` : 'Non encore disponible',
                icon: FileText,
                color: '#2563eb',
                bg: '#eff6ff',
                action: contratPdfUrl ? () => Linking.openURL(contratPdfUrl) : null,
              },
              {
                label: 'État des lieux',
                description: edlPdfUrl ? 'PDF disponible' : 'Non encore établi',
                icon: ClipboardList,
                color: '#7c3aed',
                bg: '#f5f3ff',
                action: edlPdfUrl ? () => Linking.openURL(edlPdfUrl) : null,
              },
              {
                label: 'Quittances de loyer',
                description: 'Historique des paiements',
                icon: Receipt,
                color: '#16a34a',
                bg: '#f0fdf4',
                action: () => router.push('/(locataire)/rent'),
              },
            ];

            return (
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Contract header */}
                <TouchableOpacity
                  className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50"
                  activeOpacity={0.7}
                  onPress={() => router.push({ pathname: '/(locataire)/contract-detail', params: { id: contract.id } })}
                >
                  <View>
                    <Text className="text-sm font-bold text-gray-900">{contract.appartement_nom ?? 'Logement'}</Text>
                    <Text className="text-[10px] text-gray-400 font-mono">{contract.numero_contrat}</Text>
                  </View>
                  <ChevronRight size={16} color="#d1d5db" />
                </TouchableOpacity>

                {/* Docs */}
                {docs.map((doc, i) => {
                  const Icon = doc.icon;
                  return (
                    <TouchableOpacity
                      key={doc.label}
                      className={`flex-row items-center gap-3 px-4 py-4 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                      activeOpacity={doc.action ? 0.7 : 1}
                      onPress={doc.action ?? undefined}
                      disabled={!doc.action}
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: doc.bg }}>
                        <Icon size={18} color={doc.color} />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-sm font-bold text-gray-900">{doc.label}</Text>
                        <Text className="text-xs text-gray-400 mt-0.5">{doc.description}</Text>
                      </View>
                      {doc.action ? (
                        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100">
                          <Download size={11} color="#6b7280" />
                          <Text className="text-[10px] font-semibold text-gray-500">Voir</Text>
                        </View>
                      ) : (
                        <View className="px-2.5 py-1 bg-gray-100 rounded-full">
                          <Text className="text-[10px] font-semibold text-gray-400">Indisponible</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
