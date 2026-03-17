import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, User, Home, Calendar, CreditCard,
  FileText, CheckCircle2, Clock, XCircle, Download,
  Phone, Mail,
} from 'lucide-react-native';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  statut: string;
  date_debut: string;
  date_fin?: string;
  loyer_base: number;
  charges: number;
  depot_garantie: number;
  mode_location: string;
  signe_par_locataire: boolean;
  signe_par_bailleur: boolean;
  locataire_nom?: string;
  locataire_prenom?: string;
  locataire_email?: string;
  locataire_telephone?: string;
  appartement_nom?: string;
  residence_nom?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  actif: { bg: '#f0fdf4', text: '#16a34a', label: 'Actif', icon: CheckCircle2 },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente', icon: Clock },
  termine: { bg: '#f9fafb', text: '#6b7280', label: 'Terminé', icon: XCircle },
  resilié: { bg: '#fef2f2', text: '#dc2626', label: 'Résilié', icon: XCircle },
};

export default function ContractDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: contract, isLoading } = useQuery<Contract>({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data } = await api.get(`/contracts/${id}/`);
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

  if (!contract) return null;

  const status = STATUS_CONFIG[contract.statut] ?? STATUS_CONFIG.en_attente;
  const StatusIcon = status.icon;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">{contract.numero_contrat}</Text>
          <Text className="text-xs text-gray-400">Détail du contrat</Text>
        </View>
        <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
          <StatusIcon size={12} color={status.text} />
          <Text className="text-xs font-bold" style={{ color: status.text }}>{status.label}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>

        {/* Logement */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Logement</Text>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
              <Home size={18} color="#2563eb" />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-900">{contract.appartement_nom ?? '—'}</Text>
              {contract.residence_nom && (
                <Text className="text-xs text-gray-400 mt-0.5">{contract.residence_nom}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Locataire */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Locataire</Text>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center">
              <User size={18} color="#7c3aed" />
            </View>
            <Text className="text-sm font-bold text-gray-900">
              {contract.locataire_prenom} {contract.locataire_nom}
            </Text>
          </View>
          <View className="gap-2">
            {contract.locataire_telephone && (
              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={() => Linking.openURL(`tel:${contract.locataire_telephone}`)}
                activeOpacity={0.7}
              >
                <Phone size={14} color="#9ca3af" />
                <Text className="text-sm text-blue-600 font-medium">{contract.locataire_telephone}</Text>
              </TouchableOpacity>
            )}
            {contract.locataire_email && (
              <TouchableOpacity
                className="flex-row items-center gap-2"
                onPress={() => Linking.openURL(`mailto:${contract.locataire_email}`)}
                activeOpacity={0.7}
              >
                <Mail size={14} color="#9ca3af" />
                <Text className="text-sm text-blue-600 font-medium">{contract.locataire_email}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dates */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Période</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="text-[10px] text-gray-400 font-semibold mb-1">DÉBUT</Text>
              <Text className="text-sm font-bold text-gray-900">{formatDate(contract.date_debut)}</Text>
            </View>
            <View className="flex-1 bg-gray-50 rounded-xl p-3">
              <Text className="text-[10px] text-gray-400 font-semibold mb-1">FIN</Text>
              <Text className="text-sm font-bold text-gray-900">{formatDate(contract.date_fin)}</Text>
            </View>
          </View>
        </View>

        {/* Financier */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Conditions financières</Text>
          {[
            { label: 'Loyer de base', value: contract.loyer_base, accent: true },
            { label: 'Charges', value: contract.charges },
            { label: 'Dépôt de garantie', value: contract.depot_garantie },
          ].map((r) => (
            <View key={r.label} className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
              <Text className="text-sm text-gray-600">{r.label}</Text>
              <Text className={`text-sm font-bold ${r.accent ? 'text-blue-600' : 'text-gray-900'}`}>
                {Number(r.value).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between items-center pt-2.5">
            <Text className="text-sm font-bold text-gray-800">Total mensuel</Text>
            <Text className="text-base font-bold text-blue-600">
              {(Number(contract.loyer_base) + Number(contract.charges)).toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures</Text>
          {[
            { label: 'Locataire', signed: contract.signe_par_locataire },
            { label: 'Bailleur / Agence', signed: contract.signe_par_bailleur },
          ].map((s) => (
            <View key={s.label} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <Text className="text-sm text-gray-600">{s.label}</Text>
              <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${s.signed ? 'bg-green-50' : 'bg-gray-100'}`}>
                <CheckCircle2 size={12} color={s.signed ? '#16a34a' : '#9ca3af'} />
                <Text className={`text-xs font-semibold ${s.signed ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.signed ? 'Signé' : 'En attente'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        {contract.notes && (
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</Text>
            <Text className="text-sm text-gray-600 leading-5">{contract.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
