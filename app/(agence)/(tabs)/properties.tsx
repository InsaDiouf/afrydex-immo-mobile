import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, FlatList, View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Tile, Seg, Chips, Ic, Progress, TabHeader, PhotoPlaceholder, fmt, ErrorState } from '@/components/agence/ui';

interface Residence {
  id: number;
  nom: string;
  quartier: string;
  ville: string;
  nombre_appartements: number;
  taux_occupation?: number;
  revenus_mois?: number;
  photo_principale_url?: string | null;
  secteur?: number | null;
  secteur_nom?: string | null;
  proprietaire_est_agence?: boolean | null;
}

interface Secteur { id: number; nom: string; }

function asList<T>(raw: any): T[] {
  return Array.isArray(raw) ? raw : (raw?.results ?? []);
}

interface Appartement {
  id: number;
  nom: string;
  residence_nom?: string;
  etage?: string;
  pieces?: number;
  surface?: number;
  statut: string;
  locataire_nom?: string;
  photo_url?: string | null;
}

function OccupancyBadge({ t, rate }: { t: any; rate?: number }) {
  if (rate === undefined) return null;
  const tone = rate === 100 ? 'success' : rate >= 90 ? 'info' : 'warn';
  return <Badge t={t} tone={tone}>{rate}%</Badge>;
}

function ResidenceCard({ t, item, onPress }: { t: any; item: Residence; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card t={t} pad={0} style={{ overflow: 'hidden' }}>
        {item.photo_principale_url
          ? <Image source={{ uri: item.photo_principale_url }} style={{ width: '100%', height: 104 }} resizeMode="cover" />
          : <View style={{ height: 104, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}><Ic name="building" size={36} color={t.text3} sw={1.5} /></View>}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 15.5, color: t.text, letterSpacing: -0.2 }} numberOfLines={1}>{item.nom}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <Ic name="mapPin" size={13} color={t.text3} sw={1.9} />
                <Text style={{ fontSize: 12.5, color: t.text2 }} numberOfLines={1}>
                  {item.quartier}, {item.ville}{item.secteur_nom ? ` · ${item.secteur_nom}` : ''}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <OccupancyBadge t={t} rate={item.taux_occupation} />
              {item.proprietaire_est_agence ? <Badge t={t} tone="info">Agence</Badge> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 13 }}>
            <View>
              <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{item.nombre_appartements}</Text>
              <Text style={{ fontSize: 11, color: t.text3 }}>appartements</Text>
            </View>
            {item.revenus_mois !== undefined && (
              <>
                <View style={{ width: 1, backgroundColor: t.border }} />
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: t.accentText }}>{fmt(item.revenus_mois)}</Text>
                  <Text style={{ fontSize: 11, color: t.text3 }}>FCFA / mois</Text>
                </View>
              </>
            )}
            <View style={{ flex: 1 }} />
            <Ic name="chevR" size={20} color={t.text3} sw={2} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function AppartementCard({ t, item, onPress }: { t: any; item: Appartement; onPress: () => void }) {
  const statusMap: Record<string, [any, string]> = {
    occupé: ['success', 'Occupé'], vacant: ['warn', 'Vacant'], travaux: ['info', 'Travaux'],
  };
  const [tone, label] = statusMap[item.statut?.toLowerCase()] ?? ['neutral', item.statut];
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card t={t} pad={14}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: '800', fontSize: 13, color: t.text }}>{item.nom}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text, letterSpacing: -0.1 }} numberOfLines={1}>
              {item.residence_nom ?? item.nom}{item.etage ? ` · ${item.etage}` : ''}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }}>{item.locataire_nom ?? '—'}</Text>
          </View>
          <Badge t={t} tone={tone as any}>{label}</Badge>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const PATRIMOINE_FILTERS = ['Tous', 'Nos biens', 'Propriétaires'];

export default function PropertiesScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [seg, setSeg] = useState('Résidences');
  const [search, setSearch] = useState('');
  const [secteurNom, setSecteurNom] = useState('Tous');
  const [patrimoine, setPatrimoine] = useState('Tous');

  const { data: secteursData } = useQuery({
    queryKey: ['secteurs'],
    queryFn: async () => { const { data } = await api.get('/secteurs/'); return asList<Secteur>(data); },
  });
  const secteurs = secteursData ?? [];
  const secteurId = secteurs.find(s => s.nom === secteurNom)?.id;

  const buildResidencesQuery = () => {
    const params = new URLSearchParams();
    if (secteurId) params.set('secteur', String(secteurId));
    if (patrimoine === 'Nos biens') params.set('proprietaire__est_agence', 'true');
    if (patrimoine === 'Propriétaires') params.set('proprietaire__est_agence', 'false');
    const qs = params.toString();
    return `/residences/${qs ? `?${qs}` : ''}`;
  };

  const residencesQuery = useQuery<{ results: Residence[] }>({
    queryKey: ['residences', secteurId ?? null, patrimoine],
    queryFn: async () => { const { data } = await api.get(buildResidencesQuery()); return data; },
  });
  const appartementsQuery = useQuery<{ results: Appartement[] }>({
    queryKey: ['appartements'],
    queryFn: async () => { const { data } = await api.get('/appartements/'); return data; },
  });

  const residences = (residencesQuery.data?.results ?? []).filter(r => !search || r.nom.toLowerCase().includes(search.toLowerCase()));
  const appartements = (appartementsQuery.data?.results ?? []).filter(a => !search || a.nom.toLowerCase().includes(search.toLowerCase()));

  const active = seg === 'Résidences' ? residencesQuery : appartementsQuery;
  const { isLoading, isError, refetch, isRefetching } = active;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader t={t} title="Biens" kicker="Parc immobilier" />

      <View style={{ paddingHorizontal: 20, paddingBottom: 0 }}>
        <Seg t={t} items={['Résidences', 'Appartements']} active={seg} onSelect={setSeg} />

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 13, paddingHorizontal: 14, marginTop: 12, ...t.shadowSoft as any }}>
          <Ic name="search" size={18} color={t.text3} sw={1.9} />
          <TextInput
            style={{ flex: 1, fontSize: 14.5, color: t.text }}
            placeholder={seg === 'Résidences' ? 'Rechercher une résidence…' : 'Rechercher un appartement…'}
            placeholderTextColor={t.text3}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filtres résidences : patrimoine + secteur */}
        {seg === 'Résidences' && (
          <View style={{ marginTop: 12, gap: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chips t={t} items={PATRIMOINE_FILTERS} active={patrimoine} onSelect={setPatrimoine} />
            </ScrollView>
            {secteurs.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Chips t={t} items={['Tous', ...secteurs.map(s => s.nom)]} active={secteurNom} onSelect={setSecteurNom} />
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : isError ? (
        <ErrorState t={t} onRetry={refetch} />
      ) : (
        <FlatList<Residence | Appartement>
          data={seg === 'Résidences' ? residences : appartements}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 14, gap: 13 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
          renderItem={({ item }) =>
            seg === 'Résidences'
              ? <ResidenceCard t={t} item={item as Residence} onPress={() => router.push(`/(agence)/residence/${item.id}`)} />
              : <AppartementCard t={t} item={item as Appartement} onPress={() => router.push(`/(agence)/apartment/${item.id}`)} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 64 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Ic name="building" size={36} color={t.accentText} sw={1.7} />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text }}>Aucun bien</Text>
              <Text style={{ fontSize: 14, color: t.text2, marginTop: 6, textAlign: 'center', maxWidth: 260 }}>
                Les {seg === 'Résidences' ? 'résidences' : 'appartements'} apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
