import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Btn, KV, Row, Divider, Ic, Progress, DetailHeader, money } from '@/components/agence/ui';

interface ContractDetail {
  id: number;
  numero_contrat: string;
  statut: string;
  appartement_nom?: string;
  residence_nom?: string;
  type_bail?: string;
  date_debut?: string;
  date_fin?: string;
  loyer_base?: number;
  charges?: number;
  caution?: number;
  statut_paiements?: string;
  locataire_nom?: string;
  locataire_phone?: string;
  proprietaire_nom?: string;
  proprietaire_contact?: string;
  documents?: { nom: string; date?: string; url?: string }[];
}

function ContractBadge({ t, statut }: { t: any; statut: string }) {
  const map: Record<string, { tone: 'success' | 'warn' | 'danger' | 'neutral'; label: string }> = {
    actif:      { tone: 'success', label: 'Actif' },
    renouveler: { tone: 'warn',    label: 'À renouveler' },
    expiré:     { tone: 'danger',  label: 'Expiré' },
    expire:     { tone: 'danger',  label: 'Expiré' },
  };
  const { tone, label } = map[statut?.toLowerCase()] ?? { tone: 'neutral', label: statut };
  return <Badge t={t} tone={tone} dot={tone === 'success'}>{label}</Badge>;
}

function monthsLeft(dateFin?: string): number {
  if (!dateFin) return 0;
  const diff = new Date(dateFin).getTime() - Date.now();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24 * 30)));
}

function contractProgress(dateDebut?: string, dateFin?: string): number {
  if (!dateDebut || !dateFin) return 0;
  const start = new Date(dateDebut).getTime();
  const end = new Date(dateFin).getTime();
  const now = Date.now();
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const { data: c, isLoading } = useQuery<ContractDetail>({
    queryKey: ['contract', id],
    queryFn: async () => { const { data } = await api.get(`/contracts/${id}/`); return data; },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Contrat" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  const left = monthsLeft(c?.date_fin);
  const progress = contractProgress(c?.date_debut, c?.date_fin);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title={c?.numero_contrat ?? 'Contrat'} onBack={() => router.back()}
        right={<Ic name="dots" size={22} color={t.text} sw={2} />} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 6 }} showsVerticalScrollIndicator={false}>

        {/* Summary card */}
        <Card t={t}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
              <Text style={{ fontSize: 12.5, color: t.text2 }}>{c?.type_bail ?? 'Bail de location'}</Text>
              <Text style={{ fontWeight: '700', fontSize: 18, color: t.text, letterSpacing: -0.2, marginTop: 3 }}>{c?.appartement_nom ?? '—'}</Text>
              {c?.residence_nom && <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }}>{c.residence_nom}</Text>}
            </View>
            {c && <ContractBadge t={t} statut={c.statut} />}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 12.5, color: t.text2 }}>
              {c?.date_debut ? new Date(c.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </Text>
            <Text style={{ fontWeight: '600', fontSize: 12, color: t.accentText }}>{left} mois restants</Text>
            <Text style={{ fontSize: 12.5, color: t.text2 }}>
              {c?.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </Text>
          </View>
          <Progress t={t} value={progress} />
        </Card>

        {/* Parties */}
        <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Parties</Text>
        <Card t={t} pad={14}>
          <Row t={t} title={c?.locataire_nom ?? '—'} sub="Locataire"
            right={
              c?.locataire_phone ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(`tel:${c.locataire_phone}`)}
                  style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Ic name="phone" size={17} color={t.accentText} sw={1.9} />
                </TouchableOpacity>
              ) : null
            }
          />
          {c?.proprietaire_nom && (
            <>
              <Divider t={t} m={12} />
              <Row t={t} title={c.proprietaire_nom} sub="Propriétaire"
                right={
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Ic name="briefcase" size={17} color={t.accentText} sw={1.9} />
                  </View>
                }
              />
            </>
          )}
        </Card>

        {/* Conditions financières */}
        <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Conditions financières</Text>
        <Card t={t}>
          {c?.loyer_base && <KV t={t} k="Loyer mensuel" v={money(c.loyer_base)} accent />}
          {c?.charges    && <KV t={t} k="Charges"       v={money(c.charges)} />}
          {c?.caution    && <KV t={t} k="Caution"       v={money(c.caution)} />}
          <KV t={t} k="Statut paiements" v={c?.statut_paiements ?? 'À jour'} last />
        </Card>

        {/* Documents */}
        {c?.documents && c.documents.length > 0 && (
          <>
            <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Documents</Text>
            <Card t={t} pad={14}>
              {c.documents.map((doc, i, arr) => (
                <View key={doc.nom}>
                  <Row t={t} tile="doc" tone="info" title={doc.nom}
                    sub={doc.date ? new Date(doc.date).toLocaleDateString('fr-FR') : undefined}
                    right={<TouchableOpacity onPress={() => doc.url && Linking.openURL(doc.url)}><Ic name="download" size={18} color={t.text3} sw={1.9} /></TouchableOpacity>}
                  />
                  {i < arr.length - 1 && <Divider t={t} m={12} />}
                </View>
              ))}
            </Card>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
