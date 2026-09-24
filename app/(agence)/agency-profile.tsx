import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, KV, DetailHeader, Tile, Avatar, Badge, Divider, initials } from '@/components/agence/ui';

interface OrgConfig {
  id: number;
  slug: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currencySymbol?: string;
  currencyCode?: string;
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  setupCompleted?: boolean;
}

export default function AgencyProfileScreen() {
  const router = useRouter();
  const { theme: t } = useAgencyTheme();

  const { data: org, isLoading } = useQuery<OrgConfig>({
    queryKey: ['org-config'],
    queryFn: async () => {
      const { data } = await api.get('/organizations/config/');
      return data;
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Profil de l'agence" onBack={() => router.back()} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity card */}
          <Card t={t} pad={18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Avatar t={t} initials={initials(org?.name ?? '?')} size={60} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: '800', fontSize: 20, color: t.text, letterSpacing: -0.4 }} numberOfLines={2}>
                  {org?.name ?? '—'}
                </Text>
                {org?.slug && (
                  <Text style={{ fontSize: 12.5, color: t.text3, marginTop: 3 }}>@{org.slug}</Text>
                )}
              </View>
              {org?.setupCompleted && (
                <Badge t={t} tone="success">Configuré</Badge>
              )}
            </View>

            {/* Color swatches */}
            {(org?.primaryColor || org?.secondaryColor) && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                {org?.primaryColor && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: org.primaryColor, borderWidth: 1, borderColor: t.border }} />
                    <Text style={{ fontSize: 12, color: t.text2, fontWeight: '600' }}>Primaire</Text>
                  </View>
                )}
                {org?.secondaryColor && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginLeft: 8 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: org.secondaryColor, borderWidth: 1, borderColor: t.border }} />
                    <Text style={{ fontSize: 12, color: t.text2, fontWeight: '600' }}>Secondaire</Text>
                  </View>
                )}
              </View>
            )}
          </Card>

          {/* Contact */}
          {(org?.email || org?.phone || org?.address || org?.website) && (
            <>
              <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 }}>
                Contact
              </Text>
              <Card t={t} pad={14}>
                {[
                  { icon: 'mail',    label: 'Email',    value: org?.email },
                  { icon: 'phone',   label: 'Téléphone', value: org?.phone },
                  { icon: 'mapPin',  label: 'Adresse',  value: org?.address },
                  { icon: 'globe',   label: 'Site web', value: org?.website },
                ].filter(r => r.value).map((r, i, arr) => (
                  <View key={r.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border }}>
                    <Tile t={t} name={r.icon} tone="neutral" size={34} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 11.5, color: t.text3, marginBottom: 2 }}>{r.label}</Text>
                      <Text style={{ fontSize: 13.5, color: t.text, fontWeight: '600' }} numberOfLines={2}>{r.value}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          {/* Régional */}
          {(org?.currencySymbol || org?.locale || org?.timezone || org?.dateFormat) && (
            <>
              <Text style={{ fontWeight: '700', fontSize: 13, color: t.text2, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 4 }}>
                Configuration régionale
              </Text>
              <Card t={t} pad={14}>
                {org?.currencySymbol && (
                  <KV t={t} k="Devise" v={`${org.currencySymbol}${org.currencyCode ? ` (${org.currencyCode})` : ''}`} />
                )}
                {org?.locale && (
                  <KV t={t} k="Locale" v={org.locale} />
                )}
                {org?.timezone && (
                  <KV t={t} k="Fuseau horaire" v={org.timezone} />
                )}
                {org?.dateFormat && (
                  <KV t={t} k="Format de date" v={org.dateFormat} last />
                )}
              </Card>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}
