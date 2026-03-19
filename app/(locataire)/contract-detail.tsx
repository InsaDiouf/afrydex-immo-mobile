import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import {
  Home, CheckCircle2, Clock, MapPin, PenLine, RotateCcw, ArrowLeft, Download, ShieldCheck,
} from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';

interface Contract {
  id: number;
  numero_contrat: string;
  statut: string;
  date_debut: string;
  date_fin?: string;
  loyer_mensuel: number;
  charges: number;
  depot_garantie: number;
  signe_par_locataire: boolean;
  signe_par_bailleur: boolean;
  appartement_nom?: string;
  residence_nom?: string;
  fichier_contrat?: string | null;
}

interface Workflow {
  id: number;
  etape_actuelle: string;
  signature_locataire_etat_lieux: string | null;
  signature_bailleur_etat_lieux: string | null;
  rapport_etat_lieux?: string | null;
}

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
  actif:      { label: 'Actif',       bg: '#f0fdf4', text: '#16a34a' },
  expire:     { label: 'Expiré',     bg: '#f9fafb', text: '#6b7280' },
  resilie:    { label: 'Résilié',    bg: '#fef2f2', text: '#dc2626' },
  en_attente: { label: 'En attente', bg: '#fffbeb', text: '#d97706' },
};

const SIG_WEB_STYLE = `.m-sig-pad--footer { display: none; } body, html { margin: 0; padding: 0; } .m-sig-pad { border: none; box-shadow: none; }`;

function SignaturePad({
  title,
  description,
  onSubmit,
  submitting,
}: {
  title: string;
  description: string;
  onSubmit: (sig: string) => Promise<void>;
  submitting: boolean;
}) {
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  return (
    <View className="rounded-2xl p-4" style={{ borderWidth: 2, borderColor: '#7c3aed', backgroundColor: '#faf5ff' }}>
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-9 h-9 rounded-xl items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ede9fe' }}>
          <PenLine size={16} color="#7c3aed" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: '#4c1d95' }}>{title}</Text>
          <Text className="text-xs mt-0.5" style={{ color: '#7c3aed' }}>{description}</Text>
        </View>
      </View>

      <View className="rounded-xl overflow-hidden bg-white" style={{ height: 160, borderWidth: 2, borderStyle: 'dashed', borderColor: '#c4b5fd' }}>
        <SignatureScreen
          ref={sigRef}
          onOK={async (sig) => { await onSubmit(sig); }}
          onBegin={() => setIsEmpty(false)}
          webStyle={SIG_WEB_STYLE}
          autoClear={false}
          penColor="#1e1b4b"
        />
      </View>

      <View className="flex-row gap-2 mt-3">
        <TouchableOpacity
          onPress={() => { sigRef.current?.clearSignature(); setIsEmpty(true); }}
          disabled={submitting}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white">
          <RotateCcw size={13} color="#6b7280" />
          <Text className="text-xs text-gray-600 font-medium">Effacer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { if (!isEmpty) sigRef.current?.readSignature(); }}
          disabled={submitting || isEmpty}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ backgroundColor: isEmpty || submitting ? '#a78bfa' : '#7c3aed' }}>
          {submitting ? <ActivityIndicator size="small" color="white" /> : <CheckCircle2 size={16} color="white" />}
          <Text className="text-sm text-white font-bold">{submitting ? 'Enregistrement…' : 'Valider ma signature'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function LocataireContractDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submittingContract, setSubmittingContract] = useState(false);
  const [submittingEDL, setSubmittingEDL] = useState(false);

  const { data: contract, isLoading: loadingContract } = useQuery<Contract | null>({
    queryKey: ['locataire-contract-detail', contractId],
    queryFn: async () => {
      const { data } = await api.get(`/contracts/${contractId}/`);
      return data;
    },
  });

  const { data: workflow, isLoading: loadingWorkflow } = useQuery<Workflow | null>({
    queryKey: ['locataire-workflow-detail', contractId],
    enabled: !!contractId,
    queryFn: async () => {
      const { data } = await api.get(`/contracts/pmo/workflows/?contrat=${contractId}`);
      const list = data.results ?? data;
      return list[0] ?? null;
    },
  });

  const isLoading = loadingContract || loadingWorkflow;

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  const needsContractSign = workflow?.etape_actuelle === 'redaction_contrat' && !contract?.signe_par_locataire;
  const needsEDLSign = workflow?.etape_actuelle === 'visite_entree' && !workflow?.signature_locataire_etat_lieux;
  const s = contract ? (STATUS[contract.statut] ?? STATUS.en_attente) : null;

  const handleSignContract = async (signature: string) => {
    if (!workflow) return;
    setSubmittingContract(true);
    try {
      await api.post(`/contracts/pmo/workflows/${workflow.id}/contrat/sign-locataire/`, { signature_image: signature });
      await queryClient.invalidateQueries({ queryKey: ['locataire-contract-detail', contractId] });
      await queryClient.invalidateQueries({ queryKey: ['locataire-workflow-detail', contractId] });
      Alert.alert('Succès', 'Votre contrat a bien été signé.');
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error ?? 'Une erreur est survenue.');
    } finally { setSubmittingContract(false); }
  };

  const handleSignEDL = async (signature: string) => {
    if (!workflow) return;
    setSubmittingEDL(true);
    try {
      await api.post(`/contracts/pmo/workflows/${workflow.id}/etat-lieux/sign-locataire/`, { signature_image: signature });
      await queryClient.invalidateQueries({ queryKey: ['locataire-workflow-detail', contractId] });
      Alert.alert('Succès', "L'état des lieux a bien été signé.");
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error ?? 'Une erreur est survenue.');
    } finally { setSubmittingEDL(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 -ml-1" activeOpacity={0.7}>
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900">Détail du contrat</Text>
          {contract && <Text className="text-xs text-gray-400 font-mono">{contract.numero_contrat}</Text>}
        </View>
        {contract?.fichier_contrat && (
          <TouchableOpacity
            onPress={() => Linking.openURL(contract.fichier_contrat!)}
            className="flex-row items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-xl"
            activeOpacity={0.7}>
            <Download size={14} color="#374151" />
            <Text className="text-xs font-semibold text-gray-700">PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16a34a" />
        </View>
      ) : !contract ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-gray-400 text-base">Contrat introuvable</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
          {/* Statut */}
          <View className="rounded-2xl p-4 flex-row items-center gap-3"
            style={{ backgroundColor: s?.bg ?? '#f9fafb', borderWidth: 1, borderColor: 'transparent' }}>
            {contract.statut === 'actif'
              ? <CheckCircle2 size={20} color="#16a34a" />
              : <Clock size={20} color="#9ca3af" />}
            <View>
              <Text className="text-sm font-bold" style={{ color: s?.text ?? '#6b7280' }}>
                Contrat {s?.label} — {contract.numero_contrat}
              </Text>
              {contract.appartement_nom && (
                <Text className="text-xs mt-0.5" style={{ color: s?.text ?? '#6b7280', opacity: 0.8 }}>
                  {contract.appartement_nom}
                </Text>
              )}
            </View>
          </View>

          {/* Signature contrat */}
          {needsContractSign && (
            <SignaturePad
              title="Votre signature est requise — Contrat"
              description="Le contrat est prêt. Signez ci-dessous pour valider votre acceptation."
              onSubmit={handleSignContract}
              submitting={submittingContract}
            />
          )}

          {/* Signature EDL */}
          {needsEDLSign && (
            <SignaturePad
              title="Votre signature est requise — État des lieux"
              description="L'état des lieux d'entrée est établi. Signez pour le valider."
              onSubmit={handleSignEDL}
              submitting={submittingEDL}
            />
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
              { label: 'Loyer de base', value: contract.loyer_mensuel, accent: true },
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
                {(Number(contract.loyer_mensuel) + Number(contract.charges)).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
          </View>

          {/* Signatures */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures contrat</Text>
            {[
              { label: 'Votre signature', signed: contract.signe_par_locataire },
              { label: 'Bailleur / Agence', signed: contract.signe_par_bailleur },
            ].map((sig) => (
              <View key={sig.label} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <Text className="text-sm text-gray-600">{sig.label}</Text>
                <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${sig.signed ? 'bg-green-50' : 'bg-gray-100'}`}>
                  {sig.signed ? <CheckCircle2 size={12} color="#16a34a" /> : <Clock size={12} color="#9ca3af" />}
                  <Text className={`text-xs font-semibold ${sig.signed ? 'text-green-600' : 'text-gray-400'}`}>
                    {sig.signed ? 'Signé' : 'En attente'}
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
                ].map((sig) => (
                  <View key={sig.label} className="flex-row items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <Text className="text-sm text-gray-600">{sig.label}</Text>
                    <View className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full ${sig.signed ? 'bg-green-50' : 'bg-gray-100'}`}>
                      {sig.signed ? <CheckCircle2 size={12} color="#16a34a" /> : <Clock size={12} color="#9ca3af" />}
                      <Text className={`text-xs font-semibold ${sig.signed ? 'text-green-600' : 'text-gray-400'}`}>
                        {sig.signed ? 'Signé' : 'En attente'}
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
