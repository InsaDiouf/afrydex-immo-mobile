import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { DetailHeader, Tile, ErrorState } from '@/components/agence/ui';

// GET /notifications/ : notifications de la cloche (mêmes que sur le web)
interface AppNotification {
  id: number;
  type: string;
  titre: string;
  message: string;
  lien: string;
  lue: boolean;
  created_at: string;
}

const ICONES: Record<string, string> = {
  contract_renewal: 'calendar', contract_renewed: 'calendar', contract_ended: 'calendar',
  contract_signed: 'pen', inventory_signed: 'doc', pmo_step: 'contract',
  purchase_request: 'cart', invoices_overdue: 'alert', maintenance_reported: 'wrench', maintenance_done: 'check',
};

/** Lien web (« /contracts/12 ») → écran mobile équivalent, s'il existe */
function routeMobile(lien: string): string | null {
  const m = lien.match(/^\/(contracts|maintenance)\/(\d+)/);
  if (m) return m[1] === 'contracts' ? `/(agence)/contract/${m[2]}` : `/(agence)/maintenance/${m[2]}`;
  if (lien.startsWith('/payments')) return '/(agence)/payments';
  if (lien.startsWith('/purchase-requests')) return '/(agence)/purchase-requests';
  return null;
}

function depuis(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j < 30 ? `il y a ${j} j` : new Date(iso).toLocaleDateString('fr-FR');
}

export default function NotificationsScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<AppNotification[]>({
    queryKey: ['notifications', 'liste'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/', { params: { page_size: 50 } });
      return Array.isArray(data) ? data : data.results ?? [];
    },
  });

  const majCompteur = () => queryClient.invalidateQueries({ queryKey: ['notifications', 'non-lues'] });

  const ouvrir = async (n: AppNotification) => {
    if (!n.lue) {
      queryClient.setQueryData<AppNotification[]>(['notifications', 'liste'], (l) => l?.map((x) => (x.id === n.id ? { ...x, lue: true } : x)));
      api.post(`/notifications/${n.id}/lire/`).then(majCompteur).catch(() => {});
    }
    const route = routeMobile(n.lien);
    if (route) router.push(route as any);
  };

  const toutLire = async () => {
    await api.post('/notifications/tout-lire/').catch(() => {});
    queryClient.setQueryData<AppNotification[]>(['notifications', 'liste'], (l) => l?.map((x) => ({ ...x, lue: true })));
    majCompteur();
  };

  const nonLues = data?.some((n) => !n.lue);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Notifications" onBack={() => router.back()}
        right={nonLues ? (
          <TouchableOpacity onPress={toutLire} hitSlop={10}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.accentText }}>Tout lire</Text>
          </TouchableOpacity>
        ) : undefined} />
      {isError ? (
        <ErrorState t={t} onRetry={refetch} />
      ) : isLoading ? (
        <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={t.accent} /></View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n) => String(n.id)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.accent} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderItem={({ item: n }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => ouvrir(n)}
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: t.border }}>
              <Tile t={t} name={ICONES[n.type] ?? 'bell'} tone={n.type === 'invoices_overdue' ? 'warn' : 'accent'} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ flex: 1, fontWeight: n.lue ? '600' : '700', fontSize: 14, color: t.text }}>{n.titre}</Text>
                  {!n.lue && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent, marginTop: 5 }} />}
                </View>
                <Text style={{ fontSize: 13, color: t.text2, marginTop: 2, lineHeight: 18 }} numberOfLines={3}>{n.message}</Text>
                <Text style={{ fontSize: 11.5, color: t.text3, marginTop: 4 }}>{depuis(n.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 50, gap: 10 }}>
              <Tile t={t} name="bell" tone="info" size={48} />
              <Text style={{ fontSize: 14, color: t.text2 }}>Aucune notification pour le moment</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
