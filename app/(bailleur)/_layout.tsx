import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, FileText, CreditCard, FolderOpen } from 'lucide-react-native';

export default function BailleurLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7c3aed',
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
      <Tabs.Screen name="properties" options={{ title: 'Mes biens', tabBarIcon: ({ color, size }) => <Building2 color={color} size={size - 2} /> }} />
      <Tabs.Screen name="contracts" options={{ title: 'Contrats', tabBarIcon: ({ color, size }) => <FileText color={color} size={size - 2} /> }} />
      <Tabs.Screen name="payments" options={{ title: 'Revenus', tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} /> }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents', tabBarIcon: ({ color, size }) => <FolderOpen color={color} size={size - 2} /> }} />

      {/* Écrans cachés de la barre d'onglets */}
      <Tabs.Screen
        name="residence-detail"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="appartement-detail"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
