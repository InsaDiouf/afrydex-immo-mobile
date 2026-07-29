import { Tabs } from 'expo-router';
import { useAgencyTheme } from '@/ctx/agencyTheme';
import { Ic } from '@/components/agence/ui';

export default function EmployeTabsLayout() {
  const { theme: t } = useAgencyTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accentText,
        tabBarInactiveTintColor: t.text3,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 12,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau',
          tabBarIcon: ({ color, size }) => <Ic name="home" size={size} color={color} sw={1.8} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tâches',
          tabBarIcon: ({ color, size }) => <Ic name="wrench" size={size} color={color} sw={1.8} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: 'Achats',
          tabBarIcon: ({ color, size }) => <Ic name="cart" size={size} color={color} sw={1.8} />,
        }}
      />
    </Tabs>
  );
}
