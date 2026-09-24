import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import {
  Card, Badge, Tile, Row, Divider, Avatar, IconBtn, Progress, Spark,
  KV, Ic, fmt, money, STATUS_BAR_H, ErrorState,
} from '@/components/agence/ui';

interface DashboardData {
  agence_nom?: string;
  loyers_percus?: number;
  loyers_percus_prev?: number;
  revenus_evolution?: string | null;
  revenus_evolution_val?: number | null;
  sparkline?: number[];
  taux_occupation?: number;
  impayés?: number;
  total_residences?: number;
  total_appartements?: number;
  total_contrats_actifs?: number;
  total_maintenances_en_cours?: number;
  alertes?: { type: string; message: string }[];
}

function KpiCard({ t, icon, tone, label, value, unit, foot }: any) {
  return (
    <Card t={t} pad={14} style={{ flex: 1 }}>
      <Tile t={t} name={icon} tone={tone} size={36} />
      <Text style={{ fontWeight: '700', fontSize: 22, color: t.text, letterSpacing: -0.6, marginTop: 12 }}>
        {value}<Text style={{ fontSize: 12.5, fontWeight: '600', color: t.text2 }}>{' '}{unit}</Text>
      </Text>
      <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 5 }}>{label}</Text>
      {foot}
    </Card>
  );
}

export default function AgenceDashboard() {
  const { user } = useAuth();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/');
      return data;
    },
  });

  const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() || 'AG';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ paddingTop: STATUS_BAR_H, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: t.bg, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar t={t} initials={initials} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 12.5, color: t.text2 }}>{data?.agence_nom ?? 'Agence'}</Text>
          <Text style={{ fontWeight: '700', fontSize: 19, color: t.text, letterSpacing: -0.3 }} numberOfLines={1}>
            {user?.first_name} {user?.last_name}
          </Text>
        </View>
        <IconBtn t={t} name="bell" badge />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : isError ? (
        <ErrorState t={t} onRetry={refetch} />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 0 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
        >

          {/* Hero — revenus du mois */}
          {(() => {
            const evo = data?.revenus_evolution_val;
            const isPos = evo !== null && evo !== undefined && evo >= 0;
            const sparkData = data?.sparkline && data.sparkline.some(v => v > 0)
              ? data.sparkline
              : null;
            return (
              <View style={{ borderRadius: 24, padding: 20, overflow: 'hidden', marginTop: 4, backgroundColor: t.heroFrom, ...(t.shadow as any) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>Revenus encaissés · ce mois</Text>
                    <Text style={{ fontWeight: '700', fontSize: 33, color: '#fff', letterSpacing: -1, marginTop: 8 }}>
                      {fmt(data?.loyers_percus ?? 0)}<Text style={{ fontSize: 15, fontWeight: '600', opacity: 0.85 }}> FCFA</Text>
                    </Text>
                  </View>
                  {data?.revenus_evolution ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                      <Ic name={isPos ? 'trendUp' : 'trendDown'} size={14} color="#fff" sw={2.2} />
                      <Text style={{ fontWeight: '700', fontSize: 12.5, color: '#fff' }}>{data.revenus_evolution}</Text>
                    </View>
                  ) : null}
                </View>
                {sparkData ? (
                  <View style={{ marginTop: 16 }}>
                    <Spark data={sparkData} color="#fff" h={38} />
                  </View>
                ) : null}
              </View>
            );
          })()}

          {/* KPI grid */}
          <View style={{ flexDirection: 'row', gap: 11, marginTop: 14 }}>
            <KpiCard t={t} icon="percent" tone="accent" value={data?.taux_occupation ?? '—'} unit="%" label="Taux d'occupation"
              foot={data?.taux_occupation ? <View style={{ marginTop: 9 }}><Progress t={t} value={data.taux_occupation} /></View> : null} />
            <KpiCard t={t} icon="alert" tone="danger" value={fmt(data?.impayés ?? 0)} unit="" label="Impayés en cours"
              foot={<Text style={{ fontWeight: '600', fontSize: 11.5, color: t.dangerText, marginTop: 9 }}>Relancer</Text>} />
          </View>
          <View style={{ flexDirection: 'row', gap: 11, marginTop: 11 }}>
            <KpiCard t={t} icon="building" tone="info" value={data?.total_residences ?? '—'} unit="résid." label={`${data?.total_appartements ?? '—'} appartements`} />
            <KpiCard t={t} icon="contract" tone="accent" value={data?.total_contrats_actifs ?? '—'} unit="actifs" label="Contrats en cours" />
          </View>

          {/* À traiter */}
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>À traiter</Text>
          <Card t={t} pad={14}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(agence)/payments')}>
              <Row t={t} tile="alert" tone="danger" title="Loyers impayés" sub={`Total ${fmt(data?.impayés ?? 0)} FCFA · en retard`} right={<Badge t={t} tone="danger">Urgent</Badge>} />
            </TouchableOpacity>
            <Divider t={t} m={12} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(agence)/(tabs)/maintenance')}>
              <Row t={t} tile="wrench" tone="warn" title={`${data?.total_maintenances_en_cours ?? 0} interventions en cours`} sub="Urgentes et planifiées" right={<Ic name="chevR" size={18} color={t.text3} sw={2} />} />
            </TouchableOpacity>
            <Divider t={t} m={12} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(agence)/(tabs)/contracts')}>
              <Row t={t} tile="contract" tone="info" title="Contrats à renouveler" sub="Échéance sous 30 jours" right={<Ic name="chevR" size={18} color={t.text3} sw={2} />} />
            </TouchableOpacity>
            <Divider t={t} m={12} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(agence)/purchase-requests')}>
              <Row t={t} tile="cart" tone="neutral" title="Demandes d'achat" sub="En attente de validation" right={<Ic name="chevR" size={18} color={t.text3} sw={2} />} />
            </TouchableOpacity>
          </Card>

          {/* Alertes backend */}
          {data?.alertes && data.alertes.length > 0 && (
            <>
              <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Alertes</Text>
              <Card t={t} pad={14}>
                {data.alertes.map((a, i, arr) => (
                  <View key={i}>
                    <Row t={t} tile="alert" tone="warn" title={a.type} sub={a.message} right={null} />
                    {i < arr.length - 1 && <Divider t={t} m={12} />}
                  </View>
                ))}
              </Card>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}
