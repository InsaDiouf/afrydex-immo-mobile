import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Ic, DetailHeader, PhotoPlaceholder, fmt } from '@/components/agence/ui';

interface Appartement {
  id: number;
  nom: string;
  etage?: number;
  nb_pieces?: number;
  statut_occupation: string;
  loyer_base?: number;
  photo_principale_url?: string | null;
}

interface Residence {
  id: number;
  nom: string;
  adresse?: string;
  quartier?: string;
  ville?: string;
  nb_appartements_total?: number;
  taux_occupation?: number;
  photo_principale_url?: string | null;
}

function AptStatusBadge({ t, statut }: { t: any; statut: string }) {
  const map: Record<string, 'success' | 'warn' | 'info'> = {
    occupé: 'success', occupe: 'success',
    vacant: 'warn',
    travaux: 'info',
  };
  const tone = map[statut?.toLowerCase()] ?? ('neutral' as any);
  const label = statut?.charAt(0).toUpperCase() + statut?.slice(1);
  return <Badge t={t} tone={tone}>{label}</Badge>;
}

export default function ResidenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const { data: res, isLoading } = useQuery<Residence>({
    queryKey: ['residence', id],
    queryFn: async () => { const { data } = await api.get(`/residences/${id}/`); return data; },
  });

  const { data: aptsData, isLoading: aptsLoading } = useQuery<{ results: Appartement[] }>({
    queryKey: ['appartements', 'residence', id],
    queryFn: async () => { const { data } = await api.get(`/appartements/?residence=${id}`); return data; },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Résidence" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  const apts = aptsData?.results ?? [];
  const nbApts = res?.nb_appartements_total ?? apts.length;
  const tauxOcc = res?.taux_occupation;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title={res?.nom ?? 'Résidence'} onBack={() => router.back()}
        right={<Ic name="settings" size={20} color={t.text} sw={1.8} />} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {res?.photo_principale_url
          ? <Image source={{ uri: res.photo_principale_url }} style={{ width: '100%', height: 150, borderRadius: 14 }} resizeMode="cover" />
          : <PhotoPlaceholder t={t} h={150} />}

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontWeight: '700', fontSize: 21, color: t.text, letterSpacing: -0.4 }}>{res?.nom}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
            <Ic name="mapPin" size={15} color={t.accentText} sw={1.9} />
            <Text style={{ fontSize: 13.5, color: t.text2 }}>
              {[res?.adresse, res?.quartier, res?.ville].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 11, marginTop: 16 }}>
          {([
            [String(nbApts), 'Appartements'],
            [tauxOcc !== undefined ? `${tauxOcc}%` : '—', 'Occupé'],
          ] as [string, string][]).map(([val, label]) => (
            <Card key={label} t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontWeight: '700', fontSize: 19, color: t.text, letterSpacing: -0.5 }}>{val}</Text>
              <Text style={{ fontSize: 11.5, color: t.text2, marginTop: 3 }}>{label}</Text>
            </Card>
          ))}
        </View>

        {/* Appartements list */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 11 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, letterSpacing: -0.2 }}>Appartements</Text>
          <Text style={{ fontWeight: '600', fontSize: 12.5, color: t.text3 }}>{nbApts} logement{nbApts !== 1 ? 's' : ''}</Text>
        </View>

        <Card t={t} pad={6}>
          {aptsLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color={t.accent} size="small" />
            </View>
          ) : apts.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucun appartement</Text>
            </View>
          ) : apts.map((a, i) => (
            <TouchableOpacity key={a.id} activeOpacity={0.8} onPress={() => router.push(`/(agence)/apartment/${a.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 10, paddingVertical: 11,
                borderBottomWidth: i < apts.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', fontSize: 13, color: t.text }}>{a.nom?.slice(0, 3)}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{a.nom}</Text>
                {a.nb_pieces !== undefined && (
                  <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>{a.nb_pieces} pièce{a.nb_pieces > 1 ? 's' : ''}</Text>
                )}
              </View>
              <AptStatusBadge t={t} statut={a.statut_occupation} />
            </TouchableOpacity>
          ))}
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
