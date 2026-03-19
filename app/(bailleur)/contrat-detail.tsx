import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, FileText, User, Home, Calendar, CreditCard,
  CheckCircle2, Clock, PenLine, Key, ClipboardList,
  Phone, Mail, MapPin, RotateCcw, PenSquare, ShieldCheck,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import SignatureScreen from 'react-native-signature-canvas';
import { api } from '@/lib/api';

// ── Workflow steps ────────────────────────────────────────────────────────────
const WORKFLOW_STEPS: Array<{ key: string; label: string }> = [
  { key: 'verification_dossier', label: 'Vérif. dossier' },
  { key: 'attente_facture',      label: 'Facture' },
  { key: 'facture_validee',      label: 'Facture validée' },
  { key: 'redaction_contrat',    label: 'Rédaction' },
  { key: 'visite_entree',        label: 'Visite' },
  { key: 'remise_cles',          label: 'Remise clés' },
  { key: 'termine',              label: 'Terminé' },
];

const STEP_ICONS: Record<string, React.ComponentType<any>> = {
  verification_dossier: ClipboardList,
  attente_facture:      CreditCard,
  facture_validee:      CheckCircle2,
  redaction_contrat:    PenLine,
  visite_entree:        Home,
  remise_cles:          Key,
  termine:              CheckCircle2,
};

const STATUT: Record<string, { bg: string; text: string; label: string }> = {
  actif:     { bg: '#f0fdf4', text: '#16a34a', label: 'Actif' },
  expire:    { bg: '#f9fafb', text: '#6b7280', label: 'Expiré' },
  resilie:   { bg: '#fef2f2', text: '#dc2626', label: 'Résilié' },
  suspendu:  { bg: '#fff7ed', text: '#ea580c', label: 'Suspendu' },
  renouvele: { bg: '#eff6ff', text: '#2563eb', label: 'Renouvelé' },
  brouillon: { bg: '#fffbeb', text: '#d97706', label: 'En cours' },
};

const WORKFLOW_COLORS: Record<string, { bg: string; text: string }> = {
  verification_dossier: { bg: '#fffbeb', text: '#d97706' },
  attente_facture:      { bg: '#fff7ed', text: '#ea580c' },
  facture_validee:      { bg: '#eff6ff', text: '#2563eb' },
  redaction_contrat:    { bg: '#eef2ff', text: '#4338ca' },
  visite_entree:        { bg: '#f5f3ff', text: '#7c3aed' },
  remise_cles:          { bg: '#ecfeff', text: '#0891b2' },
  termine:              { bg: '#f0fdf4', text: '#16a34a' },
};

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-2 border-b border-gray-50">
      <Text className="text-xs text-gray-400 flex-1">{label}</Text>
      <Text className="text-xs font-semibold text-gray-900 flex-1 text-right" numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ── Workflow stepper ──────────────────────────────────────────────────────────
function WorkflowStepper({ etape, progression }: { etape?: string | null; progression?: number | null }) {
  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.key === etape);

  return (
    <View className="bg-white rounded-2xl border border-gray-100 p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avancement</Text>
        {progression != null && (
          <Text className="text-sm font-bold" style={{ color: '#7c3aed' }}>{progression}%</Text>
        )}
      </View>
      {progression != null && (
        <View className="h-1.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: '#f3f4f6' }}>
          <View className="h-full rounded-full" style={{ width: `${progression}%`, backgroundColor: '#7c3aed' }} />
        </View>
      )}
      <View className="flex-row flex-wrap gap-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = currentIdx >= 0 && i < currentIdx;
          const current = i === currentIdx;
          const Icon = STEP_ICONS[step.key] ?? Clock;
          const circleBg = done ? '#7c3aed' : current ? '#ede9fe' : '#f3f4f6';
          const iconColor = done ? '#ffffff' : current ? '#7c3aed' : '#9ca3af';
          const labelColor = done ? '#374151' : current ? '#7c3aed' : '#9ca3af';

          return (
            <View
              key={step.key}
              className="items-center rounded-xl p-2"
              style={{
                width: '30%',
                borderWidth: current ? 1.5 : 0,
                borderColor: current ? '#7c3aed' : 'transparent',
                backgroundColor: current ? '#faf5ff' : 'transparent',
              }}
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mb-1" style={{ backgroundColor: circleBg }}>
                {done
                  ? <CheckCircle2 size={14} color="#ffffff" />
                  : <Icon size={14} color={iconColor} />
                }
              </View>
              <Text className="text-[9px] font-semibold text-center leading-3" style={{ color: labelColor }} numberOfLines={2}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Signature panel ───────────────────────────────────────────────────────────
// Hide the built-in footer buttons of react-native-signature-canvas
const SIG_WEB_STYLE = `.m-sig-pad--footer { display: none; } body, html { margin: 0; padding: 0; } .m-sig-pad { border: none; box-shadow: none; }`;

function SignaturePad({
  title,
  description,
  onSubmit,
  submitting,
}: {
  title: string;
  description: string;
  onSubmit: (imageBase64: string) => Promise<void>;
  submitting: boolean;
}) {
  const sigRef = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const busy = submitting || localSubmitting;

  const handleOK = async (signature: string) => {
    setLocalSubmitting(true);
    try {
      await onSubmit(signature);
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clearSignature();
    setIsEmpty(true);
  };

  const handleValidate = () => {
    if (isEmpty) return;
    sigRef.current?.readSignature();
  };

  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: '#faf5ff', borderWidth: 1.5, borderColor: '#7c3aed' }}
    >
      {/* Header */}
      <View className="flex-row items-start gap-3 mb-4">
        <View className="w-9 h-9 rounded-xl items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ede9fe' }}>
          <PenSquare size={16} color="#7c3aed" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold" style={{ color: '#4c1d95' }}>{title}</Text>
          <Text className="text-xs mt-0.5" style={{ color: '#7c3aed' }}>{description}</Text>
        </View>
      </View>

      {/* Canvas */}
      <View
        className="rounded-xl overflow-hidden bg-white"
        style={{ height: 180, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#c4b5fd' }}
      >
        <SignatureScreen
          ref={sigRef}
          onOK={handleOK}
          onEmpty={() => {}}
          onBegin={() => setIsEmpty(false)}
          webStyle={SIG_WEB_STYLE}
          autoClear={false}
          backgroundColor="rgba(0,0,0,0)"
          penColor="#1e1b4b"
          descriptionText=""
        />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          onPress={handleClear}
          className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl border bg-white"
          style={{ borderColor: '#d1d5db' }}
          activeOpacity={0.7}
        >
          <RotateCcw size={14} color="#6b7280" />
          <Text className="text-xs font-semibold text-gray-500">Effacer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleValidate}
          disabled={busy || isEmpty}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl"
          style={{ backgroundColor: busy || isEmpty ? '#a78bfa' : '#7c3aed' }}
          activeOpacity={0.8}
        >
          {busy
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <CheckCircle2 size={15} color="#ffffff" />
          }
          <Text className="text-sm font-bold text-white">
            {busy ? 'Enregistrement…' : 'Valider'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Certification */}
      <View className="flex-row items-center justify-center gap-1.5 mt-3">
        <ShieldCheck size={12} color="#9ca3af" />
        <Text className="text-[10px] text-gray-400">
          Signature certifiée par <Text className="font-bold">Afrydex</Text>
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ContratDetail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [signingContract, setSigningContract] = useState(false);
  const [signingInventory, setSigningInventory] = useState(false);

  const { data: contract, isLoading: loadingContract } = useQuery({
    queryKey: ['bailleur-contrat', id],
    queryFn: async () => {
      const { data } = await api.get(`/contracts/${id}/`);
      return data;
    },
    enabled: !!id,
  });

  const { data: workflow, isLoading: loadingWf } = useQuery({
    queryKey: ['bailleur-contrat-workflow', id],
    queryFn: async () => {
      const { data } = await api.get('/pmo/workflows/', { params: { contrat: id } });
      return data?.results?.[0] ?? null;
    },
    enabled: !!id,
  });

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ['bailleur-contrat', id] });
    queryClient.invalidateQueries({ queryKey: ['bailleur-contrat-workflow', id] });
    queryClient.invalidateQueries({ queryKey: ['bailleur-contracts'] });
  };

  const handleSignContract = async (imageBase64: string) => {
    if (!workflow) return;
    setSigningContract(true);
    try {
      await api.post(`/pmo/workflows/${workflow.id}/contrat/sign-bailleur/`, {
        signature_image: imageBase64,
      });
      reload();
    } catch (e: any) {
      // Error is swallowed silently — the UI will reflect actual state after reload
      console.warn('Erreur signature contrat:', e?.response?.data?.error ?? e.message);
    } finally {
      setSigningContract(false);
    }
  };

  const handleSignInventory = async (imageBase64: string) => {
    if (!workflow) return;
    setSigningInventory(true);
    try {
      await api.post(`/pmo/workflows/${workflow.id}/etat-lieux/sign/`, {
        signature_image: imageBase64,
      });
      reload();
    } catch (e: any) {
      console.warn("Erreur signature EDL:", e?.response?.data?.error ?? e.message);
    } finally {
      setSigningInventory(false);
    }
  };

  const isLoading = loadingContract || loadingWf;

  const needsContractSignature = !!(
    workflow?.etape_actuelle === 'redaction_contrat' && contract && !contract.signe_par_bailleur
  );
  const needsInventorySignature = !!(
    workflow?.etape_actuelle === 'visite_entree' && !workflow?.signature_bailleur_etat_lieux
  );

  const badge = contract
    ? contract.statut === 'brouillon' && contract.workflow_etape && contract.workflow_etape_display
      ? { ...(WORKFLOW_COLORS[contract.workflow_etape] ?? WORKFLOW_COLORS.verification_dossier), label: contract.workflow_etape_display }
      : { ...(STATUT[contract.statut] ?? STATUT.brouillon), label: (STATUT[contract.statut] ?? STATUT.brouillon).label }
    : null;

  const signedLocataire = contract?.signe_par_locataire ?? false;
  const signedBailleur  = contract?.signe_par_bailleur  ?? false;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1.5 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {contract?.numero_contrat ?? 'Contrat'}
          </Text>
          {contract?.appartement_nom && (
            <Text className="text-xs text-gray-400" numberOfLines={1}>{contract.appartement_nom}</Text>
          )}
        </View>
        {badge && (
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: badge.bg }}>
            <Text className="text-xs font-semibold" style={{ color: badge.text }}>{badge.label}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : !contract ? (
        <View className="flex-1 items-center justify-center p-8">
          <FileText size={36} color="#d1d5db" />
          <Text className="text-gray-400 text-sm mt-3">Contrat introuvable.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 16, padding: 16 }}>

          {/* Signature contrat */}
          {needsContractSignature && (
            <SignaturePad
              title="Signature requise — Contrat"
              description="Le contrat est prêt. Signez ci-dessous pour le valider."
              onSubmit={handleSignContract}
              submitting={signingContract}
            />
          )}

          {/* Signature état des lieux */}
          {needsInventorySignature && (
            <SignaturePad
              title="Signature requise — État des lieux"
              description="L'état des lieux est établi. Signez pour le valider."
              onSubmit={handleSignInventory}
              submitting={signingInventory}
            />
          )}

          {/* Workflow stepper */}
          {contract.statut === 'brouillon' && (
            <WorkflowStepper
              etape={workflow?.etape_actuelle ?? contract.workflow_etape}
              progression={workflow?.progression ?? contract.workflow_progression}
            />
          )}

          {/* Infos contrat */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contrat</Text>
            <InfoRow label="Numéro"     value={contract.numero_contrat} />
            <InfoRow label="Type"       value={contract.type_contrat} />
            <InfoRow label="Date début" value={fmt(contract.date_debut)} />
            <InfoRow label="Date fin"   value={fmt(contract.date_fin)} />
            <InfoRow label="Durée"      value={contract.duree_mois ? `${contract.duree_mois} mois` : undefined} />
          </View>

          {/* Locataire */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                <User size={14} color="#2563eb" />
              </View>
              <View>
                <Text className="text-xs text-gray-400">Locataire</Text>
                <Text className="text-sm font-bold text-gray-900">{contract.locataire_nom ?? '—'}</Text>
              </View>
            </View>
            {contract.locataire_telephone && (
              <View className="flex-row items-center gap-2 py-1.5">
                <Phone size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-600">{contract.locataire_telephone}</Text>
              </View>
            )}
            {contract.locataire_email && (
              <View className="flex-row items-center gap-2 py-1.5">
                <Mail size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-600">{contract.locataire_email}</Text>
              </View>
            )}
          </View>

          {/* Appartement */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: '#f5f3ff' }}>
                <Home size={14} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-xs text-gray-400">Bien loué</Text>
                <Text className="text-sm font-bold text-gray-900">{contract.appartement_nom ?? '—'}</Text>
              </View>
            </View>
            {contract.locataire_adresse && (
              <View className="flex-row items-center gap-2 py-1.5 pt-2 border-t border-gray-50">
                <MapPin size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500 flex-1">{contract.locataire_adresse}</Text>
              </View>
            )}
          </View>

          {/* Finances */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Finances</Text>
            <View className="flex-row flex-wrap gap-y-3">
              <View style={{ width: '50%' }}>
                <Text className="text-xs text-gray-400">Loyer mensuel</Text>
                <Text className="text-base font-bold mt-0.5" style={{ color: '#7c3aed' }}>
                  {Number(contract.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
              {contract.charges_mensuelles && Number(contract.charges_mensuelles) > 0 && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Charges</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(contract.charges_mensuelles).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
              {contract.depot_garantie && Number(contract.depot_garantie) > 0 && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Dépôt de garantie</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(contract.depot_garantie).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
              {contract.frais_agence && Number(contract.frais_agence) > 0 && (
                <View style={{ width: '50%' }}>
                  <Text className="text-xs text-gray-400">Frais d'agence</Text>
                  <Text className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(contract.frais_agence).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Signatures */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Signatures</Text>
            <View className="flex-row gap-3">
              {[
                { label: 'Bailleur',   signed: signedBailleur },
                { label: 'Locataire',  signed: signedLocataire },
              ].map(({ label, signed }) => (
                <View
                  key={label}
                  className="flex-1 rounded-xl p-3 items-center gap-1"
                  style={{ backgroundColor: signed ? '#f0fdf4' : '#f9fafb' }}
                >
                  {signed
                    ? <CheckCircle2 size={20} color="#16a34a" />
                    : <Clock size={20} color="#9ca3af" />
                  }
                  <Text className="text-xs font-semibold" style={{ color: signed ? '#16a34a' : '#9ca3af' }}>
                    {label}
                  </Text>
                  <Text className="text-[10px]" style={{ color: signed ? '#16a34a' : '#9ca3af' }}>
                    {signed ? 'Signé' : 'En attente'}
                  </Text>
                </View>
              ))}
            </View>
            {contract.date_signature && (
              <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                <Calendar size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400">Signé le {fmt(contract.date_signature)}</Text>
              </View>
            )}
          </View>

          {/* Workflow details */}
          {workflow && (
            <View className="bg-white rounded-2xl border border-gray-100 p-4">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Détails PMO</Text>
              {workflow.date_visite_entree && <InfoRow label="Visite d'entrée" value={fmt(workflow.date_visite_entree)} />}
              {workflow.date_remise_cles   && <InfoRow label="Remise des clés" value={fmt(workflow.date_remise_cles)} />}
              {workflow.nombre_cles != null && <InfoRow label="Nombre de clés" value={String(workflow.nombre_cles)} />}
              {workflow.notes_pmo && (
                <View className="mt-2 pt-2 border-t border-gray-50">
                  <Text className="text-xs text-gray-400 mb-1">Notes PMO</Text>
                  <Text className="text-xs text-gray-600 leading-4">{workflow.notes_pmo}</Text>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
