import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { useAuth } from '@/ctx/auth';
import { api, sharePdf } from '@/lib/api';
import { Card, Seg, Tile, Btn, DetailHeader, ErrorState, money, fmt } from '@/components/agence/ui';

// Réponse de GET /payments/recap/ (voir apps/payments/recap.py)
interface Groupe { id: number | string | null; label: string; total: number; nombre: number; }
interface RecapPaiement {
  id: number; numero: string; date: string; montant: number; moyen_label: string;
  locataire: string; appartement: string; residence: string; caissier: string;
}
interface Recap {
  periode: { type: 'jour' | 'mois'; libelle: string };
  total_encaisse: number;
  nb_paiements: number;
  annules: { nombre: number; total: number };
  par_moyen: Groupe[];
  par_caissier: Groupe[];
  par_secteur: Groupe[];
  par_residence: Groupe[];
  par_jour: { date: string; total: number; nombre: number }[] | null;
  impayes: { nb_retard: number; total_impaye: number };
  paiements: RecapPaiement[];
  depenses: { total: number; solde_net: number } | null;
  scope_caissier: string | null;
}

const PERIODES = ['Jour', 'Mois'];
const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoMonth = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

function shift(ref: Date, jour: boolean, delta: number) {
  const d = new Date(ref);
  if (jour) d.setDate(d.getDate() + delta);
  else d.setMonth(d.getMonth() + delta, 1);
  return d;
}

export default function RecapScreen() {
  const { theme: t } = useAgencyTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [periode, setPeriode] = useState('Jour');
  const [ref, setRef] = useState(() => new Date());
  const jour = periode === 'Jour';
  const isCaissier = user?.user_type === 'caissier';

  const params = jour ? `periode=jour&date=${isoDay(ref)}` : `periode=mois&mois=${isoMonth(ref)}`;
  const { data, isLoading, isError, refetch, isFetching } = useQuery<Recap>({
    queryKey: ['payments-recap', params],
    queryFn: async () => { const { data } = await api.get(`/payments/recap/?${params}`); return data; },
  });

  const [sharing, setSharing] = useState(false);
  const handlePdf = async () => {
    setSharing(true);
    try {
      const nom = `recap_${jour ? isoDay(ref) : isoMonth(ref)}.pdf`;
      await sharePdf(`/payments/recap-pdf/?${params}`, nom, 'Récapitulatif des encaissements');
    } catch {
      Alert.alert('PDF indisponible', "Le récapitulatif n'a pas pu être téléchargé. Réessaie.");
    } finally {
      setSharing(false);
    }
  };

  const total = Number(data?.total_encaisse ?? 0);
  const isCurrent = jour ? isoDay(ref) === isoDay(new Date()) : isoMonth(ref) === isoMonth(new Date());
  const maxJour = Math.max(1, ...(data?.par_jour ?? []).map(j => Number(j.total)));

  const section = (title: string, icon: string, items: Groupe[]) => (
    <View style={{ marginTop: 18 }}>
      <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, marginBottom: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
      <Card t={t} pad={14}>
        {items.length === 0 ? (
          <Text style={{ fontSize: 13.5, color: t.text2 }}>Aucun encaissement</Text>
        ) : items.map((g, i) => {
          const pct = total > 0 ? Number(g.total) / total : 0;
          return (
            <View key={`${g.id ?? 'na'}-${i}`} style={{ paddingVertical: 9, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Tile t={t} name={icon} tone="accent" size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: t.text }} numberOfLines={1}>{g.label}</Text>
                  <Text style={{ fontSize: 11.5, color: t.text2 }}>{g.nombre} paiement{g.nombre > 1 ? 's' : ''} · {Math.round(pct * 100)}%</Text>
                </View>
                <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{fmt(Number(g.total))}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: t.surface2, marginTop: 8, marginLeft: 44, overflow: 'hidden' }}>
                <View style={{ height: 4, width: `${pct * 100}%`, backgroundColor: t.accent, borderRadius: 2 }} />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Récapitulatif" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Seg t={t} items={PERIODES} active={periode} onSelect={setPeriode} />

        {/* Navigation dans les périodes */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <TouchableOpacity onPress={() => setRef(shift(ref, jour, -1))} hitSlop={10} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.text2 }}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRef(new Date())} disabled={isCurrent} style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: t.text }}>
              {data?.periode.libelle ?? '…'}
            </Text>
            {!isCurrent && <Text style={{ fontSize: 12, color: t.accentText, marginTop: 2 }}>{jour ? "Revenir à aujourd'hui" : 'Revenir au mois en cours'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRef(shift(ref, jour, 1))} hitSlop={10} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: t.text2 }}>›</Text>
          </TouchableOpacity>
        </View>

        {isError ? (
          <ErrorState t={t} onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
        ) : (
          <View style={{ opacity: isFetching ? 0.6 : 1 }}>
            {/* Total */}
            <View style={{ borderRadius: 22, padding: 18, marginTop: 14, backgroundColor: t.heroFrom, ...(t.shadow as any) }}>
              <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
                {isCaissier ? 'Mes encaissements' : 'Total encaissé'}
              </Text>
              <Text style={{ fontWeight: '700', fontSize: 30, color: '#fff', letterSpacing: -0.8, marginTop: 6 }}>
                {fmt(total)}<Text style={{ fontSize: 14, fontWeight: '600', opacity: 0.85 }}> FCFA</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
                {[
                  [String(data.nb_paiements), 'paiements'],
                  [String(data.impayes.nb_retard), 'en retard'],
                  ...(data.depenses ? [[fmt(Number(data.depenses.solde_net)), 'solde net']] : []),
                ].map(([val, label]) => (
                  <View key={label}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{val}</Text>
                    <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)' }}>{label}</Text>
                  </View>
                ))}
              </View>
              {data.annules.nombre > 0 && (
                <Text style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 10 }}>
                  {data.annules.nombre} paiement(s) annulé(s) non compté(s) · {money(Number(data.annules.total))}
                </Text>
              )}
            </View>

            {/* Histogramme du mois : toucher une barre ouvre la journée */}
            {data.par_jour && (
              <Card t={t} pad={14} style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  {data.par_jour.map(j => (
                    <TouchableOpacity key={j.date} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}
                      onPress={() => { setPeriode('Jour'); setRef(new Date(`${j.date}T00:00:00`)); }}>
                      <View style={{ height: `${(Number(j.total) / maxJour) * 100}%`, minHeight: j.nombre ? 3 : 0, backgroundColor: t.accent, borderRadius: 2 }} />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 10.5, color: t.text3 }}>1</Text>
                  <Text style={{ fontSize: 10.5, color: t.text3 }}>{data.par_jour.length}</Text>
                </View>
              </Card>
            )}

            {section('Par moyen de paiement', 'coins', data.par_moyen)}
            {!isCaissier && section('Par caissier', 'user', data.par_caissier)}
            {section('Par secteur', 'map', data.par_secteur)}
            {section('Par bâtiment', 'building', data.par_residence)}

            {/* Détail */}
            <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, marginTop: 18, marginBottom: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Détail ({data.paiements.length})
            </Text>
            <Card t={t} pad={14}>
              {data.paiements.length === 0 ? (
                <Text style={{ fontSize: 13.5, color: t.text2 }}>Aucun encaissement sur la période</Text>
              ) : data.paiements.map((p, i) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < data.paiements.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
                  <Tile t={t} name="check" tone="success" size={36} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }} numberOfLines={1}>{p.locataire || '—'}</Text>
                    <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }} numberOfLines={1}>
                      {[p.residence && `${p.residence} ${p.appartement}`, p.moyen_label, !jour && new Date(`${p.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: t.text }}>{fmt(Number(p.montant))}</Text>
                </View>
              ))}
            </Card>

            <View style={{ marginTop: 18 }}>
              <Btn t={t} icon="share" full onPress={handlePdf} disabled={sharing}>
                {sharing ? 'Préparation du PDF…' : 'Partager / imprimer le PDF'}
              </Btn>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
