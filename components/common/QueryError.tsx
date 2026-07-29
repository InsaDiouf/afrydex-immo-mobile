import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

/**
 * État d'erreur pour les écrans stylés en NativeWind (portails locataire et
 * bailleur). Équivalent de `ErrorState` du design system agence, qui lui
 * dépend du thème dynamique de l'organisation.
 */
export function QueryError({
  onRetry,
  message,
  accent = '#16a34a',
}: {
  onRetry?: () => void;
  message?: string;
  accent?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12 gap-3">
      <View className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center">
        <AlertTriangle size={24} color="#dc2626" />
      </View>
      <Text className="text-base font-bold text-gray-900 text-center">Chargement impossible</Text>
      <Text className="text-sm text-gray-500 text-center leading-5">
        {message ?? 'Vérifie ta connexion internet, puis réessaie.'}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          className="mt-1 rounded-xl px-6 py-3"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-sm font-bold text-white">Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
