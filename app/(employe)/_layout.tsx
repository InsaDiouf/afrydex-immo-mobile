import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, ShoppingCart } from 'lucide-react-native';

export default function EmployeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tableau de bord', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tâches', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size - 2} /> }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="purchases" options={{ title: 'Achats', tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size - 2} /> }} />
    </Tabs>
  );
}
