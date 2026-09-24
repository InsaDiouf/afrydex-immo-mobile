import { useQuery } from '@tanstack/react-query';
import { ScrollView, View, Text, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Badge, Btn, KV, Row, Ic, DetailHeader, PhotoPlaceholder, money } from '@/components/agence/ui';

interface Appartement {
  id: number;
  nom: string;
  etage?: string;
  pieces?: number;
  surface?: number;
  statut: string;
  loyer_base?: number;
  charges?: number;
  residence_nom?: string;
  proprietaire_nom?: string;
  numero_contrat?: string;
  locataire_nom?: string;
  locataire_phone?: string;
  locataire_debut?: string;
  photo_url?: string | null;
}

export default function AppartDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: t } = useAgencyTheme();
  const router = useRouter();

  const { data: apt, isLoading } = useQuery<Appartement>({
    queryKey: ['appartement', id],
    queryFn: async () => { const { data } = await api.get(`/appartements/${id}/`); return data; },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <DetailHeader t={t} title="Appartement" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.accent} />
        </View>
      </View>
    );
  }

  const statusMap: Record<string, 'success' | 'warn' | 'info'> = { occupé: 'success', vacant: 'warn', travaux: 'info' };
  const tone = statusMap[apt?.statut?.toLowerCase() ?? ''] ?? ('neutral' as any);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title={`Appartement ${apt?.nom ?? ''}`} onBack={() => router.back()}
        right={<Ic name="settings" size={20} color={t.text} sw={1.8} />} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {apt?.photo_url
          ? <Image source={{ uri: apt.photo_url }} style={{ width: '100%', height: 150, borderRadius: 14 }} resizeMode="cover" />
          : <PhotoPlaceholder t={t} h={150} />}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14 }}>
          <View>
            <Text style={{ fontWeight: '700', fontSize: 21, color: t.text, letterSpacing: -0.4 }}>Appartement {apt?.nom}</Text>
            <Text style={{ fontSize: 13.5, color: t.text2, marginTop: 4 }}>
              {[apt?.residence_nom, apt?.etage].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Badge t={t} tone={tone} dot={tone === 'success'}>
            {apt?.statut?.charAt(0).toUpperCase()}{apt?.statut?.slice(1)}
          </Badge>
        </View>

        {/* Feature cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          {[
            ['bed',      apt?.pieces ? `${apt.pieces} pièces` : '—'],
            ['building', apt?.surface ? `${apt.surface} m²` : '—'],
            ['coins',    apt?.loyer_base ? `${Math.round(apt.loyer_base / 1000)}k/mois` : '—'],
          ].map(([icon, val]) => (
            <Card key={icon} t={t} pad={13} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ marginBottom: 7 }}><Ic name={icon} size={20} color={t.accentText} sw={1.9} /></View>
              <Text style={{ fontWeight: '700', fontSize: 13.5, color: t.text }}>{val}</Text>
            </Card>
          ))}
        </View>

        {/* Locataire */}
        {apt?.locataire_nom && (
          <>
            <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Locataire actuel</Text>
            <Card t={t} pad={14}>
              <Row t={t} title={apt.locataire_nom}
                sub={apt.locataire_debut ? `Bail actif · depuis ${new Date(apt.locataire_debut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : 'Bail actif'}
                right={
                  apt.locataire_phone ? (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(`tel:${apt.locataire_phone}`)}
                      style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ic name="phone" size={17} color={t.accentText} sw={1.9} />
                    </TouchableOpacity>
                  ) : null
                }
              />
            </Card>
          </>
        )}

        {/* Détails financiers */}
        <Text style={{ fontWeight: '700', fontSize: 15, color: t.text, marginTop: 22, marginBottom: 11, letterSpacing: -0.2 }}>Détails</Text>
        <Card t={t}>
          {apt?.loyer_base   && <KV t={t} k="Loyer mensuel" v={money(apt.loyer_base)} accent />}
          {apt?.charges      && <KV t={t} k="Charges"       v={money(apt.charges)} />}
          {apt?.proprietaire_nom && <KV t={t} k="Propriétaire" v={apt.proprietaire_nom} />}
          {apt?.numero_contrat   && <KV t={t} k="Contrat"    v={apt.numero_contrat} last />}
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
