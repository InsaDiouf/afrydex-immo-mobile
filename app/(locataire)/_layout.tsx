import { Tabs } from 'expo-router';
import { LayoutDashboard, FileText, CreditCard, Wrench, FolderOpen } from 'lucide-react-native';

export default function LocataireLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
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
      <Tabs.Screen name="index" options={{ title: 'Mon espace', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} /> }} />
      <Tabs.Screen name="contract" options={{ title: 'Contrat', tabBarIcon: ({ color, size }) => <FileText color={color} size={size - 2} /> }} />
      <Tabs.Screen name="rent" options={{ title: 'Loyers', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Signalement', tabBarIcon: ({ color, size }) => <Wrench color={color} size={size - 2} /> }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents', tabBarIcon: ({ color, size }) => <FolderOpen color={color} size={size - 2} /> }} />
      <Tabs.Screen name="contract-detail" options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
