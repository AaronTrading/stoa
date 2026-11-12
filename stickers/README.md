# Planche de stickers STOA

La commande `node stickers/generate.js` régénère les dix SVG individuels, la planche A4 vectorielle, le PDF et l’aperçu PNG 300 dpi.

## Impression

- Support conseillé : vinyle adhésif polymère mat, résistant à l’eau et aux UV.
- Impression : CMJN, 300 dpi minimum pour l’épreuve raster ; utiliser de préférence le PDF ou le SVG vectoriel.
- Fond perdu : 2 mm autour de chaque forme.
- Découpe : le calque SVG `CutContour` contient un trait magenta de 0,25 pt. Demander à l’imprimeur de le convertir en ton direct de découpe si son RIP l’exige.
- Avant tirage : contrôler le format final A4 (210 × 297 mm), les dix tracés de coupe et scanner chaque QR sur iOS et Android depuis une épreuve à taille réelle.
- Les textes sont convertis en tracés ; les polices Cormorant Garamond et Jost n’ont pas besoin d’être installées chez l’imprimeur.

Les QR pointent vers `https://stoa-coaching.fr` avec les paramètres UTM propres à chaque sticker. La génération redécode automatiquement chaque QR au niveau de correction Q et échoue si l’URL ne correspond pas exactement.
