# Préparation Capacitor — protection native

Ces fichiers préparent la phase mobile sans modifier le site ni l'application Electron actuelle.

## Initialisation

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "STOA Académie" fr.stoa.academie --web-dir dist
npx cap add android
npx cap add ios
npx cap sync
```

Copier ensuite `capacitor.config.ts` à la racine du projet.

## Android

Remplacer la `MainActivity.kt` créée par Capacitor par `android/MainActivity.kt`, puis lancer :

```bash
npx cap open android
```

`FLAG_SECURE` empêche les captures, l'enregistrement d'écran et l'aperçu lisible dans les applications récentes sur les fenêtres de l'application.

## iOS

Reporter la logique de `ios/AppDelegate.swift` dans le délégué généré par la version de Capacitor utilisée, puis lancer :

```bash
npx cap open ios
```

iOS ne fournit pas d'équivalent intégral à `FLAG_SECURE`. Le code masque l'application dans le sélecteur et pendant une capture d'écran active (`UIScreen.isCaptured`). Une capture instantanée peut uniquement être détectée après sa réalisation ; elle ne peut pas être annulée par une application tierce.

## Publication

- Android : générer un Android App Bundle signé dans Android Studio, configurer la fiche Play Console et transmettre le bundle à la piste de test interne avant la production.
- iOS : définir l'équipe et les certificats dans Xcode, archiver l'application, l'envoyer à App Store Connect puis la distribuer d'abord via TestFlight.
- Tester l'authentification Supabase, les liens de retour OAuth, le paiement et la restauration de session sur les deux plateformes avant soumission.
