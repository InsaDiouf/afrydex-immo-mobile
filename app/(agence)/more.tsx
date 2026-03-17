import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreditCard, Users, FileBarChart2, Settings, ShoppingCart, LogOut, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/ctx/auth';

export default function MoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const sections = [
    {
      title: 'Gestion',
      items: [
        { label: 'Paiements', icon: CreditCard, color: '#16a34a', route: '/(agence)/payments' },
        { label: 'Employés', icon: Users, color: '#7c3aed', route: '/(agence)/employees' },
        { label: 'Demandes d\'achat', icon: ShoppingCart, color: '#d97706', route: '/(agence)/purchase-requests' },
      ],
    },
    {
      title: 'Compte',
      items: [
        { label: 'Paramètres', icon: Settings, color: '#6b7280', route: '/(agence)/settings' },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">Plus</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{user?.email}</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {sections.map((section) => (
          <View key={section.title} className="mb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </Text>
            <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {section.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                    activeOpacity={0.7}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View
                      className="w-8 h-8 rounded-xl items-center justify-center"
                      style={{ backgroundColor: item.color + '15' }}
                    >
                      <Icon size={16} color={item.color} />
                    </View>
                    <Text className="flex-1 text-sm font-semibold text-gray-800">{item.label}</Text>
                    <ChevronRight size={16} color="#d1d5db" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Déconnexion */}
        <TouchableOpacity
          className="bg-red-50 rounded-2xl border border-red-100 flex-row items-center gap-3 px-4 py-3.5 mt-2"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <View className="w-8 h-8 rounded-xl bg-red-100 items-center justify-center">
            <LogOut size={16} color="#dc2626" />
          </View>
          <Text className="flex-1 text-sm font-semibold text-red-600">Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
