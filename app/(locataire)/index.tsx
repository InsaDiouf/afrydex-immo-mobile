import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText, CreditCard, Wrench, Home, LogOut, MapPin, Calendar, FolderOpen, ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  appartement_nom?: string;
  residence_nom?: string;
  loyer_mensuel: number;
  date_debut: string;
}

interface Invoice {
  id: number;
  montant_ttc: number;
  date_echeance: string;
  statut: string;
}

interface MaintenanceItem {
  id: number;
  titre: string;
  statut: string;
  date_signalement: string;
}

const STATUS_DOT: Record<string, string> = {
  termine: '#16a34a',
  en_cours: '#2563eb',
  signale: '#d97706',
  annule: '#9ca3af',
};

export default function LocataireDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const { data: contract, isLoading: loadingContract } = useQuery<Contract | null>({
    queryKey: ['locataire-active-contract'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/?statut=actif');
      const results = data.results ?? data;
      return results[0] ?? null;
    },
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ['locataire-invoices-preview'],
    queryFn: async () => {
      const { data } = await api.get('/invoices/?limit=5');
      return data.results ?? data ?? [];
    },
  });

  const { data: maintenances } = useQuery<MaintenanceItem[]>({
    queryKey: ['locataire-maintenance-preview'],
    queryFn: async () => {
      const { data } = await api.get('/travaux/?limit=3');
      const list = data.results ?? data ?? [];
      return Array.isArray(list) ? list.slice(0, 3) : [];
    },
  });

  const nextInvoice = invoices?.find(i => i.statut === 'en_attente' || i.statut === 'en_retard');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const quickActions = [
    { label: 'Mon contrat', icon: FileText, color: '#2563eb', route: '/(locataire)/contract' },
    { label: 'Mes loyers', icon: CreditCard, color: '#16a34a', route: '/(locataire)/rent' },
    { label: 'Signaler', icon: Wrench, color: '#d97706', route: '/(locataire)/maintenance' },
    { label: 'Documents', icon: FolderOpen, color: '#7c3aed', route: '/(locataire)/documents' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <View>
          <Text className="text-xs text-green-600 font-semibold">Portail Locataire</Text>
          <Text className="text-base font-bold text-gray-900">Bonjour, {user?.first_name} 👋</Text>
        </View>
        <TouchableOpacity onPress={signOut} className="p-2 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <LogOut size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {loadingContract ? (
          <View className="items-center py-12"><ActivityIndicator color="#16a34a" /></View>
        ) : (
          <>
            {/* Logement card */}
            {contract ? (
              <View className="bg-green-600 rounded-2xl p-5">
                <View className="flex-row items-center gap-2 mb-1">
                  <Home size={16} color="rgba(255,255,255,0.7)" />
                  <Text className="text-green-100 text-xs font-semibold">Mon logement</Text>
                </View>
                <Text className="text-white text-xl font-bold">{contract.appartement_nom ?? '—'}</Text>
                {contract.residence_nom && (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MapPin size={11} color="rgba(255,255,255,0.6)" />
                    <Text className="text-green-100 text-xs">{contract.residence_nom}</Text>
                  </View>
                )}
                <Text className="text-green-200 text-xs mt-1">Contrat {contract.numero_contrat}</Text>
                <View className="mt-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-green-100 text-[10px]">Loyer mensuel</Text>
                    <Text className="text-white text-lg font-bold">
                      {Number(contract.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-bold">Actif</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-white rounded-2xl border border-gray-100 p-6 items-center">
                <Home size={36} color="#d1d5db" />
                <Text className="text-gray-400 text-sm font-medium mt-3">Aucun contrat actif</Text>
              </View>
            )}

            {/* Prochain loyer */}
            {nextInvoice && (
              <TouchableOpacity
                className="bg-white rounded-2xl border border-amber-100 p-4 flex-row items-center gap-3"
                activeOpacity={0.7}
                onPress={() => router.push('/(locataire)/rent')}
              >
                <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center">
                  <Calendar size={18} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 font-semibold">Prochain loyer</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(nextInvoice.montant_ttc).toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text className="text-xs text-gray-400">
                    Échéance : {formatDate(nextInvoice.date_echeance)}
                  </Text>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            )}

            {/* Quick actions — grille 2x2 */}
            <View className="flex-row flex-wrap gap-3">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className="bg-white rounded-2xl border border-gray-100 p-4 items-center gap-2"
                    style={{ width: '47%' }}
                    activeOpacity={0.7}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: item.color + '15' }}>
                      <Icon size={20} color={item.color} />
                    </View>
                    <Text className="text-xs font-semibold text-gray-800 text-center">{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Signalements récents */}
            {maintenances && maintenances.length > 0 && (
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
                  <View className="flex-row items-center gap-2">
                    <Wrench size={14} color="#d97706" />
                    <Text className="text-xs font-bold text-gray-700">Signalements récents</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(locataire)/maintenance')} activeOpacity={0.7}>
                    <Text className="text-xs font-semibold text-green-600">Voir tout</Text>
                  </TouchableOpacity>
                </View>
                {maintenances.map((m, i) => (
                  <View key={m.id} className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                    <View className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_DOT[m.statut] ?? '#d97706' }} />
                    <Text className="flex-1 text-sm text-gray-800" numberOfLines={1}>{m.titre}</Text>
                    <Text className="text-xs text-gray-400">
                      {new Date(m.date_signalement).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
