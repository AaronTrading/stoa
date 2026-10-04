# STOA

Site statique multi-pages en français, sans framework ni étape de build.

## Ouvrir le projet

Ouvrir `dist/index.html` directement, ou lancer `node serve.cjs` puis visiter http://127.0.0.1:4173.

- `dist/index.html` : landing, philosophie, programme, offres et FAQ.
- `dist/academie.html` : programme filtrable et progression.
- `dist/module.html` : lecteur des modules, exercices et notes personnelles.
- `dist/profil.html` : profil membre, nom et photo de profil Supabase.
- `dist/communaute.html` : salons de discussion en temps réel, réactions et présence.
- `dist/coaching-onboarding.html` : questionnaire adaptatif et reprenable du Coaching Privé.
- `dist/coaching.html` : espace privé client, plan, objectifs, habitudes, check-ins et messages.
- `dist/coaching-coach.html` : portefeuille et dossier longitudinal réservé aux coachs autorisés.
- `dist/rendez-vous.html` : réservation gratuite des appels Coaching publiés par les coachs.
- `dist/styles.css` : styles partagés, palette et responsive.
- `dist/app.js` : contenu, interactions et stockage local.

Les fichiers du dossier `dist` sont les sources du site, directement modifiables et hébergeables. Aucun générateur ni dépendance JavaScript.

## Backend Supabase

Les migrations SQL sont dans `supabase/migrations/`. L’Académie courante repose sur cinq piliers — Nourrir, Corps, Protéger, Vivre et Se construire — et toutes les tables applicatives utilisent RLS. Le seed historique sert uniquement au développement et ne constitue plus le catalogue de production.

Le client navigateur est dans `lib/supabase.js`, avec les helpers d’authentification dans `lib/auth.js` et le schéma JSDoc dans `lib/database.js`. Comme le site reste sans build, le client officiel `@supabase/supabase-js` est chargé comme module ESM. Les valeurs publiques sont injectées par `window.__STOA_ENV__`; `dist/env.example.js` montre le format attendu.

L’interface d’authentification dans `dist/auth.js` permet la connexion et l’inscription par email et mot de passe, le magic link, la récupération de mot de passe et la connexion avec Google ou Discord. Les nouvelles adresses email doivent être confirmées. La page `/profil` permet de modifier l’identité, les préférences et l’avatar, puis d’associer Google ou Discord sans écraser le profil STOA.

La page `/communaute` utilise les changements PostgreSQL de Supabase Realtime pour les messages et les réactions, et Presence pour compter les membres présents dans le canal actif. Les profils affichés passent par une fonction SQL qui ne retourne que les informations publiques utiles à la communauté.

Le Coaching utilise un droit séparé dans `coaching_clients` : un compte Académie ne reçoit donc jamais cet accès par son seul rôle. Un appel gratuit de 15 minutes doit être réservé avant le checkout puis associé à l’admission. Chaque coach publie ses créneaux dans son espace et reçoit un email à la réservation. Le webhook Stripe valide le prix, applique les événements dans l’ordre et active le droit côté serveur. Les RLS limitent chaque client à ses données, chaque coach à ses clients assignés et les administrateurs à l’ensemble du portefeuille.

## Email Center

La page `/email-center` est réservée aux administrateurs. Les campagnes, brouillons et historiques sont stockés dans Supabase avec RLS. L’envoi passe exclusivement par la fonction serveur Vercel `/api/email-center-send`, sans identifiant Google dans le navigateur.

Configurer les secrets de la fonction avant le premier envoi :

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN` avec le scope `https://www.googleapis.com/auth/gmail.send`
- `GMAIL_SENDER_EMAIL=coaching.stoa@gmail.com`
- `SITE_URL=https://stoa-coaching.fr`

La première version ne mesure pas les ouvertures ou les clics : Gmail API ne fournit pas nativement ces statistiques sans mécanisme de suivi supplémentaire.

## Portée

Les modules contiennent encore des textes à finaliser. Le paiement Stripe Academy et Coaching est relié aux droits d’accès par webhook ; l’activation manuelle reste disponible aux administrateurs dans l’espace coach.

La progression, la reprise de lecture et les notes sont synchronisées dans Supabase pour le compte courant. Les préférences locales accélèrent l’affichage mais ne constituent pas l’autorité d’accès.

## Vérification

`npm run verify` contrôle la syntaxe des scripts servis et exécute la suite Node. Le même contrôle tourne dans GitHub Actions à chaque push et pull request.

## Direction artistique et crédits

Palette CSS : ivoire #f8f7f3, pierre #e9e7df, marbre #efeee8, olive #343b2d, encre #292d25. Typographie système Segoe UI avec repli Arial.

Les exports PNG du logo sont disponibles dans `dist/assets/branding/` en versions fond blanc et fond noir (2400 × 800 px).

Photographie : Rasmus Andersen / Unsplash, https://unsplash.com/photos/ancient-greek-temple-with-marble-columns-at-sunset-U9KdRPFRm9E (licence Unsplash). Image servie depuis Unsplash. Le site nécessite une connexion pour cette image.

Référence de structure : https://www.limitless-vitality.com/. Identité visuelle et textes conçus pour STOA.
