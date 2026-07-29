# Déploiement — Afrydex Immo Mobile

Application Expo (SDK 55, Expo Router) pour iOS et Android.
Quatre portails selon le rôle : agence, employé, locataire, bailleur.

---

## 1. Identité de l'application

| | |
|---|---|
| Nom affiché | Afrydex Immo |
| Bundle ID iOS | `com.afrydex.immo` |
| Package Android | `com.afrydex.immo` |
| Version | 1.0.0 |
| Orientation | Portrait uniquement |
| iPad | Non supporté (`ios.supportsTablet: false`) |

> Le bundle identifier est **immuable** après la première publication. Ne pas le modifier.

---

## 2. Backend

L'API est déployée sur Railway et déjà opérationnelle :

```
https://afrydex.up.railway.app/api/v1
```

Vérification rapide :
```bash
curl https://afrydex.up.railway.app/health/
# {"status": "healthy", "database": "connected", "debug": false}
```

L'URL est injectée dans les builds via `EXPO_PUBLIC_API_URL`, défini dans le bloc `env` de
chaque profil de [eas.json](eas.json). En développement local, `.env.local` (non versionné)
prend le dessus.

> `lib/api.ts` retombe sur l'URL de production si la variable est absente : un build EAS ne
> reçoit jamais `.env.local`, un fallback `localhost` rendrait l'app publiée inutilisable.

---

## 3. Prérequis

```bash
npm install -g eas-cli
eas login
eas init          # génère extra.eas.projectId dans app.json
```

Comptes développeur nécessaires (à créer en amont, la validation prend plusieurs jours) :
- Apple Developer Program — 99 $/an
- Google Play Console — 25 $ une fois

---

## 4. Builds

```bash
npm run typecheck              # doit renvoyer 0 erreur
npm run doctor                 # expo-doctor

npm run build:preview          # APK interne (Android), testable hors réseau local
npm run build:production       # AAB + IPA pour les stores
npm run submit:production      # envoi vers TestFlight / piste interne Play
```

Les profils `preview` et `production` ont `autoIncrement: true` et `cli.appVersionSource: "remote"` :
les numéros de build sont gérés par EAS, il n'y a rien à incrémenter à la main.

> EAS build **depuis le commit git**. Tout fichier non commité est absent du build.
> Vérifier `git status` avant de lancer une compilation.

---

## 5. Comptes de démonstration (App Review)

Vérifiés fonctionnels sur la production.

| Portail | Identifiant | Mot de passe |
|---|---|---|
| Agence (admin) | `demo@afrydex.com` | `Demo2026Afrydex!` |
| Employé | `cheikh.mbaye@demo-afrydex.sn` | `Demo2026Employe!` |

Régénérer le jeu de données de démo :
```bash
python manage.py create_demo_agency
```

> **À faire avant soumission** : la commande ne crée pas de compte **locataire** ni **bailleur**
> (ces tiers n'ont pas de compte utilisateur associé dans le jeu de démo). Les reviewers ne
> pourraient donc pas voir 2 des 4 portails. Créer deux comptes de démo supplémentaires
> (`user_type='tenant'` et `user_type='landlord'`) rattachés à des tiers de l'agence démo,
> et les ajouter à ce tableau.

---

## 6. Notes pour l'App Review

À copier dans le champ « Notes » d'App Store Connect :

> Afrydex Immo est un outil **professionnel B2B** de gestion immobilière destiné aux agences
> d'Afrique de l'Ouest, à leurs employés de terrain, aux propriétaires bailleurs et aux locataires.
>
> **Pas de création de compte dans l'application.** Les comptes sont provisionnés par l'agence
> immobilière pour ses collaborateurs et ses clients ; il n'existe aucun parcours d'inscription
> public. À ce titre, l'application relève de l'exemption prévue à la directive 5.1.1(v) pour les
> applications d'entreprise, et n'embarque pas de fonction de suppression de compte in-app. Une
> procédure de suppression est publiée sur https://afrydex.up.railway.app/data-deletion/
>
> **Aucun achat intégré ni paiement.** Les écrans « Paiements » et « Loyers » sont en lecture seule
> et restituent des règlements saisis par l'agence. Les loyers sont réglés hors application.
>
> **Permissions.** L'appareil photo et la photothèque servent uniquement à documenter les
> interventions de maintenance depuis le chantier (fiche « Maintenance » → « Ajouter une photo »).
>
> Identifiants de test fournis ci-dessus.

---

## 7. Liens légaux

| Page | URL |
|---|---|
| Politique de confidentialité | https://afrydex.up.railway.app/privacy/ |
| Conditions d'utilisation | https://afrydex.up.railway.app/terms/ |
| Suppression des données | https://afrydex.up.railway.app/data-deletion/ |

Servies par Django ([afrydex_immo/urls.py](../afrydexImmoBackend/afrydex_immo/urls.py)), accessibles
sans authentification. Ces trois URL sont déclarées dans `lib/legal.ts` et accessibles depuis les
écrans Paramètres des quatre portails.

> Si un domaine `api.afrydeximmo.com` est configuré plus tard, mettre à jour `SITE_URL` dans
> [lib/legal.ts](lib/legal.ts) **et** l'URL de confidentialité dans App Store Connect / Play Console.

---

## 8. Déclarations de confidentialité (App Privacy / Data Safety)

Données collectées, toutes **liées à l'identité de l'utilisateur** et **jamais utilisées à des
fins de suivi publicitaire** :

| Catégorie | Détail | Finalité |
|---|---|---|
| Coordonnées | Nom, e-mail, téléphone, adresse | Fonctionnement de l'app |
| Contenu utilisateur | Photos de travaux, signature manuscrite | Fonctionnement de l'app |
| Identifiants | Identifiant de compte | Fonctionnement de l'app |
| Données financières | Loyers, factures, paiements | Fonctionnement de l'app |

Google Play — formulaire Data Safety : déclarer le chiffrement en transit (HTTPS) et renseigner
l'URL de demande de suppression des données (§7).

---

## 9. Checklist avant soumission

- [ ] `npm run typecheck` → 0 erreur
- [ ] `git status` propre
- [ ] `eas init` exécuté (`extra.eas.projectId` présent dans app.json)
- [ ] Build `preview` installé sur un appareil physique **hors du réseau du développeur** (4G)
- [ ] Connexion testée sur les 4 portails
- [ ] Mode avion → messages d'erreur clairs, aucun écran blanc
- [ ] Upload de photo de travaux (appareil photo **et** galerie)
- [ ] Signature manuscrite testée côté **locataire et bailleur**
- [ ] Comptes de démo locataire et bailleur créés (§5)
- [ ] Captures d'écran iPhone 6.7" et 6.5"
- [ ] Icône Play Store 512×512 et feature graphic 1024×500
- [ ] URL de politique de confidentialité renseignée dans les deux consoles
