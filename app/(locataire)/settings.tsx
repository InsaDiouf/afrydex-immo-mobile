import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, User, Key, ChevronRight, LogOut,
  Shield, FileText, Trash2, LifeBuoy,
} from 'lucide-react-native';
import { useAuth } from '@/ctx/auth';
import { openPrivacy, openTerms, openDataDeletion, openSupport } from '@/lib/legal';

export default function LocataireSettings() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const rows = [
    { label: 'Changer le mot de passe',      icon: Key,      onPress: () => router.push('/(auth)/change-password') },
    { label: 'Politique de confidentialité', icon: Shield,   onPress: openPrivacy },
    { label: "Conditions d'utilisation",     icon: FileText, onPress: openTerms },
    { label: 'Suppression des données',      icon: Trash2,   onPress: openDataDeletion },
    { label: 'Aide & support',               icon: LifeBuoy, onPress: openSupport },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-xl bg-gray-100" activeOpacity={0.7}>
          <ArrowLeft size={18} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-gray-900">Mon compte</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Identité */}
        <View className="bg-white rounded-2xl border border-gray-100 p-4 flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-2xl bg-emerald-100 items-center justify-center">
            <User size={18} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900">
              {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Locataire'}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">{user?.email}</Text>
          </View>
        </View>

        {/* Compte & informations légales */}
        <View className="bg-white rounded-2xl border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
            Compte
          </Text>
          {rows.map((item, i) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}
                activeOpacity={0.7}
                onPress={item.onPress}
              >
                <View className="w-8 h-8 rounded-xl bg-gray-100 items-center justify-center">
                  <Icon size={15} color="#6b7280" />
                </View>
                <Text className="flex-1 text-sm font-semibold text-gray-800">{item.label}</Text>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          className="bg-red-50 rounded-2xl border border-red-100 flex-row items-center gap-3 px-4 py-3.5"
          onPress={signOut}
          activeOpacity={0.7}
        >
          <View className="w-8 h-8 rounded-xl bg-red-100 items-center justify-center">
            <LogOut size={15} color="#dc2626" />
          </View>
          <Text className="flex-1 text-sm font-semibold text-red-600">Se déconnecter</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-300 pb-4">Afrydex Immo v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
