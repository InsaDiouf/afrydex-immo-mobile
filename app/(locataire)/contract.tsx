import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView, View, Text, ActivityIndicator, TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import {
  FileText, Home, CheckCircle2, Clock, MapPin, PenLine, RotateCcw,
} from 'lucide-react-native';
import { useAuth } from '@/ctx/auth';
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
  signe_par_locataire: boolean;
  signe_par_bailleur: boolean;
  appartement_nom?: string;
  residence_nom?: string;
}

interface Workflow {
  id: number;
  etape_actuelle: string;
  signature_locataire_etat_lieux: string | null;
  signature_bailleur_etat_lieux: string | null;
}

const SIG_WEB_STYLE = `.m-sig-pad--footer { display: none; } body, html { margin: 0; padding: 0; } .m-sig-pad { border: none; box-shadow: none; }`;

function SignaturePad({
  title,
  onSubmit,
  submitting,
}: {
  title: string;
  onSubmit: (sig: string) => Promise<void>;
  submitting: boolean;
}) {
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleOK = async (signature: string) => {
    await onSubmit(signature);
  };

  const handleValidate = () => {
    if (!isEmpty) sigRef.current?.readSignature();
  };

  const handleClear = () => {
    sigRef.current?.clearSignature();
    setIsEmpty(true);
  };

  return (
    <View>
      <Text className="text-sm font-semibold text-amber-800 mb-2">{title}</Text>
      <Text className="text-xs text-amber-700 mb-3">Tracez votre signature dans le cadre ci-dessous.</Text>

      <View className="rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height: 180 }}>
        <SignatureScreen
          ref={sigRef}
          onOK={handleOK}
          onBegin={() => setIsEmpty(false)}
          webStyle={SIG_WEB_STYLE}
          autoClear={false}
          penColor="#1e1b4b"
        />
      </View>

      <View className="flex-row gap-2 mt-3 justify-end">
        <TouchableOpacity
          onPress={handleClear}
          disabled={submitting}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white"
        >
          <RotateCcw size={14} color="#6b7280" />
          <Text className="text-sm text-gray-600 font-medium">Effacer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleValidate}
          disabled={submitting || isEmpty}
          className="flex-row items-center gap-1.5 px-4 py-2 rounded-lg"
          style={{ backgroundColor: isEmpty || submitting ? '#9ca3af' : '#16a34a' }}
        >
          {submitting
            ? <ActivityIndicator size="small" color="white" />
            : <PenLine size={14} color="white" />}
          <Text className="text-sm text-white font-semibold ml-1">Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LocataireContract() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submittingContract, setSubmittingContract] = useState(false);
  const [submittingEDL, setSubmittingEDL] = useState(false);

  const { data: contract, isLoading: loadingContract } = useQuery<Contract | null>({
    queryKey: ['locataire-contract'],
    queryFn: async () => {
      const { data } = await api.get('/contracts/?statut=actif');
      const results = data.results ?? data;
      return results[0] ?? null;
    },
  });

  const { data: workflow, isLoading: loadingWorkflow } = useQuery<Workflow | null>({
    queryKey: ['locataire-workflow', contract?.id],
    enabled: !!contract?.id,
    queryFn: async () => {
      const { data } = await api.get(`/contracts/pmo/workflows/?contrat=${contract!.id}`);
      const list = data.results ?? data;
      return list[0] ?? null;
    },
  });

  const isLoading = loadingContract || (!!contract && loadingWorkflow);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const needsContractSign = workflow?.etape_actuelle === 'redaction_contrat' && !contract?.signe_par_locataire;
  const needsEDLSign = workflow?.etape_actuelle === 'visite_entree' && !workflow?.signature_locataire_etat_lieux;

  const handleSignContract = async (signature: string) => {
    if (!workflow) return;
    setSubmittingContract(true);
    try {
      await api.post(`/contracts/pmo/workflows/${workflow.id}/contrat/sign-locataire/`, { signature_image: signature });
      await queryClient.invalidateQueries({ queryKey: ['locataire-contract'] });
      await queryClient.invalidateQueries({ queryKey: ['locataire-workflow', contract?.id] });
      Alert.alert('Succès', 'Votre contrat a bien été signé.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleSignEDL = async (signature: string) => {
    if (!workflow) return;
    setSubmittingEDL(true);
    try {
      await api.post(`/contracts/pmo/workflows/${workflow.id}/etat-lieux/sign-locataire/`, { signature_image: signature });
      await queryClient.invalidateQueries({ queryKey: ['locataire-workflow', contract?.id] });
      Alert.alert('Succès', "L'état des lieux a bien été signé.");
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error ?? 'Une erreur est survenue.');
    } finally {
      setSubmittingEDL(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Mon contrat</Text>
        <Text className="text-xs text-gray-400 mt-0.5">Détails de votre bail</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : !contract ? (
        <View className="flex-1 items-center justify-center p-8">
          <FileText size={48} color="#d1d5db" />
          <Text className="text-gray-400 text-base font-semibold mt-4">Aucun contrat actif</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Status banner */}
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center gap-3">
            <CheckCircle2 size={20} color="#16a34a" />
            <View>
              <Text className="text-sm font-bold text-green-800">Contrat actif</Text>
              <Text className="text-xs text-green-600 mt-0.5">{contract.numero_contrat}</Text>
            </View>
          </View>

          {/* Panneau signature contrat */}
          {needsContractSign && (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <PenLine size={16} color="#92400e" />
                <Text className="text-sm font-bold text-amber-800">Signature requise</Text>
              </View>
              <SignaturePad
                title="Signer le contrat de location"
                onSubmit={handleSignContract}
                submitting={submittingContract}
              />
            </View>
          )}

          {/* Panneau signature état des lieux */}
          {needsEDLSign && (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <View className="flex-row items-center gap-2 mb-3">
                <PenLine size={16} color="#92400e" />
                <Text className="text-sm font-bold text-amber-800">Signature état des lieux requise</Text>
              </View>
              <SignaturePad
                title="Signer l'état des lieux d'entrée"
                onSubmit={handleSignEDL}
                submitting={submittingEDL}
              />
            </View>
          )}

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
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MapPin size={11} color="#9ca3af" />
                    <Text className="text-xs text-gray-400">{contract.residence_nom}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Période */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Période du bail</Text>
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

          {/* Finances */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Conditions financières</Text>
            {[
              { label: 'Loyer de base', value: contract.loyer_base, accent: true },
              { label: 'Charges', value: contract.charges },
              { label: 'Dépôt de garantie', value: contract.depot_garantie },
            ].map((r) => (
              <View key={r.label} className="flex-row justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <Text className="text-sm text-gray-600">{r.label}</Text>
                <Text className={`text-sm font-bold ${r.accent ? 'text-green-600' : 'text-gray-900'}`}>
                  {Number(r.value).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center pt-2.5">
              <Text className="text-sm font-bold text-gray-800">Total mensuel</Text>
              <Text className="text-base font-bold text-green-600">
                {(Number(contract.loyer_base) + Number(contract.charges)).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures contrat</Text>
            {[
              { label: 'Votre signature', signed: contract.signe_par_locataire },
              { label: 'Bailleur / Agence', signed: contract.signe_par_bailleur },
            ].map((s) => (
              <View key={s.label} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <Text className="text-sm text-gray-600">{s.label}</Text>
                <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${s.signed ? 'bg-green-50' : 'bg-gray-100'}`}>
                  {s.signed
                    ? <CheckCircle2 size={12} color="#16a34a" />
                    : <Clock size={12} color="#9ca3af" />}
                  <Text className={`text-xs font-semibold ${s.signed ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.signed ? 'Signé' : 'En attente'}
                  </Text>
                </View>
              </View>
            ))}

            {workflow && (
              <>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-3">État des lieux</Text>
                {[
                  { label: 'Votre signature (EDL)', signed: !!workflow.signature_locataire_etat_lieux },
                  { label: 'Bailleur (EDL)', signed: !!workflow.signature_bailleur_etat_lieux },
                ].map((s) => (
                  <View key={s.label} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <Text className="text-sm text-gray-600">{s.label}</Text>
                    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${s.signed ? 'bg-green-50' : 'bg-gray-100'}`}>
                      {s.signed
                        ? <CheckCircle2 size={12} color="#16a34a" />
                        : <Clock size={12} color="#9ca3af" />}
                      <Text className={`text-xs font-semibold ${s.signed ? 'text-green-600' : 'text-gray-400'}`}>
                        {s.signed ? 'Signé' : 'En attente'}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
