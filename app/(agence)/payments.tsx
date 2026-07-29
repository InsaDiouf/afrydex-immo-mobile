import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Tile, Chips, Ic, DetailHeader, fmt, money } from '@/components/agence/ui';

interface Payment {
  id: number;
  locataire?: number | null;
  locataire_nom?: string;
  appartement_nom?: string;
  montant: number;
  statut: string;
  date_paiement?: string;
  date_echeance?: string;
}

interface PaymentsOverview {
  total_encaisse?: number;
  nb_recus?: number;
  nb_retard?: number;
  total_impaye?: number;
  results?: Payment[];
}

interface NamedRef { id: number; nom: string; }
interface Occupant { id: number; nom_complet: string; }

function asList<T>(raw: any): T[] {
  return Array.isArray(raw) ? raw : (raw?.results ?? []);
}

const FILTERS = ['Tous', 'Reçu', 'En retard', 'Mobile Money'];

export default function PaymentsScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [filter, setFilter] = useState('Tous');
  const [secteurNom, setSecteurNom] = useState('Tous');
  const [batimentNom, setBatimentNom] = useState('Tous');
  const [occupant, setOccupant] = useState<Occupant | null>(null);
  const [occupantPickerOpen, setOccupantPickerOpen] = useState(false);
  const [occupantSearch, setOccupantSearch] = useState('');

  const { data: secteursData } = useQuery({
    queryKey: ['secteurs'],
    queryFn: async () => { const { data } = await api.get('/secteurs/'); return asList<NamedRef>(data); },
  });
  const { data: residencesRefData } = useQuery({
    queryKey: ['residences-ref'],
    queryFn: async () => { const { data } = await api.get('/residences/'); return asList<NamedRef>(data); },
  });
  const { data: occupantsData } = useQuery({
    queryKey: ['occupants-ref'],
    queryFn: async () => { const { data } = await api.get('/tiers/?type_tiers=locataire'); return asList<Occupant>(data); },
  });
  const secteurs = secteursData ?? [];
  const batiments = residencesRefData ?? [];
  const occupants = occupantsData ?? [];
  const secteurId = secteurs.find(s => s.nom === secteurNom)?.id;
  const batimentId = batiments.find(b => b.nom === batimentNom)?.id;

  const buildPaymentsQuery = () => {
    const params = new URLSearchParams();
    if (secteurId) params.set('secteur', String(secteurId));
    if (batimentId) params.set('residence', String(batimentId));
    if (occupant) params.set('locataire', String(occupant.id));
    const qs = params.toString();
    return `/payments/${qs ? `?${qs}` : ''}`;
  };

  const { data, isLoading } = useQuery<PaymentsOverview>({
    queryKey: ['payments', secteurId ?? null, batimentId ?? null, occupant?.id ?? null],
    queryFn: async () => { const { data } = await api.get(buildPaymentsQuery()); return data; },
  });

  const filteredOccupants = occupants.filter(o =>
    !occupantSearch || o.nom_complet.toLowerCase().includes(occupantSearch.toLowerCase()));

  const all = data?.results ?? [];
  const payments = filter === 'Tous' ? all : all.filter(p => {
    if (filter === 'Reçu')     return p.statut?.toLowerCase() === 'reçu' || p.statut?.toLowerCase() === 'recu';
    if (filter === 'En retard') return p.statut?.toLowerCase() === 'en retard' || p.statut?.toLowerCase() === 'en_retard';
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Paiements" onBack={() => router.back()}
        right={<Ic name="filter" size={20} color={t.text} sw={1.9} />} />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={{ padding: 20, paddingTop: 6 }}>
            {/* Hero card */}
            <View style={{ borderRadius: 22, padding: 18, backgroundColor: t.heroFrom, ...(t.shadow as any) }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>Encaissé ce mois</Text>
              <Text style={{ fontWeight: '700', fontSize: 30, color: '#fff', letterSpacing: -0.8, marginTop: 6 }}>
                {fmt(data?.total_encaisse ?? 0)}<Text style={{ fontSize: 14, fontWeight: '600', opacity: 0.85 }}> FCFA</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 20, marginTop: 14 }}>
                {[
                  [String(data?.nb_recus ?? 0), 'reçus'],
                  [String(data?.nb_retard ?? 0), 'en retard'],
                  [data?.total_impaye ? `${Math.round(data.total_impaye / 1000)}k` : '0', 'impayés'],
                ].map(([val, label]) => (
                  <View key={label}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{val}</Text>
                    <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Filters */}
            <View style={{ marginTop: 18, marginBottom: 12, gap: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Chips t={t} items={FILTERS} active={filter} onSelect={setFilter} />
              </ScrollView>
              {secteurs.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Chips t={t} items={['Tous', ...secteurs.map(s => s.nom)]} active={secteurNom} onSelect={setSecteurNom} />
                </ScrollView>
              )}
              {batiments.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Chips t={t} items={['Tous', ...batiments.map(b => b.nom)]} active={batimentNom} onSelect={setBatimentNom} />
                </ScrollView>
              )}
              {occupants.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setOccupantPickerOpen(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999,
                    backgroundColor: occupant ? t.accent : t.surface,
                    borderWidth: 1, borderColor: occupant ? t.accent : t.border }}>
                  <Ic name="user" size={14} color={occupant ? '#fff' : t.text2} sw={1.9} />
                  <Text style={{ fontWeight: '600', fontSize: 13, color: occupant ? '#fff' : t.text2 }} numberOfLines={1}>
                    {occupant ? occupant.nom_complet : 'Occupant'}
                  </Text>
                  {occupant && (
                    <TouchableOpacity onPress={() => setOccupant(null)} hitSlop={8}>
                      <Ic name="x" size={14} color="#fff" sw={2.2} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const received = item.statut?.toLowerCase().includes('reçu') || item.statut?.toLowerCase().includes('recu');
          const tone = received ? 'success' as const : 'danger' as const;
          const dateStr = item.date_paiement
            ? new Date(item.date_paiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
            : item.date_echeance
            ? `échéance ${new Date(item.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`
            : '';
          return (
            <TouchableOpacity
              activeOpacity={item.locataire ? 0.7 : 1}
              disabled={!item.locataire}
              onPress={() => item.locataire && router.push(`/(agence)/tenant/${item.locataire}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Tile t={t} name={received ? 'check' : 'alert'} tone={tone} size={42} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{item.locataire_nom ?? '—'}</Text>
                <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>{[item.appartement_nom, dateStr].filter(Boolean).join(' · ')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{Number(item.montant).toLocaleString('fr-FR')}</Text>
                <View style={{ marginTop: 4 }}><Badge t={t} tone={tone}>{received ? 'Reçu' : 'En retard'}</Badge></View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucun paiement trouvé</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />

      {/* Sélecteur d'occupant (avec recherche) */}
      <Modal visible={occupantPickerOpen} transparent animationType="slide" onRequestClose={() => setOccupantPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '75%', paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ fontWeight: '700', fontSize: 16, color: t.text }}>Filtrer par occupant</Text>
              <TouchableOpacity onPress={() => setOccupantPickerOpen(false)} hitSlop={10}>
                <Ic name="x" size={22} color={t.text2} sw={2} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 13, paddingHorizontal: 14, marginHorizontal: 20, marginBottom: 10 }}>
              <Ic name="search" size={18} color={t.text3} sw={1.9} />
              <TextInput
                style={{ flex: 1, fontSize: 14.5, color: t.text }}
                placeholder="Rechercher un occupant…"
                placeholderTextColor={t.text3}
                value={occupantSearch}
                onChangeText={setOccupantSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredOccupants}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => { setOccupant(item); setOccupantPickerOpen(false); setOccupantSearch(''); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.border }}>
                  <Tile t={t} name="user" tone="info" size={38} />
                  <Text style={{ flex: 1, fontWeight: '600', fontSize: 14.5, color: t.text }}>{item.nom_complet}</Text>
                  {occupant?.id === item.id && <Ic name="check" size={18} color={t.accentText} sw={2.4} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 30 }}>
                  <Text style={{ fontSize: 14, color: t.text2 }}>Aucun occupant trouvé</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
