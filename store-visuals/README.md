# Visuels stores

Génère les visuels App Store et Play Store dans les 21 langues de l'app, à partir des captures d'écran brutes.
La mise en page reprend le template Figma `stores-screens` : dégradé orange continu sur les 5 visuels,
titre en NouvelR (police lue dans `../assets/fonts/Renault`), téléphone sous le titre.

```bash
cd store-visuals
npm install                                    # une fois (utilise Google Chrome installé sur le Mac)
node generate.mjs                              # tout
node generate.mjs --target ios-iphone-6.3 --lang fr,en
```

Sortie : `out/<cible>/<langue>/01.png … 05.png`, plus `panorama.png` pour relire les 5 visuels d'un coup.

## Captures brutes

```
raw/iphone/<langue>/1.png … 5.png     iPhone 6.3" (1206×2622, simulateur iPhone 18 Pro), captures du simulateur sans retouche
raw/iphone/<langue>/1bis.png          second téléphone du visuel 1 (écran verrouillé)
raw/ipad/<langue>/…                   iPad 13"
raw/android/<langue>/…                téléphone Android
```

`<n>bis.png` ajoute un second appareil sur le visuel `n`, sur n'importe quelle cible.
Une capture absente dans une langue est reprise du français, avec un avertissement à la fin.

## Capture automatique (iPhone)

```bash
node capture/capture-ios.mjs                 # 21 langues, ~1 à 2 min par langue
node capture/capture-ios.mjs --lang fr,de    # certaines langues
node capture/capture-ios.mjs --no-home       # sans le visuel 1
```

Prérequis, une fois : un seul simulateur iPhone démarré (iPhone 18 Pro, 6.3"), Kelec installé et connecté
au compte démo, widgets Kelec sur la **première page** de l'écran d'accueil et sur l'écran verrouillé,
Maestro installé (`brew install mobile-dev-inc/tap/maestro`).

Pour chaque langue, le script change la langue du simulateur et le redémarre : les widgets, l'écran verrouillé et l'app
suivent la langue du système. Il fige la barre d'état (9:41), capture l'écran d'accueil (`1.png`), parcourt l'app avec
Maestro (`capture/ios-app.yaml`, visuels 2 à 5) puis verrouille et capture l'écran verrouillé (`1bis.png`).
Ne pas toucher au simulateur pendant la capture.

## Cibles (`config.mjs`)

| Cible | Taille | Cadre |
|---|---|---|
| `ios-iphone-6.3` | 1206×2622 | `frames/iphone.png` (Product Bezel Apple) |
| `ios-ipad-13` | 2064×2752 | `frames/ipad.png` (Product Bezel Apple, iPad Pro 13") |
| `android-phone` | 1440×2560 | `frames/android.png` si présent, sinon cadre dessiné en CSS |


**Changer de cadre** : déposer un PNG avec l'écran transparent (ex. les « Product Bezels » d'Apple).
Le script trouve tout seul la zone de l'écran et le rayon de ses coins. Pas de code à modifier.

## Textes (`texts.json`)

Deux lignes par visuel : la première en blanc, la seconde en gras bleu.
Une ligne trop longue est réduite pour tenir dans la largeur. Sous 80 %, le script prévient qu'il faut la raccourcir.
