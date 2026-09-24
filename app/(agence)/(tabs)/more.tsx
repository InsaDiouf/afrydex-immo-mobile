import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/ctx/auth';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { SUPPORT_EMAIL, openSupport } from '@/lib/legal';
import { Card, Avatar, Badge, Tile, Ic, TabHeader, initials } from '@/components/agence/ui';

interface BadgeCounts {
  impayés?: number;
  total_demandes_achat_en_attente?: number;
}

function MenuItem({ t, icon, tone, title, sub, badge, danger, last, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.border }}>
      <Tile t={t} name={icon} tone={tone} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '700', fontSize: 14.5, color: danger ? t.dangerText : t.text }}>{title}</Text>
        {sub && <Text style={{ fontSize: 12, color: t.text2, marginTop: 1 }}>{sub}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={{ backgroundColor: t.accent, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, minWidth: 22, alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 12, color: '#fff' }}>{badge}</Text>
        </View>
      )}
      {!danger && <Ic name="chevR" size={18} color={t.text3} sw={2} />}
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme: t } = useAgencyTheme();

  const { data } = useQuery<BadgeCounts>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/');
      return data;
    },
  });

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Utilisateur';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TabHeader t={t} title="Plus" kicker="Gestion & compte" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* User card */}
        <Card t={t} pad={16} style={{ marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar t={t} initials={initials(name)} size={52} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: '700', fontSize: 17, color: t.text, letterSpacing: -0.2 }}>{name}</Text>
              <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 2 }} numberOfLines={1}>{user?.email}</Text>
            </View>
            <Badge t={t} tone="info">{user?.user_type === 'manager' ? 'Manager' : user?.user_type === 'admin' ? 'Admin' : 'Comptable'}</Badge>
          </View>
        </Card>

        {/* Gestion */}
        <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, marginTop: 22, marginBottom: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>Gestion</Text>
        <Card t={t} pad={14}>
          <MenuItem t={t} icon="coins"  tone="accent"   title="Paiements"         sub="Loyers encaissés & impayés"   badge={data?.impayés}                        onPress={() => router.push('/(agence)/payments')} />
          <MenuItem t={t} icon="cart"   tone="warn"     title="Demandes d'achat"  sub="Matériaux & fournitures"       badge={data?.total_demandes_achat_en_attente} onPress={() => router.push('/(agence)/purchase-requests')} />
          <MenuItem t={t} icon="coins"  tone="danger"   title="Dépenses"          sub="Totaux par bâtiment / occupant"          onPress={() => router.push('/(agence)/expenses')} />
          <MenuItem t={t} icon="users"  tone="info"     title="Employés"          sub="Techniciens & staff"                     onPress={() => router.push('/(agence)/employees')} last />
        </Card>

        {/* Compte */}
        <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, marginTop: 22, marginBottom: 9, letterSpacing: 0.5, textTransform: 'uppercase' }}>Compte</Text>
        <Card t={t} pad={14}>
          <MenuItem t={t} icon="building" tone="neutral" title="Profil de l'agence" sub="Paramètres de l'organisation"  onPress={() => router.push('/(agence)/agency-profile')} />
          <MenuItem t={t} icon="settings" tone="neutral" title="Paramètres"         sub="Mot de passe & informations légales" onPress={() => router.push('/(agence)/settings')} />
          <MenuItem t={t} icon="shield"   tone="neutral" title="Aide & support"     sub={SUPPORT_EMAIL}                       onPress={openSupport} last />
        </Card>

        {/* Déconnexion */}
        <Card t={t} pad={14} style={{ marginTop: 14 }}>
          <MenuItem t={t} icon="logout" tone="danger" title="Déconnexion" danger last onPress={signOut} />
        </Card>

        <Text style={{ textAlign: 'center', fontSize: 12, color: t.text3, marginTop: 18 }}>AfrydexImmo · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
