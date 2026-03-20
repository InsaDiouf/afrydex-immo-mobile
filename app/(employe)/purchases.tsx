import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Calendar, FileText, CheckCircle2, Plus, X, Trash2, AlertCircle } from 'lucide-react-native';
import { useState } from 'react';
import { api } from '@/lib/api';

const STATUS: Record<string, { bg: string; text: string; label: string }> = {
  brouillon: { bg: '#f9fafb', text: '#6b7280', label: 'Brouillon' },
  en_attente: { bg: '#fffbeb', text: '#d97706', label: 'En attente' },
  valide_responsable: { bg: '#eff6ff', text: '#2563eb', label: 'Validé resp.' },
  comptable: { bg: '#eff6ff', text: '#2563eb', label: 'Comptable' },
  validation_dg: { bg: '#fff7ed', text: '#ea580c', label: 'Validation DG' },
  approuve: { bg: '#f0fdf4', text: '#16a34a', label: 'Approuvé' },
  recue: { bg: '#f0fdf4', text: '#16a34a', label: 'Reçue' },
  paye: { bg: '#ecfdf5', text: '#059669', label: 'Payé' },
  refuse: { bg: '#fef2f2', text: '#dc2626', label: 'Refusé' },
  annule: { bg: '#f9fafb', text: '#6b7280', label: 'Annulé' },
};

const FILTERS = ['Tous', 'En attente', 'Approuvés', 'Refusés'] as const;

const EMPTY_ARTICLE = { designation: '', quantite: '1', unite: 'unité', prix_unitaire: '0', fournisseur: '', motif: '' };

interface Article { designation: string; quantite: string; unite: string; prix_unitaire: string; fournisseur: string; motif: string; }

function inputStyle(focused?: boolean) {
  return {
    backgroundColor: '#f9fafb',
    borderColor: focused ? '#d97706' : '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  };
}

export default function EmployePurchases() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Tous');
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [selectedTravail, setSelectedTravail] = useState<any>(null);
  const [serviceFonction, setServiceFonction] = useState('Maintenance');
  const [motifPrincipal, setMotifPrincipal] = useState('');
  const [articles, setArticles] = useState<Article[]>([{ ...EMPTY_ARTICLE }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<'travail' | 'form'>('travail');

  const { data, isLoading } = useQuery({
    queryKey: ['employe-purchases'],
    queryFn: async () => {
      const { data } = await api.get('/purchase-requests/');
      return data;
    },
  });

  const { data: travauxData } = useQuery({
    queryKey: ['employe-tasks-for-purchase'],
    queryFn: async () => {
      const { data } = await api.get('/travaux/');
      return data;
    },
    enabled: modalOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/employee/purchase-request/', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employe-purchases'] });
      closeModal();
    },
    onError: (e: any) => {
      setFormError(e.response?.data?.message || 'Erreur lors de la création.');
    },
  });

  const requests = Array.isArray(data) ? data : (data?.results ?? []);
  const travaux: any[] = Array.isArray(travauxData) ? travauxData : (travauxData?.results ?? []);

  const filtered = requests.filter((r: any) => {
    if (filter === 'Tous') return true;
    if (filter === 'En attente') return ['brouillon', 'en_attente', 'valide_responsable', 'comptable', 'validation_dg'].includes(r.etape_workflow);
    if (filter === 'Approuvés') return ['approuve', 'recue', 'paye'].includes(r.etape_workflow);
    if (filter === 'Refusés') return r.etape_workflow === 'refuse' || r.etape_workflow === 'annule';
    return true;
  });

  const totalApprouve = requests
    .filter((r: any) => ['approuve', 'recue', 'paye'].includes(r.etape_workflow))
    .reduce((a: number, r: any) => a + Number(r.montant_ttc ?? 0), 0);

  const total = articles.reduce((sum, a) => sum + (parseFloat(a.quantite) || 0) * (parseFloat(a.prix_unitaire) || 0), 0);

  const closeModal = () => {
    setModalOpen(false);
    setStep('travail');
    setSelectedTravail(null);
    setServiceFonction('Maintenance');
    setMotifPrincipal('');
    setArticles([{ ...EMPTY_ARTICLE }]);
    setFormError(null);
  };

  const addArticle = () => setArticles(prev => [...prev, { ...EMPTY_ARTICLE }]);
  const removeArticle = (i: number) => { if (articles.length > 1) setArticles(prev => prev.filter((_, idx) => idx !== i)); };
  const updateArticle = (i: number, field: keyof Article, value: string) => {
    setArticles(prev => { const next = [...prev]; next[i] = { ...next[i], [field]: value }; return next; });
  };

  const validate = (): string | null => {
    if (!selectedTravail) return 'Veuillez sélectionner un travail.';
    if (!motifPrincipal.trim()) return 'Le motif principal est requis.';
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      if (!a.designation.trim()) return `Article #${i + 1} : désignation requise.`;
      if ((parseFloat(a.quantite) || 0) <= 0) return `Article #${i + 1} : quantité invalide.`;
      if (!a.unite.trim()) return `Article #${i + 1} : unité requise.`;
      if ((parseFloat(a.prix_unitaire) || 0) <= 0) return `Article #${i + 1} : prix invalide.`;
    }
    return null;
  };

  const handleSubmit = (soumettre: boolean) => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);
    createMutation.mutate({
      travail_id: selectedTravail.id,
      service_fonction: serviceFonction,
      motif_principal: motifPrincipal,
      articles: articles.map(a => ({
        designation: a.designation.trim(),
        quantite: parseFloat(a.quantite) || 1,
        unite: a.unite.trim(),
        prix_unitaire: parseFloat(a.prix_unitaire) || 0,
        fournisseur: a.fournisseur.trim(),
        motif: a.motif.trim(),
      })),
      soumettre,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Demandes d'achat</Text>
          <Text className="text-xs text-gray-400 mt-0.5">Demandes d'approvisionnement</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: '#d97706' }}
          activeOpacity={0.8}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Summary */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <ShoppingCart size={14} color="#d97706" />
              <Text className="text-xs font-semibold text-gray-400">Total</Text>
            </View>
            <Text className="text-2xl font-bold" style={{ color: '#d97706' }}>
              {isLoading ? '—' : requests.length}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle2 size={14} color="#16a34a" />
              <Text className="text-xs font-semibold text-gray-400">Approuvé</Text>
            </View>
            <Text className="text-xl font-bold" style={{ color: '#16a34a' }}>
              {isLoading ? '—' : totalApprouve.toLocaleString('fr-FR')}
            </Text>
            <Text className="text-[10px] text-gray-400">FCFA</Text>
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2 flex-wrap">
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: filter === f ? '#d97706' : 'white', borderColor: filter === f ? '#d97706' : '#e5e7eb' }}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-semibold" style={{ color: filter === f ? 'white' : '#6b7280' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View className="items-center py-12"><ActivityIndicator color="#d97706" /></View>
        ) : filtered.length === 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-10 items-center">
            <ShoppingCart size={36} color="#d1d5db" />
            <Text className="text-gray-400 text-sm mt-3">Aucune demande</Text>
            <TouchableOpacity onPress={() => setModalOpen(true)} className="mt-3">
              <Text className="text-xs font-semibold" style={{ color: '#d97706' }}>Créer une demande</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((r: any) => {
              const s = STATUS[r.etape_workflow] ?? STATUS.brouillon;
              return (
                <View key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                        {r.motif_principal || 'Sans motif'}
                      </Text>
                      <Text className="text-xs font-mono text-gray-400 mt-0.5">{r.numero_facture}</Text>
                      <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
                        <View className="flex-row items-center gap-1">
                          <Calendar size={10} color="#9ca3af" />
                          <Text className="text-[10px] text-gray-400">
                            {new Date(r.date_demande).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Text>
                        </View>
                        {r.categorie_achat && (
                          <View className="flex-row items-center gap-1">
                            <FileText size={10} color="#9ca3af" />
                            <Text className="text-[10px] text-gray-400">{r.categorie_achat}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="items-end gap-1.5">
                      <Text className="text-sm font-bold" style={{ color: '#d97706' }}>
                        {Number(r.montant_ttc ?? 0).toLocaleString('fr-FR')}
                      </Text>
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg }}>
                        <Text className="text-[10px] font-semibold" style={{ color: s.text }}>{s.label}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Creation Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ backgroundColor: '#fef3c7', padding: 8, borderRadius: 10 }}>
                  <ShoppingCart size={18} color="#d97706" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Nouvelle demande</Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                    {step === 'travail' ? 'Sélectionnez un travail' : 'Remplissez le formulaire'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={{ padding: 6 }} activeOpacity={0.7}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

              {/* Error banner */}
              {formError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12 }}>
                  <AlertCircle size={14} color="#dc2626" />
                  <Text style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>{formError}</Text>
                </View>
              )}

              {step === 'travail' ? (
                /* Step 1: Pick travail */
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Travail concerné</Text>
                  {travaux.length === 0 ? (
                    <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 13 }}>Aucun travail assigné</Text>
                    </View>
                  ) : (
                    travaux.map((t: any) => (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => { setSelectedTravail(t); setStep('form'); setFormError(null); }}
                        activeOpacity={0.7}
                        style={{
                          backgroundColor: selectedTravail?.id === t.id ? '#fffbeb' : '#f9fafb',
                          borderWidth: 1.5,
                          borderColor: selectedTravail?.id === t.id ? '#d97706' : '#e5e7eb',
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{t.titre}</Text>
                        <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {t.appartement_nom ?? t.residence_nom ?? '—'} · {t.numero_travail}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : (
                /* Step 2: Form */
                <View style={{ gap: 16 }}>
                  {/* Selected travail recap */}
                  <TouchableOpacity
                    onPress={() => setStep('travail')}
                    style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    activeOpacity={0.8}
                  >
                    <View>
                      <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '600' }}>Travail sélectionné</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#78350f' }} numberOfLines={1}>{selectedTravail?.titre}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#d97706' }}>Changer</Text>
                  </TouchableOpacity>

                  {/* Service */}
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Service / Fonction *</Text>
                    <TextInput
                      value={serviceFonction}
                      onChangeText={setServiceFonction}
                      style={inputStyle()}
                      placeholder="Ex: Maintenance"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Motif */}
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Motif principal *</Text>
                    <TextInput
                      value={motifPrincipal}
                      onChangeText={v => { setMotifPrincipal(v); setFormError(null); }}
                      style={[inputStyle(), { height: 80, textAlignVertical: 'top' }]}
                      placeholder="Décrivez la raison de cette demande…"
                      placeholderTextColor="#9ca3af"
                      multiline
                    />
                  </View>

                  {/* Articles */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Articles</Text>
                      <TouchableOpacity
                        onPress={addArticle}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
                        activeOpacity={0.7}
                      >
                        <Plus size={12} color="#d97706" />
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#d97706' }}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 12 }}>
                      {articles.map((article, i) => (
                        <View key={i} style={{ backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Article #{i + 1}</Text>
                            {articles.length > 1 && (
                              <TouchableOpacity onPress={() => removeArticle(i)} activeOpacity={0.7}>
                                <Trash2 size={15} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>

                          <TextInput
                            value={article.designation}
                            onChangeText={v => updateArticle(i, 'designation', v)}
                            style={{ ...inputStyle(), backgroundColor: 'white' }}
                            placeholder="Désignation *"
                            placeholderTextColor="#9ca3af"
                          />

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                              value={article.quantite}
                              onChangeText={v => updateArticle(i, 'quantite', v)}
                              style={{ ...inputStyle(), backgroundColor: 'white', flex: 1 }}
                              placeholder="Qté *"
                              placeholderTextColor="#9ca3af"
                              keyboardType="numeric"
                            />
                            <TextInput
                              value={article.unite}
                              onChangeText={v => updateArticle(i, 'unite', v)}
                              style={{ ...inputStyle(), backgroundColor: 'white', flex: 1 }}
                              placeholder="Unité *"
                              placeholderTextColor="#9ca3af"
                            />
                          </View>

                          <TextInput
                            value={article.prix_unitaire}
                            onChangeText={v => updateArticle(i, 'prix_unitaire', v)}
                            style={{ ...inputStyle(), backgroundColor: 'white' }}
                            placeholder="Prix unitaire (FCFA) *"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                          />

                          <TextInput
                            value={article.fournisseur}
                            onChangeText={v => updateArticle(i, 'fournisseur', v)}
                            style={{ ...inputStyle(), backgroundColor: 'white' }}
                            placeholder="Fournisseur (optionnel)"
                            placeholderTextColor="#9ca3af"
                          />

                          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <Text style={{ fontSize: 11, color: '#6b7280' }}>
                              Sous-total :{' '}
                              <Text style={{ fontWeight: '700', color: '#d97706' }}>
                                {((parseFloat(article.quantite) || 0) * (parseFloat(article.prix_unitaire) || 0)).toLocaleString('fr-FR')} FCFA
                              </Text>
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Total */}
                    <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>Total estimé</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#d97706' }}>
                        {total.toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer buttons */}
            {step === 'form' && (
              <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: 'white' }}>
                <TouchableOpacity
                  onPress={() => handleSubmit(false)}
                  disabled={createMutation.isPending}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a', opacity: createMutation.isPending ? 0.6 : 1 }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>Brouillon</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSubmit(true)}
                  disabled={createMutation.isPending}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#d97706', opacity: createMutation.isPending ? 0.6 : 1 }}
                  activeOpacity={0.8}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>Soumettre</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
