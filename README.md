# STOA

Site statique multi-pages en français, sans framework ni étape de build.

## Ouvrir le projet

Ouvrir `dist/index.html` directement, ou lancer `node serve.cjs` puis visiter http://127.0.0.1:4173.

- `dist/index.html` : landing, philosophie, programme, offres et FAQ.
- `dist/academie.html` : programme filtrable et progression.
- `dist/module.html` : lecteur des 23 modules, exercices et notes personnelles.
- `dist/styles.css` : styles partagés, palette et responsive.
- `dist/app.js` : contenu, interactions et stockage local.

Les fichiers du dossier `dist` sont les sources du site, directement modifiables et hébergeables. Aucun générateur ni dépendance JavaScript.

## Portée

Prototype fonctionnel. Les modules contiennent des textes de démonstration à remplacer par les cours définitifs. Les offres sont présentées à 39 €/mois et 180 €/mois. Les boutons affichent une information sur la démonstration : aucun paiement, inscription réelle, authentification ou service de coaching n’est connecté.

La progression et les notes utilisent localStorage sur l’appareil courant. Elles ne sont pas synchronisées entre appareils et peuvent être effacées par le navigateur. En cas de stockage indisponible, l’interface indique l’échec de sauvegarde. Ne pas utiliser les notes pour des informations médicales sensibles.

## Direction artistique et crédits

Palette CSS : ivoire #f8f7f3, pierre #e9e7df, marbre #efeee8, olive #343b2d, encre #292d25. Police DM Sans via Google Fonts.

Photographie : Rasmus Andersen / Unsplash, https://unsplash.com/photos/ancient-greek-temple-with-marble-columns-at-sunset-U9KdRPFRm9E (licence Unsplash). Image servie depuis Unsplash. Le site nécessite une connexion pour cette image et les polices ; les polices système prennent le relais hors ligne.

Référence de structure : https://www.limitless-vitality.com/. Identité visuelle et textes conçus pour STOA.
