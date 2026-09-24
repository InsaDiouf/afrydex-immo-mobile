import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { openPrivacy, openTerms, openDataDeletion, openSupport } from '@/lib/legal';
import { Card, DetailHeader, Tile, Avatar, Ic, initials } from '@/components/agence/ui';

export default function EmployeSettings() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme: t } = useAgencyTheme();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Employé';

  const rows = [
    { icon: 'lock',     title: 'Changer le mot de passe',      onPress: () => router.push('/(auth)/change-password') },
    { icon: 'shield',   title: 'Politique de confidentialité', onPress: openPrivacy },
    { icon: 'contract', title: "Conditions d'utilisation",     onPress: openTerms },
    { icon: 'alert',    title: 'Suppression des données',      onPress: openDataDeletion },
    { icon: 'user',     title: 'Aide & support',               onPress: openSupport },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Mon compte" onBack={() => router.back()} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Identité */}
        <Card t={t} pad={14} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <Avatar t={t} initials={initials(fullName)} size={46} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }} numberOfLines={1}>{fullName}</Text>
            <Text style={{ fontSize: 12.5, color: t.text2, marginTop: 1 }} numberOfLines={1}>{user?.email}</Text>
          </View>
        </Card>

        {/* Compte & informations légales */}
        <Card t={t} pad={14} style={{ marginTop: 14 }}>
          {rows.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.7}
              onPress={item.onPress}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 13,
                borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: t.border,
              }}
            >
              <Tile t={t} name={item.icon} tone="neutral" size={40} />
              <Text style={{ flex: 1, fontWeight: '700', fontSize: 14.5, color: t.text }}>{item.title}</Text>
              <Ic name="chevR" size={18} color={t.text3} sw={2} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Déconnexion */}
        <Card t={t} pad={14} style={{ marginTop: 14 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={signOut}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 4 }}
          >
            <Tile t={t} name="logout" tone="danger" size={40} />
            <Text style={{ flex: 1, fontWeight: '700', fontSize: 14.5, color: t.danger }}>Déconnexion</Text>
          </TouchableOpacity>
        </Card>

        <Text style={{ textAlign: 'center', fontSize: 12, color: t.text3, marginTop: 18 }}>
          AfrydexImmo · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
