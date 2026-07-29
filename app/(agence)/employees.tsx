import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, View, Text, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { api } from '@/lib/api';
import { Card, Avatar, Ic, Chips, DetailHeader, Badge, initials } from '@/components/agence/ui';

interface Employee {
  id: number;
  user: number;
  user_nom: string;
  user_email?: string;
  specialite: string;
  date_embauche?: string;
  statut?: string;
  is_available?: boolean;
}

const SPECIALITE_LABEL: Record<string, string> = {
  technique:     'Technique',
  menage:        'Ménage',
  jardinage:     'Jardinage',
  peinture:      'Peinture',
  plomberie:     'Plomberie',
  electricite:   'Électricité',
  serrurerie:    'Serrurerie',
  climatisation: 'Climatisation',
  polyvalent:    'Polyvalent',
};

const SPECIALITE_ICON: Record<string, string> = {
  plomberie:     'drop',
  electricite:   'bolt',
  serrurerie:    'key',
  climatisation: 'building',
  peinture:      'paint',
};

const TECH_SPECIALITES = ['plomberie', 'electricite', 'serrurerie', 'climatisation', 'menuiserie', 'technique'];
const STAFF_SPECIALITES = ['menage', 'jardinage', 'peinture', 'polyvalent'];

const FILTERS = ['Tous', 'Techniciens', 'Staff'];

export default function EmployeesScreen() {
  const { theme: t } = useAgencyTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');

  const { data, isLoading } = useQuery<{ results: Employee[] } | Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => { const { data } = await api.get('/employees/'); return data; },
  });

  const all: Employee[] = Array.isArray(data) ? data : (data?.results ?? []);

  const employees = all.filter(e => {
    const name = (e.user_nom ?? '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase())
      || (e.user_email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous'
      || (filter === 'Techniciens' && TECH_SPECIALITES.includes(e.specialite))
      || (filter === 'Staff'       && STAFF_SPECIALITES.includes(e.specialite));
    return matchSearch && matchFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <DetailHeader t={t} title="Employés" onBack={() => router.back()}
        right={
          <TouchableOpacity activeOpacity={0.8}
            onPress={() => router.push('/(agence)/employee-new')}
            style={{ width: 38, height: 38, borderRadius: 12,
              backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Ic name="plus" size={20} color="#fff" sw={2.4} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={employees}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={
          <View style={{ padding: 20, paddingTop: 6, gap: 14 }}>
            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10,
              height: 46, backgroundColor: t.surface, borderWidth: 1,
              borderColor: t.border, borderRadius: 13, paddingHorizontal: 14,
              ...(t.shadowSoft as any) }}>
              <Ic name="search" size={18} color={t.text3} sw={1.9} />
              <TextInput
                style={{ flex: 1, fontSize: 14.5, color: t.text }}
                placeholder="Rechercher un employé…"
                placeholderTextColor={t.text3}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              <Chips t={t} items={FILTERS} active={filter} onSelect={setFilter} />
            </ScrollView>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.border }} />}
        renderItem={({ item }) => {
          const icon = SPECIALITE_ICON[item.specialite] ?? 'user';
          const label = SPECIALITE_LABEL[item.specialite] ?? item.specialite;
          return (
            <TouchableOpacity activeOpacity={0.75}
              onPress={() => router.push(`/(agence)/employee/${item.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center',
                gap: 13, paddingVertical: 13 }}>
                <Avatar t={t} initials={initials(item.user_nom ?? '—')} size={46} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14.5, color: t.text }}>
                    {item.user_nom ?? '—'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center',
                    gap: 5, marginTop: 2 }}>
                    <Ic name={icon} size={13} color={t.text3} sw={1.9} />
                    <Text style={{ fontSize: 12.5, color: t.text2 }}>{label}</Text>
                  </View>
                </View>
                <Ic name="chevR" size={18} color={t.text3} sw={2} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <ActivityIndicator color={t.accent} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36,
                backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ic name="user" size={32} color={t.accentText} sw={1.6} />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 16, color: t.text }}>
                Aucun employé
              </Text>
              <Text style={{ fontSize: 13.5, color: t.text2, textAlign: 'center', maxWidth: 240 }}>
                {search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre premier employé avec le bouton +'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}
