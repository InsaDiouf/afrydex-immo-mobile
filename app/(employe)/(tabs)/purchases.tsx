import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import {
  Card, Ic, Badge, Chips, TabHeader, STATUS_BAR_H,
} from '@/components/agence/ui';

/* ─── Helpers ────────────────────────────────────────────────────── */
function compactAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/* ─── Types ──────────────────────────────────────────────────────── */
interface Article {
  designation: string;
  quantite: string;
  unite: string;
  prix_unitaire: string;
  fournisseur: string;
}

const EMPTY_ARTICLE: Article = {
  designation: '', quantite: '1', unite: 'unité', prix_unitaire: '0', fournisseur: '',
};

/* ─── Status map ─────────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  valide_responsable: 'En validation',
  comptable: 'Comptable',
  validation_dg: 'Validation DG',
  approuve: 'Approuvé',
  recue: 'Reçu',
  paye: 'Payé',
  refuse: 'Refusé',
  annule: 'Annulé',
};

type StatusTone = 'success' | 'warn' | 'danger' | 'info' | 'neutral';
function statusTone(etape: string): StatusTone {
  if (['approuve', 'recue', 'paye'].includes(etape)) return 'success';
  if (['brouillon', 'annule'].includes(etape)) return 'neutral';
  if (etape === 'refuse') return 'danger';
  return 'warn';
}

const FILTERS = ['Toutes', 'En attente', 'Approuvés', 'Refusés'] as const;
type Filter = typeof FILTERS[number];

/* ─── Screen ─────────────────────────────────────────────────────── */
export default function EmployePurchases() {
  const { theme: t } = useAgencyTheme();
  const qc = useQueryClient();
  const submittingRef = useRef(false);

  const [filter, setFilter] = useState<Filter>('Toutes');
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<'travail' | 'form'>('travail');
  const [selectedTravail, setSelectedTravail] = useState<any>(null);
  const [serviceFonction, setServiceFonction] = useState('Maintenance');
  const [motifPrincipal, setMotifPrincipal] = useState('');
  const [articles, setArticles] = useState<Article[]>([{ ...EMPTY_ARTICLE }]);
  const [formError, setFormError] = useState<string | null>(null);

  /* ── Queries ─────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ['employe-purchases'],
    queryFn: async () => { const { data } = await api.get('/purchase-requests/'); return data; },
  });

  const { data: travauxData } = useQuery({
    queryKey: ['employe-tasks-for-purchase'],
    queryFn: async () => { const { data } = await api.get('/travaux/'); return data; },
    enabled: modalOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/employee/purchase-request/', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employe-purchases'] });
      closeModal();
    },
    onError: (e: any) => {
      setFormError(e.response?.data?.message || 'Erreur lors de la création.');
    },
  });

  /* ── Computed ────────────────────────────────────────────────── */
  const requests: any[] = Array.isArray(data) ? data : (data?.results ?? []);
  const travaux: any[] = Array.isArray(travauxData) ? travauxData : (travauxData?.results ?? []);

  const pending = requests.filter(r => ['brouillon', 'en_attente', 'valide_responsable', 'comptable', 'validation_dg'].includes(r.etape_workflow));
  const approved = requests.filter(r => ['approuve', 'recue', 'paye'].includes(r.etape_workflow));
  const totalApprouve = approved.reduce((s, r) => s + Number(r.montant_ttc ?? 0), 0);

  const filtered = requests.filter(r => {
    if (filter === 'Toutes') return true;
    if (filter === 'En attente') return pending.some(p => p.id === r.id);
    if (filter === 'Approuvés') return approved.some(a => a.id === r.id);
    if (filter === 'Refusés') return ['refuse', 'annule'].includes(r.etape_workflow);
    return true;
  });

  const total = articles.reduce((s, a) => s + (parseFloat(a.quantite) || 0) * (parseFloat(a.prix_unitaire) || 0), 0);

  /* ── Actions ─────────────────────────────────────────────────── */
  const closeModal = () => {
    setModalOpen(false);
    setStep('travail');
    setSelectedTravail(null);
    setServiceFonction('Maintenance');
    setMotifPrincipal('');
    setArticles([{ ...EMPTY_ARTICLE }]);
    setFormError(null);
    submittingRef.current = false;
  };

  const addArticle = () => setArticles(prev => [...prev, { ...EMPTY_ARTICLE }]);
  const removeArticle = (i: number) => {
    if (articles.length > 1) setArticles(prev => prev.filter((_, idx) => idx !== i));
  };
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
    if (submittingRef.current) return;
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError(null);
    submittingRef.current = true;
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
      })),
      soumettre,
    });
  };

  /* ── Shared input style ──────────────────────────────────────── */
  const inputSt = {
    borderWidth: 1, borderColor: t.border, borderRadius: 11,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: t.text, backgroundColor: t.surface,
  } as const;

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader
        t={t}
        title="Achats"
        kicker="Mes demandes de matériel"
        right={
          <TouchableOpacity
            onPress={() => setModalOpen(true)}
            activeOpacity={0.8}
            style={{
              width: 42, height: 42, borderRadius: 14,
              backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center',
              ...t.shadowSoft as any,
            }}
          >
            <Ic name="plus" size={22} color="#fff" sw={2.4} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {[
            ['En attente', String(pending.length), t.warnText],
            ['Approuvés', String(approved.length), t.successText],
            ['Ce mois', compactAmount(totalApprouve) + ' FCFA', t.text],
          ].map(([label, val, color]) => (
            <Card key={label} t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', fontSize: 18, color, letterSpacing: -0.5, textAlign: 'center' }}>{val}</Text>
              <Text style={{ fontSize: 11, color: t.text2, marginTop: 3, textAlign: 'center' }}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chips t={t} items={FILTERS as unknown as string[]} active={filter} onSelect={v => setFilter(v as Filter)} />
        </ScrollView>

        {/* List */}
        {isLoading ? (
          <View style={{ paddingTop: 48, alignItems: 'center' }}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingTop: 48, alignItems: 'center', gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ic name="cart" size={30} color={t.accentText} sw={1.8} />
            </View>
            <Text style={{ fontWeight: '700', fontSize: 16, color: t.text }}>Aucune demande</Text>
            <TouchableOpacity onPress={() => setModalOpen(true)} activeOpacity={0.8}>
              <Text style={{ fontSize: 13.5, color: t.accentText, fontWeight: '600' }}>Créer une demande</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((r: any) => {
              const tone = statusTone(r.etape_workflow);
              return (
                <Card key={r.id} t={t} pad={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, letterSpacing: -0.2 }} numberOfLines={1}>
                        {r.motif_principal || 'Sans motif'}
                      </Text>
                      {r.numero_facture && (
                        <Text style={{ fontSize: 12, color: t.text3, marginTop: 2, fontFamily: 'monospace' }}>
                          {r.numero_facture}
                        </Text>
                      )}
                      {r.date_demande && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <Ic name="calendar" size={12} color={t.text3} sw={1.8} />
                          <Text style={{ fontSize: 12, color: t.text2 }}>
                            {new Date(r.date_demande).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={{ fontWeight: '700', fontSize: 15, color: t.accentText }}>
                        {Number(r.montant_ttc ?? 0).toLocaleString('fr-FR')}
                      </Text>
                      <Text style={{ fontSize: 10, color: t.text3 }}>FCFA</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
                    <Badge t={t} tone={tone} dot={r.etape_workflow === 'en_attente'}>
                      {STATUS_LABEL[r.etape_workflow] ?? r.etape_workflow}
                    </Badge>
                    <Text style={{ fontSize: 12, color: t.text2 }}>
                      {r.etape_workflow === 'approuve' ? 'Prêt à retirer' :
                       r.etape_workflow === 'en_attente' ? 'Validation agence' :
                       r.etape_workflow === 'refuse' ? 'Hors budget' : ''}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Création Modal ───────────────────────────────────────── */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: t.bg }}>

            {/* Modal header */}
            <View style={{
              paddingTop: STATUS_BAR_H, paddingHorizontal: 20, paddingBottom: 14,
              borderBottomWidth: 1, borderBottomColor: t.border,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: t.bg,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ic name="cart" size={18} color={t.accentText} sw={1.9} />
                </View>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: t.text }}>Nouvelle demande</Text>
                  <Text style={{ fontSize: 11, color: t.text2, marginTop: 1 }}>
                    {step === 'travail' ? 'Sélectionnez un travail' : 'Remplissez le formulaire'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Ic name="x" size={18} color={t.text2} sw={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

              {/* Error */}
              {formError && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.dangerSoft, borderRadius: 11, padding: 12 }}>
                  <Ic name="alert" size={14} color={t.dangerText} sw={2} />
                  <Text style={{ fontSize: 12.5, color: t.dangerText, flex: 1 }}>{formError}</Text>
                </View>
              )}

              {step === 'travail' ? (
                /* ── Step 1: select travail ─────────────────────── */
                <View style={{ gap: 10 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>Travail concerné</Text>
                  {travaux.length === 0 ? (
                    <View style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 24, alignItems: 'center' }}>
                      <Text style={{ color: t.text2, fontSize: 13 }}>Aucun travail assigné</Text>
                    </View>
                  ) : (
                    travaux.map((task: any) => {
                      const sel = selectedTravail?.id === task.id;
                      return (
                        <TouchableOpacity
                          key={task.id}
                          onPress={() => { setSelectedTravail(task); setStep('form'); setFormError(null); }}
                          activeOpacity={0.7}
                          style={{
                            borderWidth: 1.5,
                            borderColor: sel ? t.accent : t.border,
                            borderRadius: 13, padding: 14,
                            backgroundColor: sel ? t.accentSoft : t.surface,
                          }}
                        >
                          <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }} numberOfLines={1}>{task.titre}</Text>
                          <Text style={{ fontSize: 11.5, color: t.text2, marginTop: 3 }}>
                            {task.appartement_nom ?? task.residence_nom ?? '—'} · {task.numero_travail}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              ) : (
                /* ── Step 2: form ──────────────────────────────── */
                <View style={{ gap: 16 }}>
                  {/* Travail recap */}
                  <TouchableOpacity
                    onPress={() => setStep('travail')}
                    activeOpacity={0.8}
                    style={{ backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <View>
                      <Text style={{ fontSize: 11, color: t.accentText, fontWeight: '600' }}>Travail sélectionné</Text>
                      <Text style={{ fontWeight: '700', fontSize: 13.5, color: t.text }} numberOfLines={1}>{selectedTravail?.titre}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: t.accentText, fontWeight: '600' }}>Changer</Text>
                  </TouchableOpacity>

                  {/* Service */}
                  <View>
                    <Text style={{ fontWeight: '700', fontSize: 12.5, color: t.text2, marginBottom: 8 }}>Service / Fonction *</Text>
                    <TextInput
                      value={serviceFonction}
                      onChangeText={setServiceFonction}
                      style={inputSt}
                      placeholder="Ex: Maintenance"
                      placeholderTextColor={t.text3}
                    />
                  </View>

                  {/* Motif */}
                  <View>
                    <Text style={{ fontWeight: '700', fontSize: 12.5, color: t.text2, marginBottom: 8 }}>Motif principal *</Text>
                    <TextInput
                      value={motifPrincipal}
                      onChangeText={v => { setMotifPrincipal(v); setFormError(null); }}
                      style={[inputSt, { height: 88, textAlignVertical: 'top' }]}
                      placeholder="Décrivez la raison de cette demande…"
                      placeholderTextColor={t.text3}
                      multiline
                    />
                  </View>

                  {/* Articles */}
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>Articles</Text>
                      <TouchableOpacity
                        onPress={addArticle}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 5 }}
                      >
                        <Ic name="plus" size={12} color={t.accentText} sw={2.4} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: t.accentText }}>Ajouter</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ gap: 12 }}>
                      {articles.map((article, i) => (
                        <View key={i} style={{ backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border, borderRadius: 13, padding: 14, gap: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '700', fontSize: 11, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.6 }}>Article #{i + 1}</Text>
                            {articles.length > 1 && (
                              <TouchableOpacity onPress={() => removeArticle(i)} activeOpacity={0.7}>
                                <Ic name="x" size={16} color={t.dangerText} sw={2} />
                              </TouchableOpacity>
                            )}
                          </View>

                          <TextInput
                            value={article.designation}
                            onChangeText={v => updateArticle(i, 'designation', v)}
                            style={{ ...inputSt, backgroundColor: t.surface }}
                            placeholder="Désignation *"
                            placeholderTextColor={t.text3}
                          />

                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TextInput
                              value={article.quantite}
                              onChangeText={v => updateArticle(i, 'quantite', v)}
                              style={{ ...inputSt, backgroundColor: t.surface, flex: 1 }}
                              placeholder="Qté *"
                              placeholderTextColor={t.text3}
                              keyboardType="numeric"
                            />
                            <TextInput
                              value={article.unite}
                              onChangeText={v => updateArticle(i, 'unite', v)}
                              style={{ ...inputSt, backgroundColor: t.surface, flex: 1 }}
                              placeholder="Unité *"
                              placeholderTextColor={t.text3}
                            />
                          </View>

                          <TextInput
                            value={article.prix_unitaire}
                            onChangeText={v => updateArticle(i, 'prix_unitaire', v)}
                            style={{ ...inputSt, backgroundColor: t.surface }}
                            placeholder="Prix unitaire (FCFA) *"
                            placeholderTextColor={t.text3}
                            keyboardType="numeric"
                          />

                          <TextInput
                            value={article.fournisseur}
                            onChangeText={v => updateArticle(i, 'fournisseur', v)}
                            style={{ ...inputSt, backgroundColor: t.surface }}
                            placeholder="Fournisseur (optionnel)"
                            placeholderTextColor={t.text3}
                          />

                          <Text style={{ fontSize: 11.5, color: t.text2, textAlign: 'right' }}>
                            Sous-total :{' '}
                            <Text style={{ fontWeight: '700', color: t.accentText }}>
                              {((parseFloat(article.quantite) || 0) * (parseFloat(article.prix_unitaire) || 0)).toLocaleString('fr-FR')} FCFA
                            </Text>
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Total */}
                    <View style={{
                      backgroundColor: t.accentSoft, borderWidth: 1, borderColor: t.accent,
                      borderRadius: 12, padding: 14, flexDirection: 'row',
                      alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
                    }}>
                      <Text style={{ fontWeight: '600', fontSize: 13.5, color: t.text }}>Total estimé</Text>
                      <Text style={{ fontWeight: '800', fontSize: 18, color: t.accentText }}>
                        {total.toLocaleString('fr-FR')} FCFA
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            {step === 'form' && (
              <View style={{
                flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16,
                paddingBottom: 36, borderTopWidth: 1, borderTopColor: t.border,
                backgroundColor: t.bg,
              }}>
                <TouchableOpacity
                  onPress={() => handleSubmit(false)}
                  disabled={createMutation.isPending}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, paddingVertical: 13, borderRadius: 13, alignItems: 'center',
                    backgroundColor: t.surface2, borderWidth: 1, borderColor: t.border,
                    opacity: createMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>Brouillon</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSubmit(true)}
                  disabled={createMutation.isPending}
                  activeOpacity={0.82}
                  style={{
                    flex: 2, paddingVertical: 13, borderRadius: 13, alignItems: 'center',
                    backgroundColor: t.accent, flexDirection: 'row', justifyContent: 'center', gap: 8,
                    opacity: createMutation.isPending ? 0.6 : 1,
                  }}
                >
                  {createMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ic name="check" size={16} color="#fff" sw={2.4} />
                        <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Soumettre</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
