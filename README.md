# STOA

Site statique multi-pages en français, sans framework ni étape de build.

## Ouvrir le projet

Ouvrir `dist/index.html` directement, ou lancer `node serve.cjs` puis visiter http://127.0.0.1:4173.

- `dist/index.html` : landing, philosophie, programme, offres et FAQ.
- `dist/academie.html` : programme filtrable et progression.
- `dist/module.html` : lecteur des modules, exercices et notes personnelles.
- `dist/styles.css` : styles partagés, palette et responsive.
- `dist/app.js` : contenu, interactions et stockage local.

Les fichiers du dossier `dist` sont les sources du site, directement modifiables et hébergeables. Aucun générateur ni dépendance JavaScript.

## Backend Supabase

Les migrations SQL sont dans `supabase/migrations/` et les données de démonstration dans `supabase/seed.sql`. Le seed crée 17 chapitres, 34 modules et 102 sous-chapitres. Toutes les tables applicatives utilisent RLS.

Le client navigateur est dans `lib/supabase.js`, avec les helpers d’authentification dans `lib/auth.js` et le schéma JSDoc dans `lib/database.js`. Comme le site reste sans build, le client officiel `@supabase/supabase-js` est chargé comme module ESM. Les valeurs publiques sont injectées par `window.__STOA_ENV__`; `dist/env.example.js` montre le format attendu.

L’interface d’authentification dans `dist/auth.js` permet la connexion et l’inscription par email et mot de passe, l’envoi d’un magic link et la connexion avec Discord. Le secret Discord reste uniquement dans la configuration du fournisseur Supabase.

## Portée

Prototype fonctionnel. Les modules contiennent des textes de démonstration à remplacer par les cours définitifs. Les offres sont présentées à 39 €/mois et 180 €/mois. Aucun paiement ni service de coaching n’est encore connecté à l’interface.

La progression et les notes utilisent localStorage sur l’appareil courant. Elles ne sont pas synchronisées entre appareils et peuvent être effacées par le navigateur. En cas de stockage indisponible, l’interface indique l’échec de sauvegarde. Ne pas utiliser les notes pour des informations médicales sensibles.

## Direction artistique et crédits

Palette CSS : ivoire #f8f7f3, pierre #e9e7df, marbre #efeee8, olive #343b2d, encre #292d25. Typographie système Segoe UI avec repli Arial.

Les exports PNG du logo sont disponibles dans `dist/assets/branding/` en versions fond blanc et fond noir (2400 × 800 px).

Photographie : Rasmus Andersen / Unsplash, https://unsplash.com/photos/ancient-greek-temple-with-marble-columns-at-sunset-U9KdRPFRm9E (licence Unsplash). Image servie depuis Unsplash. Le site nécessite une connexion pour cette image.

Référence de structure : https://www.limitless-vitality.com/. Identité visuelle et textes conçus pour STOA.
