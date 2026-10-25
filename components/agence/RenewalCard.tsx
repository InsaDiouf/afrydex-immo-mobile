import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, Btn, Ic } from '@/components/agence/ui';

// Fin de bail (GET /contracts/{id}/ → renouvellement) : l'admin confirme si le bail sera renouvelé
export interface Renouvellement {
  a_confirmer: boolean;
  echu: boolean;
  jours_restants: number;
  date_fin: string;
  nouvelle_date_fin: string;
  duree_mois: number;
  is_renouvelable: boolean;
  decision: '' | 'renouveler' | 'arreter';
  decision_par: string | null;
}

const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('fr-FR');

export default function RenewalCard({ t, contractId, r, canDecide }: {
  t: any; contractId: string | number; r?: Renouvellement | null; canDecide: boolean;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  if (!r || !r.a_confirmer) return null;

  const envoyer = async (decision: '' | 'renouveler' | 'arreter') => {
    setSaving(true);
    try {
      const { data } = await api.post(`/contracts/${contractId}/decision-renouvellement/`, { decision });
      queryClient.setQueryData(['contract', String(contractId)], data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err: any) {
      const d = err?.response?.data;
      Alert.alert('Décision non enregistrée', (d && (d.error || Object.values(d).flat().find((v) => typeof v === 'string'))) || 'Réessaie.');
    } finally {
      setSaving(false);
    }
  };
  const arreter = () => Alert.alert('Ne pas renouveler ?', `Le bail s'arrêtera le ${fmt(r.date_fin)} et le logement sera libéré.`, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Confirmer', style: 'destructive', onPress: () => envoyer('arreter') },
  ]);

  const quand = r.echu ? `a pris fin le ${fmt(r.date_fin)}` : `se termine le ${fmt(r.date_fin)} (dans ${r.jours_restants} j)`;
  let titre = 'Ce bail sera-t-il renouvelé ?';
  let texte = `Le bail ${quand}.`;
  let couleur = t.warn ?? '#d97706';
  if (r.decision === 'renouveler') { titre = 'Renouvellement confirmé'; texte += ` Il sera prolongé jusqu'au ${fmt(r.nouvelle_date_fin)}.`; couleur = t.success ?? '#16a34a'; }
  else if (r.decision === 'arreter') { titre = 'Bail non renouvelé'; texte += ' Le logement sera libéré à cette date.'; couleur = t.text2; }
  else if (!r.is_renouvelable) { titre = 'Fin de bail'; texte += " Il n'est pas renouvelable."; couleur = t.text2; }
  else if (r.echu) { titre = 'Bail échu sans décision'; texte += ' Les loyers suivants ne sont pas générés.'; couleur = t.danger ?? '#dc2626'; }

  return (
    <Card t={t} style={{ marginTop: 14, borderColor: couleur, borderWidth: 1.5 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <Ic name="calendar" size={20} color={couleur} sw={2} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: t.text }}>{titre}</Text>
          <Text style={{ fontSize: 13, color: t.text2, marginTop: 3, lineHeight: 18 }}>{texte}</Text>
          {!canDecide && !r.decision && (
            <Text style={{ fontSize: 12, color: t.text3, marginTop: 4 }}>Seul l'administrateur peut confirmer.</Text>
          )}
        </View>
      </View>
      {canDecide && (
        <View style={{ gap: 8, marginTop: 12 }}>
          {r.decision ? (
            <Btn t={t} kind="ghost" full disabled={saving} onPress={() => envoyer('')}>Modifier la décision</Btn>
          ) : (
            <>
              <Btn t={t} full disabled={saving} onPress={() => envoyer('renouveler')}>
                {r.is_renouvelable ? `Renouveler jusqu'au ${fmt(r.nouvelle_date_fin)}` : 'Le renouveler quand même'}
              </Btn>
              {r.is_renouvelable && <Btn t={t} kind="ghost" full disabled={saving} onPress={arreter}>Ne pas renouveler</Btn>}
            </>
          )}
        </View>
      )}
    </Card>
  );
}
