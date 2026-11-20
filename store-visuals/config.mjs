// Mise en page des visuels stores. Les valeurs de l'iPhone viennent du template Figma
// « stores-screens » (frame 1320×2868) : titre NouvelR 120px à 106px du haut, téléphone de 2282px de haut à 450px.

export const LANGS = [
  'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'hr',
  'hu', 'it', 'nb', 'nl', 'pl', 'pt', 'ro', 'sl', 'sv', 'tr',
];

// Langue dont on reprend les captures quand il en manque pour une langue (avec un avertissement).
export const FALLBACK_LANG = 'fr';

export const STYLE = {
  // Dégradé continu sur tout le panorama (droite #d24a14 → gauche #ff9664).
  // Dans Figma il fait 6760px pour 5 × 1320px : il déborde un peu à droite.
  gradientFrom: '#ff9664',
  gradientTo: '#d24a14',
  gradientOverflow: 6760 / 6600,
  titleColor: '#ffffff',
  accentColor: '#3171de',
};

// Une cible = une taille d'image demandée par un store.
// - frame : PNG du cadre, avec l'écran transparent. Sans fichier, un cadre est dessiné en CSS (Android).
// - raw   : dossier des captures brutes, raw/<raw>/<langue>/<n>.png (et <n>bis.png pour un second appareil).
// - device.top / device.height : position et hauteur du cadre ; la largeur suit les proportions du cadre.
// - device.bisOffset : décalage vertical du second appareil (visuel 1 : widgets + écran verrouillé),
//   en fraction de la hauteur de l'appareil.
export const TARGETS = {
  // Seule taille iPhone demandée par App Store Connect. Template Figma (1320 de large) ramené à 1206 de large.
  'ios-iphone-6.3': {
    store: 'ios',
    width: 1206,
    height: 2622,
    frame: 'frames/iphone.png',
    raw: 'iphone',
    title: { top: 97, fontSize: 110, sideMargin: 64 },
    device: { top: 411, height: 2085, bisOffset: 1225 / 2282 },
  },
  'ios-ipad-13': {
    store: 'ios',
    width: 2064,
    height: 2752,
    frame: 'frames/ipad.png',
    raw: 'ipad',
    title: { top: 130, fontSize: 150, sideMargin: 120 },
    device: { top: 560, height: 2100, bisOffset: 0.55 },
  },
  'android-phone': {
    store: 'android',
    width: 1440,
    height: 2560,
    frame: 'frames/android.png',
    raw: 'android',
    title: { top: 110, fontSize: 125, sideMargin: 80 },
    device: { top: 470, height: 1990, bisOffset: 0.54 },
    // Cadre CSS utilisé si frames/android.png n'existe pas.
    cssFrame: { bezel: 0.028, radius: 0.12, screenRadius: 0.095, camera: 0.032 },
  },
};
