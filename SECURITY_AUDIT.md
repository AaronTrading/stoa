# Audit de protection des leçons STOA

Date de validation : 12 novembre 2026

## Périmètre et inventaire

L'Académie utilise une page de leçon unique : `dist/module.html`. Le document livré par le serveur contient uniquement la coquille `#lesson-copy` vide. Le contenu est récupéré depuis Supabase après authentification et contrôle d'accès.

`security.min.js` est désormais le premier script exécuté dans `<head>`, avant les feuilles de style, les modules applicatifs et le conteneur de leçon. Il pose immédiatement ses écouteurs en phase de capture. `security.css` couvre `#lesson-content`, `#lesson-copy`, leurs descendants et les médias. Les champs de saisie restent explicitement utilisables via `data-allow-select`, `input`, `textarea`, `select` et `contenteditable`.

Les en-têtes Vercel appliquent notamment CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, COOP/CORP, `X-Robots-Tag` et `Cache-Control: private, no-store` sur `/module`. L'espace membre est aussi déclaré `noindex` dans le HTML et `robots.txt`.

## Résultats

| Vecteur | Cibles testées | Avant | Correction | Après | Limite résiduelle |
|---|---|---|---|---|---|
| Clic droit, menu contextuel | Chromium, Firefox, WebKit, iPhone, Pixel | Contournable pendant le chargement | Écouteur `contextmenu` synchrone en capture | Bloqué | Le menu du navigateur reste hors contrôle de la page |
| Sélection souris, double/triple clic, Ctrl/Cmd+A | Tous les projets Playwright | Sélecteurs incomplets et écouteurs tardifs | CSS global, `selectstart`, `selectionchange`, multi-clic | Bloqué hors champs autorisés | Les API d'accessibilité du système ne sont pas contrôlables |
| Copier, couper, glisser | Tous les projets | Copie possible avant initialisation | `copy`, `cut`, `dragstart` en capture et presse-papiers neutralisé | Bloqué | Un utilisateur contrôlant son navigateur peut modifier le JavaScript |
| Appui long et sélection mobile | iPhone WebKit, Pixel Chromium | Menu natif encore accessible selon le moment | `touch-callout`, `user-select`, `touchstart`, `gesturestart` | Bloqué dans l'émulation | À confirmer sur les versions iOS/Android réelles listées plus bas |
| Raccourcis sensibles | Desktop Chromium/Firefox/WebKit | Couverture partielle | Blocage A/C/X/S/P/U, F7, F12, Ctrl/Cmd+Maj+I/J/C | Bloqué | Les entrées des menus natifs ne peuvent pas toutes être interceptées |
| Images et vidéos | Tous les moteurs | Téléchargement/glisser possible | `draggable=false`, contexte bloqué, `nodownload`, PiP et lecture distante désactivés | Bloqué dans l'interface | L'URL d'un média reçu par le navigateur reste observable par un utilisateur autorisé |
| Impression et PDF | Tous les moteurs | Contenu imprimable | `beforeprint` et `@media print` masquent tout le document | Bloqué | Un navigateur modifié peut ignorer la feuille d'impression |
| JavaScript désactivé | Chromium | Risque si le contenu était dans le HTML | Coquille vide, contenu chargé après authentification | Aucun texte de leçon | Les réponses réseau restent nécessaires quand JavaScript est actif |
| Arrière-plan, perte de focus, sélecteur d'apps | Tous les moteurs | Aperçu lisible | Masquage sur `blur`, `visibilitychange`, `pagehide` et contrôle du focus à 300 ms | Masqué lors d'une perte de focus | Une capture qui ne retire pas le focus peut encore fonctionner |
| Impr. écran | Navigateurs de bureau | Non traité de façon fiable | Presse-papiers vidé et masque temporaire sur `PrintScreen` | Dissuasion | Le système d'exploitation peut capturer avant que JavaScript ne réagisse |
| Outils de développement | Navigateurs de bureau | Le contenu restait dans le DOM | Signaux dimensionnels et temporels combinés, purge du DOM, écran neutre, rechargement | Dissuasion renforcée | DevTools, Réseau et Éléments appartiennent au propriétaire du navigateur : aucun site ne peut les interdire absolument |
| Source et enregistrement | Navigateurs de bureau | Raccourcis accessibles | Raccourcis bloqués, cache désactivé, coquille sans contenu | Coquille uniquement via `view-source:` | Les données reçues après authentification restent visibles dans un navigateur contrôlé par l'utilisateur |
| Mode lecture, traduction, lecture vocale | Navigateurs | Peu prévisible | DOM non sélectionnable ; mode canvas expérimental disponible | Réduit selon le moteur | Ces fonctions sont incompatibles avec une interdiction totale et peuvent affecter l'accessibilité |
| Capture et enregistrement d'écran | Desktop et mobile | Possibles | Masquage à la perte de focus ; préparation native Capacitor | Partiel dans le Web | Seule une enveloppe Android native avec `FLAG_SECURE` bloque réellement la capture ; iOS ne permet pas un blocage complet |

## Mode de rendu

- `dom` reste le mode recommandé : mise en page fidèle, responsive, accessible et compatible avec l'éditeur. Il bénéficie de tous les blocages de sélection et de copie.
- `canvas` est expérimental : le texte est dessiné dans un canevas et retiré du DOM après rendu. Il augmente la friction, mais dégrade l'accessibilité, la recherche interne, la mise en page riche et n'empêche pas l'interception de la réponse réseau. Il ne doit pas être présenté comme une protection cryptographique.

Le mode se sélectionne avant le chargement de `security.min.js` avec `window.STOA_SECURITY_RENDER_MODE = 'canvas'`. La valeur de production reste `dom`.

## Commande d'audit

```bash
npm run audit
```

Cette commande reconstruit `dist/security.min.js`, démarre une coquille de leçon locale et exécute Playwright sur Chromium, Firefox, WebKit, iPhone 13, Pixel 7, mode canvas et JavaScript désactivé.

## Checklist manuelle sur appareils réels

### iPhone / Safari

- Ouvrir une leçon connectée, maintenir le doigt sur un texte puis une image : aucun menu de copie ou d'enregistrement ne doit apparaître.
- Tenter un pincement sur la zone de leçon et un glisser d'image.
- Passer au sélecteur d'applications : la leçon doit devenir neutre avant l'aperçu.
- Tenter une capture et un enregistrement d'écran ; constater la limite Web documentée ci-dessus.
- Vérifier qu'un champ du chat ou du profil reste sélectionnable et éditable.

### Android / Chrome

- Refaire l'appui long, la sélection par poignées, le glisser d'image et le pincement.
- Passer aux applications récentes puis revenir : le contenu doit être masqué puis restauré.
- Tenter Partager, Imprimer, Enregistrer la page et une capture système.
- Vérifier les champs de saisie explicitement autorisés.

## Conclusion de sécurité

Le navigateur peut rendre la copie accidentelle ou opportuniste nettement plus difficile ; il ne peut pas empêcher son propriétaire d'observer ce qu'il doit nécessairement recevoir et afficher. La défense forte reste l'authentification, les règles RLS Supabase, l'absence de contenu dans le HTML initial, le cache privé désactivé et, si nécessaire, un filigrane nominatif. Pour la capture, la suite logique est l'application native préparée dans `mobile-security/`.
