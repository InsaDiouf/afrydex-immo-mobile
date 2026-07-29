import { Alert, Linking, Platform } from 'react-native';

/**
 * Liens légaux et canal de support.
 *
 * Les deux stores exigent une politique de confidentialité publiquement
 * accessible ; Google Play exige en plus une page de demande de suppression
 * des données. Ces pages sont servies par le backend (voir apps/core/urls.py).
 */
// Les pages légales sont servies par le backend Django (afrydex_immo/urls.py),
// pas par le frontend Vercel : elles doivent pointer sur le domaine de l'API.
// À basculer sur https://afrydeximmo.com si ces pages y sont un jour reprises.
export const SITE_URL = 'https://afrydex.up.railway.app';
export const PRIVACY_URL = `${SITE_URL}/privacy/`;
export const TERMS_URL = `${SITE_URL}/terms/`;
export const DATA_DELETION_URL = `${SITE_URL}/data-deletion/`;
export const SUPPORT_EMAIL = 'support@afrydeximmo.com';

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Lien indisponible', `Impossible d'ouvrir ${url}`);
  }
}

/**
 * Ouvre l'itinéraire dans l'app de cartographie du système.
 * `maps://` est spécifique à iOS et échoue silencieusement sur Android,
 * qui attend le schéma `geo:`.
 */
export function openDirections(latitude: number, longitude: number) {
  const url = Platform.OS === 'ios'
    ? `maps://app?daddr=${latitude},${longitude}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
  return Linking.openURL(url).catch(() =>
    openUrl(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  );
}

export const openPrivacy = () => openUrl(PRIVACY_URL);
export const openTerms = () => openUrl(TERMS_URL);
export const openDataDeletion = () => openUrl(DATA_DELETION_URL);
export const openSupport = () =>
  openUrl(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Support Afrydex Immo')}`);
