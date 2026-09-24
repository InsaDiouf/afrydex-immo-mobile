import { Tabs } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { Ic } from '@/components/agence/ui';

export default function AgenceTabsLayout() {
  const { theme: t } = useAgencyTheme();

  const tab = (id: string, label: string, icon: string) => (
    <Tabs.Screen
      key={id}
      name={id}
      options={{
        title: label,
        tabBarIcon: ({ focused }) => (
          <Ic name={icon} size={22} color={focused ? t.accentText : t.text3} sw={focused ? 2 : 1.7} />
        ),
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accentText,
        tabBarInactiveTintColor: t.text3,
        tabBarStyle: {
          backgroundColor: t.dark ? 'rgba(11,14,16,0.97)' : 'rgba(255,255,255,0.97)',
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 22,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: -0.1,
          marginTop: 2,
        },
        tabBarIconStyle: { marginTop: 0 },
      }}
    >
      {tab('index',       'Tableau',     'home')}
      {tab('properties',  'Biens',       'building')}
      {tab('contracts',   'Contrats',    'contract')}
      {tab('maintenance', 'Maintenance', 'wrench')}
      {tab('more',        'Plus',        'dots')}
    </Tabs>
  );
}
