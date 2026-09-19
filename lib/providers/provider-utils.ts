import { ConflictEvent, Severity } from '@/types/conflict';
import { calculateSeverity } from '../scoring/severity';
import { isWithinWindow, isHistoricalOrStaleConflict } from '../data/date-utils';
import { COUNTRY_TO_REGION } from '../aggregation/clustering';
import { classifyEvent } from '../classification/event-classifier';

/**
 * Standard ISO-3166-1 alpha-2 and alpha-3 country code coordinates & names
 */
export const ISO_COUNTRY_LOOKUP: Record<string, { country: string; lat: number; lon: number }> = {
  // Eastern & Central Europe / Eurasia
  ua: { country: 'Ukraine', lat: 48.3794, lon: 31.1656 },
  ukr: { country: 'Ukraine', lat: 48.3794, lon: 31.1656 },
  ru: { country: 'Russia', lat: 55.7558, lon: 37.6173 },
  rus: { country: 'Russia', lat: 55.7558, lon: 37.6173 },
  by: { country: 'Belarus', lat: 53.7098, lon: 27.9534 },
  blr: { country: 'Belarus', lat: 53.7098, lon: 27.9534 },
  md: { country: 'Moldova', lat: 47.0105, lon: 28.8638 },
  mda: { country: 'Moldova', lat: 47.0105, lon: 28.8638 },
  ge: { country: 'Georgia', lat: 41.7151, lon: 44.8271 },
  geo: { country: 'Georgia', lat: 41.7151, lon: 44.8271 },
  am: { country: 'Armenia', lat: 40.0691, lon: 45.0382 },
  arm: { country: 'Armenia', lat: 40.0691, lon: 45.0382 },
  az: { country: 'Azerbaijan', lat: 40.1431, lon: 47.5769 },
  aze: { country: 'Azerbaijan', lat: 40.1431, lon: 47.5769 },
  pl: { country: 'Poland', lat: 52.2297, lon: 21.0122 },
  pol: { country: 'Poland', lat: 52.2297, lon: 21.0122 },
  ro: { country: 'Romania', lat: 44.4268, lon: 26.1025 },
  rou: { country: 'Romania', lat: 44.4268, lon: 26.1025 },
  rs: { country: 'Serbia', lat: 44.7866, lon: 20.4489 },
  srb: { country: 'Serbia', lat: 44.7866, lon: 20.4489 },
  xk: { country: 'Kosovo', lat: 42.6629, lon: 21.1655 },
  kos: { country: 'Kosovo', lat: 42.6629, lon: 21.1655 },

  // Middle East & Levant
  il: { country: 'Israel', lat: 31.7683, lon: 35.2137 },
  isr: { country: 'Israel', lat: 31.7683, lon: 35.2137 },
  ps: { country: 'Palestine', lat: 31.9522, lon: 35.2332 },
  pse: { country: 'Palestine', lat: 31.9522, lon: 35.2332 },
  lb: { country: 'Lebanon', lat: 33.8938, lon: 35.5018 },
  lbn: { country: 'Lebanon', lat: 33.8938, lon: 35.5018 },
  sy: { country: 'Syria', lat: 33.5138, lon: 36.2765 },
  syr: { country: 'Syria', lat: 33.5138, lon: 36.2765 },
  ye: { country: 'Yemen', lat: 15.3694, lon: 44.1910 },
  yem: { country: 'Yemen', lat: 15.3694, lon: 44.1910 },
  iq: { country: 'Iraq', lat: 33.3152, lon: 44.3661 },
  irq: { country: 'Iraq', lat: 33.3152, lon: 44.3661 },
  ir: { country: 'Iran', lat: 35.6892, lon: 51.3890 },
  irn: { country: 'Iran', lat: 35.6892, lon: 51.3890 },
  jo: { country: 'Jordan', lat: 31.9454, lon: 35.9284 },
  jor: { country: 'Jordan', lat: 31.9454, lon: 35.9284 },
  sa: { country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  sau: { country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  tr: { country: 'Turkey', lat: 39.9334, lon: 32.8597 },
  tur: { country: 'Turkey', lat: 39.9334, lon: 32.8597 },
  ae: { country: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  are: { country: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  qa: { country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  qat: { country: 'Qatar', lat: 25.2854, lon: 51.5310 },
  kw: { country: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  kwt: { country: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  om: { country: 'Oman', lat: 23.5880, lon: 58.3829 },
  omn: { country: 'Oman', lat: 23.5880, lon: 58.3829 },
  bh: { country: 'Bahrain', lat: 26.0667, lon: 50.5577 },
  bhr: { country: 'Bahrain', lat: 26.0667, lon: 50.5577 },
  cy: { country: 'Cyprus', lat: 35.1856, lon: 33.3823 },
  cyp: { country: 'Cyprus', lat: 35.1856, lon: 33.3823 },

  // Africa
  sd: { country: 'Sudan', lat: 15.5007, lon: 32.5599 },
  sdn: { country: 'Sudan', lat: 15.5007, lon: 32.5599 },
  ss: { country: 'South Sudan', lat: 4.8594, lon: 31.5713 },
  ssd: { country: 'South Sudan', lat: 4.8594, lon: 31.5713 },
  cd: { country: 'Democratic Republic of Congo', lat: -4.4419, lon: 15.2663 },
  cod: { country: 'Democratic Republic of Congo', lat: -4.4419, lon: 15.2663 },
  so: { country: 'Somalia', lat: 2.0469, lon: 45.3182 },
  som: { country: 'Somalia', lat: 2.0469, lon: 45.3182 },
  ng: { country: 'Nigeria', lat: 9.0765, lon: 7.3986 },
  nga: { country: 'Nigeria', lat: 9.0765, lon: 7.3986 },
  ml: { country: 'Mali', lat: 12.6392, lon: -8.0029 },
  mli: { country: 'Mali', lat: 12.6392, lon: -8.0029 },
  bf: { country: 'Burkina Faso', lat: 12.3714, lon: -1.5197 },
  bfa: { country: 'Burkina Faso', lat: 12.3714, lon: -1.5197 },
  ne: { country: 'Niger', lat: 13.5116, lon: 2.1254 },
  ner: { country: 'Niger', lat: 13.5116, lon: 2.1254 },
  td: { country: 'Chad', lat: 12.1348, lon: 15.0557 },
  tcd: { country: 'Chad', lat: 12.1348, lon: 15.0557 },
  et: { country: 'Ethiopia', lat: 9.0300, lon: 38.7400 },
  eth: { country: 'Ethiopia', lat: 9.0300, lon: 38.7400 },
  mz: { country: 'Mozambique', lat: -25.9692, lon: 32.5732 },
  moz: { country: 'Mozambique', lat: -25.9692, lon: 32.5732 },
  cm: { country: 'Cameroon', lat: 3.8480, lon: 11.5021 },
  cmr: { country: 'Cameroon', lat: 3.8480, lon: 11.5021 },
  ly: { country: 'Libya', lat: 32.8872, lon: 13.1913 },
  lby: { country: 'Libya', lat: 32.8872, lon: 13.1913 },
  ke: { country: 'Kenya', lat: -1.2921, lon: 36.8219 },
  ken: { country: 'Kenya', lat: -1.2921, lon: 36.8219 },
  za: { country: 'South Africa', lat: -25.7479, lon: 28.2293 },
  zaf: { country: 'South Africa', lat: -25.7479, lon: 28.2293 },
  eg: { country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  egy: { country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  dz: { country: 'Algeria', lat: 36.7538, lon: 3.0588 },
  dza: { country: 'Algeria', lat: 36.7538, lon: 3.0588 },
  ma: { country: 'Morocco', lat: 34.0209, lon: -6.8416 },
  mar: { country: 'Morocco', lat: 34.0209, lon: -6.8416 },
  tn: { country: 'Tunisia', lat: 36.8065, lon: 10.1815 },
  tun: { country: 'Tunisia', lat: 36.8065, lon: 10.1815 },
  ug: { country: 'Uganda', lat: 0.3476, lon: 32.5825 },
  uga: { country: 'Uganda', lat: 0.3476, lon: 32.5825 },
  rw: { country: 'Rwanda', lat: -1.9706, lon: 30.1044 },
  rwa: { country: 'Rwanda', lat: -1.9706, lon: 30.1044 },
  bi: { country: 'Burundi', lat: -3.3822, lon: 29.3644 },
  bdi: { country: 'Burundi', lat: -3.3822, lon: 29.3644 },
  cf: { country: 'Central African Republic', lat: 4.3947, lon: 18.5582 },
  caf: { country: 'Central African Republic', lat: 4.3947, lon: 18.5582 },

  // Asia & Oceania
  pk: { country: 'Pakistan', lat: 33.6844, lon: 73.0479 },
  pak: { country: 'Pakistan', lat: 33.6844, lon: 73.0479 },
  af: { country: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  afg: { country: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  in: { country: 'India', lat: 28.6139, lon: 77.2090 },
  ind: { country: 'India', lat: 28.6139, lon: 77.2090 },
  bd: { country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  bgd: { country: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  mm: { country: 'Myanmar', lat: 19.7633, lon: 96.0785 },
  mmr: { country: 'Myanmar', lat: 19.7633, lon: 96.0785 },
  ph: { country: 'Philippines', lat: 14.5995, lon: 120.9842 },
  phl: { country: 'Philippines', lat: 14.5995, lon: 120.9842 },
  th: { country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  tha: { country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  id: { country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  idn: { country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  vn: { country: 'Vietnam', lat: 21.0285, lon: 105.8542 },
  vnm: { country: 'Vietnam', lat: 21.0285, lon: 105.8542 },
  my: { country: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  mys: { country: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  sg: { country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  sgp: { country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  tw: { country: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  twn: { country: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  cn: { country: 'China', lat: 39.9042, lon: 116.4074 },
  chn: { country: 'China', lat: 39.9042, lon: 116.4074 },
  kp: { country: 'North Korea', lat: 40.3399, lon: 127.5101 },
  prk: { country: 'North Korea', lat: 40.3399, lon: 127.5101 },
  kr: { country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  kor: { country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  jp: { country: 'Japan', lat: 35.6762, lon: 139.6503 },
  jpn: { country: 'Japan', lat: 35.6762, lon: 139.6503 },
  au: { country: 'Australia', lat: -35.2809, lon: 149.1300 },
  aus: { country: 'Australia', lat: -35.2809, lon: 149.1300 },
  nz: { country: 'New Zealand', lat: -41.2865, lon: 174.7762 },
  nzl: { country: 'New Zealand', lat: -41.2865, lon: 174.7762 },

  // Americas & Western Europe
  us: { country: 'United States', lat: 38.8951, lon: -77.0364 },
  usa: { country: 'United States', lat: 38.8951, lon: -77.0364 },
  ca: { country: 'Canada', lat: 45.4215, lon: -75.6972 },
  can: { country: 'Canada', lat: 45.4215, lon: -75.6972 },
  mx: { country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  mex: { country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  br: { country: 'Brazil', lat: -15.7975, lon: -47.8919 },
  bra: { country: 'Brazil', lat: -15.7975, lon: -47.8919 },
  ar: { country: 'Argentina', lat: -34.6037, lon: -58.3816 },
  arg: { country: 'Argentina', lat: -34.6037, lon: -58.3816 },
  cl: { country: 'Chile', lat: -33.4489, lon: -70.6693 },
  chl: { country: 'Chile', lat: -33.4489, lon: -70.6693 },
  co: { country: 'Colombia', lat: 4.7110, lon: -74.0721 },
  col: { country: 'Colombia', lat: 4.7110, lon: -74.0721 },
  ve: { country: 'Venezuela', lat: 10.4806, lon: -66.9036 },
  ven: { country: 'Venezuela', lat: 10.4806, lon: -66.9036 },
  ec: { country: 'Ecuador', lat: -0.1807, lon: -78.4678 },
  ecu: { country: 'Ecuador', lat: -0.1807, lon: -78.4678 },
  pe: { country: 'Peru', lat: -12.0464, lon: -77.0428 },
  per: { country: 'Peru', lat: -12.0464, lon: -77.0428 },
  ht: { country: 'Haiti', lat: 18.5944, lon: -72.3074 },
  hti: { country: 'Haiti', lat: 18.5944, lon: -72.3074 },
  cu: { country: 'Cuba', lat: 23.1136, lon: -82.3666 },
  cub: { country: 'Cuba', lat: 23.1136, lon: -82.3666 },
  gb: { country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  gbr: { country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  de: { country: 'Germany', lat: 52.5200, lon: 13.4050 },
  deu: { country: 'Germany', lat: 52.5200, lon: 13.4050 },
  fr: { country: 'France', lat: 48.8566, lon: 2.3522 },
  fra: { country: 'France', lat: 48.8566, lon: 2.3522 },
  it: { country: 'Italy', lat: 41.9028, lon: 12.4964 },
  ita: { country: 'Italy', lat: 41.9028, lon: 12.4964 },
  es: { country: 'Spain', lat: 40.4168, lon: -3.7038 },
  esp: { country: 'Spain', lat: 40.4168, lon: -3.7038 },
  pt: { country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  prt: { country: 'Portugal', lat: 38.7223, lon: -9.1393 },
  be: { country: 'Belgium', lat: 50.8503, lon: 4.3517 },
  bel: { country: 'Belgium', lat: 50.8503, lon: 4.3517 },
  nl: { country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  nld: { country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  ch: { country: 'Switzerland', lat: 46.2044, lon: 6.1432 },
  che: { country: 'Switzerland', lat: 46.2044, lon: 6.1432 },
  at: { country: 'Austria', lat: 48.2082, lon: 16.3738 },
  aut: { country: 'Austria', lat: 48.2082, lon: 16.3738 },
  se: { country: 'Sweden', lat: 59.3293, lon: 18.0686 },
  swe: { country: 'Sweden', lat: 59.3293, lon: 18.0686 },
  no: { country: 'Norway', lat: 59.9139, lon: 10.7522 },
  nor: { country: 'Norway', lat: 59.9139, lon: 10.7522 },
  dk: { country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  dnk: { country: 'Denmark', lat: 55.6761, lon: 12.5683 },
  fi: { country: 'Finland', lat: 60.1699, lon: 24.9384 },
  fin: { country: 'Finland', lat: 60.1699, lon: 24.9384 },
  ie: { country: 'Ireland', lat: 53.3498, lon: -6.2603 },
  irl: { country: 'Ireland', lat: 53.3498, lon: -6.2603 },
  gr: { country: 'Greece', lat: 37.9838, lon: 23.7275 },
  grc: { country: 'Greece', lat: 37.9838, lon: 23.7275 },
};

/**
 * High-Density Conflict Gazetteer: Maps key frontlines, combat cities,
 * belligerent actors, and demonyms to coordinates.
 */
export const GLOBAL_COUNTRY_COORDS: Record<string, [number, number]> = {
  // ── 1. ACTIVE UKRAINE / RUSSIA WAR FRONTLINES & COMBAT CITIES ───────────
  pokrovsk: [48.282, 37.182],
  'chasiv yar': [48.583, 37.833],
  toretsk: [48.398, 37.854],
  kupyansk: [49.707, 37.616],
  kurakhove: [47.985, 37.277],
  'velyka novosilka': [47.842, 36.833],
  vuhledar: [47.780, 37.248],
  lyman: [48.986, 37.810],
  robotyne: [47.447, 35.836],
  avdiivka: [48.138, 37.746],
  kharkiv: [49.9935, 36.2304],
  zaporizhzhia: [47.8388, 35.1396],
  kherson: [46.6354, 32.6169],
  dnipro: [48.4647, 35.0462],
  sumy: [50.9077, 34.7981],
  odesa: [46.4825, 30.7233],
  kyiv: [50.4501, 30.5234],
  ukraine: [48.3794, 31.1656],
  ukrainian: [48.3794, 31.1656],
  donbas: [48.0, 37.8],
  donetsk: [48.0159, 37.8028],
  luhansk: [48.574, 39.3078],
  crimea: [44.9521, 34.1024],
  sevastopol: [44.6167, 33.5254],
  belgorod: [50.5997, 36.5982],
  kursk: [51.7304, 36.1927],
  sudzha: [51.1928, 35.2711],
  voronezh: [51.6683, 39.1919],
  rostov: [47.2357, 39.7015],
  moscow: [55.7558, 37.6173],
  kremlin: [55.7520, 37.6175],
  russia: [55.7558, 37.6173],
  russian: [55.7558, 37.6173],

  // ── 2. MIDDLE EAST & LEVANT WAR ZONES & COMBAT HUBS ─────────────────────
  rafah: [31.2968, 34.2435],
  'khan younis': [31.3462, 34.3063],
  'gaza city': [31.5017, 34.4668],
  jabalia: [31.5286, 34.4828],
  'deir al-balah': [31.4178, 34.3503],
  gaza: [31.45, 34.38],
  palestine: [31.9522, 35.2332],
  palestinian: [31.9522, 35.2332],
  'west bank': [31.9, 35.2],
  jenin: [32.4646, 35.2954],
  nablus: [32.2211, 35.2544],
  tulkarm: [32.3117, 35.0278],
  hebron: [31.5326, 35.0998],
  ramallah: [31.9038, 35.2034],
  jerusalem: [31.7683, 35.2137],
  telaviv: [32.0853, 34.7818],
  'tel aviv': [32.0853, 34.7818],
  haifa: [32.7940, 34.9896],
  israel: [31.7683, 35.2137],
  israeli: [31.7683, 35.2137],
  idf: [31.7683, 35.2137],
  hamas: [31.45, 34.38],
  'al-qassam': [31.45, 34.38],
  'islamic jihad': [31.45, 34.38],
  dahieh: [33.845, 35.508],
  beirut: [33.8938, 35.5018],
  'bekaa valley': [33.85, 35.90],
  bekaa: [33.85, 35.90],
  baalbek: [34.0058, 36.2181],
  nabatieh: [33.3772, 35.4839],
  tyre: [33.2705, 35.2038],
  sidon: [33.5572, 35.3729],
  litani: [33.33, 35.25],
  lebanon: [33.8938, 35.5018],
  lebanese: [33.8938, 35.5018],
  hezbollah: [33.845, 35.508],
  zarit: [33.091, 35.281],
  'kiryat shmona': [33.207, 35.570],
  'golan heights': [32.96, 35.75],
  golan: [32.96, 35.75],
  damascus: [33.5138, 36.2765],
  aleppo: [36.2021, 37.1343],
  idlib: [35.9306, 36.6339],
  homs: [34.7324, 36.7137],
  latakia: [35.5317, 35.7900],
  tartus: [34.8890, 35.8866],
  syria: [33.5138, 36.2765],
  syrian: [33.5138, 36.2765],
  hodeidah: [14.7978, 42.9545],
  sanaa: [15.3694, 44.1910],
  saada: [16.9402, 43.7639],
  aden: [12.7855, 45.0187],
  marib: [15.4614, 45.3253],
  yemen: [15.3694, 44.1910],
  yemeni: [15.3694, 44.1910],
  houthi: [15.3694, 44.1910],
  houthis: [15.3694, 44.1910],
  'ansar allah': [15.3694, 44.1910],
  tehran: [35.6892, 51.3890],
  isfahan: [32.6546, 51.6680],
  natanz: [33.5117, 51.9167],
  fordow: [34.8847, 50.9958],
  iran: [35.6892, 51.3890],
  iranian: [35.6892, 51.3890],
  irgc: [35.6892, 51.3890],
  baghdad: [33.3152, 44.3661],
  erbil: [36.1901, 44.0091],
  iraq: [33.3152, 44.3661],
  iraqi: [33.3152, 44.3661],

  // ── 3. AFRICA WAR ZONES & INSURGENCY CORRIDORS ─────────────────────────
  'el fasher': [13.6279, 25.3494],
  fasher: [13.6279, 25.3494],
  darfur: [13.0, 24.5],
  khartoum: [15.5007, 32.5599],
  omdurman: [15.6500, 32.4800],
  nyala: [12.0500, 24.8833],
  geneina: [13.4500, 22.4500],
  'port sudan': [19.6158, 37.2164],
  sudan: [15.5007, 32.5599],
  sudanese: [15.5007, 32.5599],
  rsf: [15.5007, 32.5599],
  'rapid support forces': [15.5007, 32.5599],
  saf: [15.5007, 32.5599],
  goma: [-1.6792, 29.2228],
  'north kivu': [-0.5, 29.0],
  'south kivu': [-3.0, 28.5],
  kivu: [-1.6792, 29.2228],
  ituri: [1.5, 30.0],
  beni: [0.4911, 29.4731],
  rutshuru: [-1.1833, 29.4500],
  drc: [-4.4419, 15.2663],
  'dr congo': [-4.4419, 15.2663],
  'democratic republic of congo': [-4.4419, 15.2663],
  congolese: [-4.4419, 15.2663],
  m23: [-1.6792, 29.2228],
  mogadishu: [2.0469, 45.3182],
  'lower shabelle': [1.8, 44.5],
  galmudug: [5.5, 47.5],
  somalia: [2.0469, 45.3182],
  somali: [2.0469, 45.3182],
  'al-shabaab': [2.0469, 45.3182],
  alshabaab: [2.0469, 45.3182],
  tinzaouaten: [19.95, 2.97],
  gao: [16.2717, -0.0447],
  kidal: [18.4411, 1.4078],
  timbuktu: [16.7666, -3.0026],
  mali: [12.6392, -8.0029],
  malian: [12.6392, -8.0029],
  djibo: [14.1000, -1.6333],
  soum: [14.1, -1.6],
  tillaberi: [14.2072, 1.4542],
  'burkina faso': [12.3714, -1.5197],
  burkinabe: [12.3714, -1.5197],
  niger: [13.5116, 2.1254],
  nigerien: [13.5116, 2.1254],
  chad: [12.1348, 15.0557],
  chadian: [12.1348, 15.0557],
  'cabo delgado': [-12.5, 39.5],
  palma: [-10.7833, 40.4833],
  mozambique: [-25.9692, 32.5732],
  tigray: [14.0323, 38.3166],
  amhara: [11.5, 38.0],
  ethiopia: [9.0300, 38.7400],
  ethiopian: [9.0300, 38.7400],

  // ── 4. ASIA & AMERICAS COMBAT THEATERS ─────────────────────────────────
  'shan state': [21.5, 98.0],
  lashio: [22.9333, 97.7500],
  rakhine: [20.0, 93.5],
  sittwe: [20.1462, 92.8983],
  mandalay: [21.9588, 96.0891],
  sagaing: [21.8787, 95.9797],
  myanmar: [19.7633, 96.0785],
  burma: [19.7633, 96.0785],
  mndaa: [21.5, 98.0],
  tnla: [21.5, 98.0],
  tatmadaw: [19.7633, 96.0785],
  baluchistan: [28.4907, 65.0958],
  balochistan: [28.4907, 65.0958],
  torkham: [34.1278, 71.1556],
  pakistan: [33.6844, 73.0479],
  pakistani: [33.6844, 73.0479],
  afghanistan: [34.5553, 69.2075],
  afghan: [34.5553, 69.2075],
  taliban: [34.5553, 69.2075],
  'second thomas shoal': [9.7333, 115.8667],
  'spratly islands': [10.0, 115.0],
  'south china sea': [12.0, 113.0],
  philippines: [14.5995, 120.9842],
  filipino: [14.5995, 120.9842],
  taiwan: [25.0330, 121.5654],
  taiwanese: [25.0330, 121.5654],
  culiacan: [24.8091, -107.3940],
  sinaloa: [25.0, -107.5],
  mexico: [19.4326, -99.1332],
  mexican: [19.4326, -99.1332],
  'port-au-prince': [18.5944, -72.3074],
  haiti: [18.5944, -72.3074],
  haitian: [18.5944, -72.3074],

  // ── 5. WORLD POWERS & GLOBAL DIPLOMACY HUBS ────────────────────────────
  washington: [38.8951, -77.0364],
  pentagon: [38.8719, -77.0563],
  'white house': [38.8977, -77.0365],
  'united states': [38.8951, -77.0364],
  usa: [38.8951, -77.0364],
  america: [38.8951, -77.0364],
  american: [38.8951, -77.0364],
  canada: [45.4215, -75.6972],
  ottawa: [45.4215, -75.6972],
  canadian: [45.4215, -75.6972],
  london: [51.5074, -0.1278],
  'united kingdom': [51.5074, -0.1278],
  uk: [51.5074, -0.1278],
  britain: [51.5074, -0.1278],
  british: [51.5074, -0.1278],
  paris: [48.8566, 2.3522],
  france: [48.8566, 2.3522],
  french: [48.8566, 2.3522],
  berlin: [52.5200, 13.4050],
  germany: [52.5200, 13.4050],
  german: [52.5200, 13.4050],
  brussels: [50.8503, 4.3517],
  belgium: [50.8503, 4.3517],
  nato: [50.8787, 4.4262],
  'european union': [50.8503, 4.3517],
  eu: [50.8503, 4.3517],
  beijing: [39.9042, 116.4074],
  china: [39.9042, 116.4074],
  chinese: [39.9042, 116.4074],
  tokyo: [35.6762, 139.6503],
  japan: [35.6762, 139.6503],
  japanese: [35.6762, 139.6503],
  seoul: [37.5665, 126.9780],
  'south korea': [37.5665, 126.9780],
  korean: [37.5665, 126.9780],
  pyongyang: [39.0392, 125.7625],
  'north korea': [39.0392, 125.7625],
  // ── 5.5 INDIA STRATEGIC DEFENSE, FRONTIERS & CONFLICT HUBS ─────────────
  ladakh: [34.1526, 77.5771],
  leh: [34.1526, 77.5771],
  srinagar: [34.0837, 74.7973],
  jammu: [32.7266, 74.8570],
  kashmir: [34.0837, 74.7973],
  rajouri: [33.3762, 74.3108],
  poonch: [33.7712, 74.0934],
  kupwara: [34.5262, 74.2546],
  anantnag: [33.7311, 75.1522],
  baramulla: [34.1980, 74.3639],
  siachen: [35.4212, 77.1095],
  galwan: [34.7500, 78.2000],
  pangong: [33.7500, 78.9000],
  chushul: [33.5833, 78.6500],
  doklam: [27.0286, 88.9222],
  loc: [34.15, 74.30],
  lac: [34.20, 78.40],
  manipur: [24.6637, 93.9063],
  imphal: [24.8170, 93.9368],
  churachandpur: [24.3333, 93.6667],
  moreh: [24.2500, 94.3000],
  arunachal: [28.2180, 94.7278],
  'arunachal pradesh': [28.2180, 94.7278],
  tawang: [27.5861, 91.8653],
  itanagar: [27.0844, 93.6053],
  assam: [26.2006, 92.9376],
  guwahati: [26.1445, 91.7362],
  nagaland: [26.1584, 94.5624],
  kohima: [25.6751, 94.1086],
  mizoram: [23.1645, 92.9376],
  aizawl: [23.7271, 92.7176],
  tripura: [23.9408, 91.9882],
  agartala: [23.8315, 91.2868],
  meghalaya: [25.4670, 91.3662],
  shillong: [25.5788, 91.8933],
  bastar: [19.1071, 81.9535],
  dantewada: [18.9000, 81.3500],
  sukma: [18.4000, 81.6667],
  bijapur: [18.8000, 80.8167],
  chhattisgarh: [21.2787, 81.8661],
  raipur: [21.2514, 81.6296],
  jharkhand: [23.6102, 85.2799],
  ranchi: [23.3441, 85.3096],
  odisha: [20.9517, 85.0985],
  bhubaneswar: [20.2961, 85.8245],
  chandipur: [21.4500, 87.0167],
  balasore: [21.4934, 86.9135],
  punjab: [31.1471, 75.3412],
  amritsar: [31.6340, 74.8723],
  chandigarh: [30.7333, 76.7794],
  rajasthan: [27.0238, 74.2179],
  pokhran: [26.9167, 71.9167],
  jaisalmer: [26.9157, 70.9083],
  bikaner: [28.0229, 73.3119],
  jaipur: [26.9124, 75.7873],
  mumbai: [19.0760, 72.8777],
  maharashtra: [19.7515, 75.7139],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  karnataka: [15.3173, 75.7139],
  hyderabad: [17.3850, 78.4867],
  telangana: [18.1124, 79.0193],
  chennai: [13.0827, 80.2707],
  'tamil nadu': [11.1271, 78.6569],
  kerala: [10.8505, 76.2711],
  kochi: [9.9312, 76.2673],
  kolkata: [22.5726, 88.3639],
  'west bengal': [22.9868, 87.8550],
  visakhapatnam: [17.6868, 83.2185],
  vizag: [17.6868, 83.2185],
  andaman: [11.7401, 92.6586],
  'port blair': [11.6234, 92.7265],
  nicobar: [7.0, 93.8],
  delhi: [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  drdo: [28.6083, 77.2144],
  isro: [12.9716, 77.5946],
  india: [28.6139, 77.2090],
  indian: [28.6139, 77.2090],
  brasilia: [-15.7975, -47.8919],
  brazil: [-15.7975, -47.8919],
  brazilian: [-15.7975, -47.8919],
  canberra: [-35.2809, 149.1300],
  australia: [-35.2809, 149.1300],
  australian: [-35.2809, 149.1300],

  // ── 6. STRATEGIC MARITIME PASSAGES ──────────────────────────────────────
  'red sea': [20.0, 38.5],
  'persian gulf': [26.0, 52.0],
  'strait of hormuz': [26.56, 56.25],
  'bab el-mandeb': [12.58, 43.33],
  'black sea': [44.0, 35.0],
  'baltic sea': [57.0, 20.0],
  mediterranean: [35.0, 18.0],
  'mediterranean sea': [35.0, 18.0],
  'gulf of aden': [12.5, 48.0],
  'taiwan strait': [24.0, 119.5],

  // ── 7. GLOBAL / TRANSNATIONAL STAGING NODE (OPTION 5) ───────────────────
  'global / strategic': [0.0, -25.0],
  global: [0.0, -25.0],
  transnational: [0.0, -25.0],
  international: [0.0, -25.0],
  un: [40.7489, -73.9680],
  'united nations': [40.7489, -73.9680],
};

export const ALIAS_TO_COUNTRY: Record<string, string> = {
  // Ukraine
  pokrovsk: 'Ukraine',
  'chasiv yar': 'Ukraine',
  toretsk: 'Ukraine',
  kupyansk: 'Ukraine',
  kurakhove: 'Ukraine',
  'velyka novosilka': 'Ukraine',
  vuhledar: 'Ukraine',
  lyman: 'Ukraine',
  robotyne: 'Ukraine',
  avdiivka: 'Ukraine',
  kharkiv: 'Ukraine',
  zaporizhzhia: 'Ukraine',
  kherson: 'Ukraine',
  dnipro: 'Ukraine',
  sumy: 'Ukraine',
  odesa: 'Ukraine',
  kyiv: 'Ukraine',
  ukrainian: 'Ukraine',
  donbas: 'Ukraine',
  donetsk: 'Ukraine',
  luhansk: 'Ukraine',
  crimea: 'Ukraine',
  sevastopol: 'Ukraine',

  // Russia
  belgorod: 'Russia',
  kursk: 'Russia',
  sudzha: 'Russia',
  voronezh: 'Russia',
  rostov: 'Russia',
  moscow: 'Russia',
  kremlin: 'Russia',
  russian: 'Russia',

  // Middle East / Levant
  rafah: 'Gaza',
  'khan younis': 'Gaza',
  'gaza city': 'Gaza',
  jabalia: 'Gaza',
  'deir al-balah': 'Gaza',
  gaza: 'Gaza',
  palestinian: 'Palestine',
  jenin: 'West Bank',
  nablus: 'West Bank',
  tulkarm: 'West Bank',
  hebron: 'West Bank',
  ramallah: 'West Bank',
  jerusalem: 'Israel',
  telaviv: 'Israel',
  'tel aviv': 'Israel',
  haifa: 'Israel',
  israeli: 'Israel',
  idf: 'Israel',
  hamas: 'Gaza',
  'al-qassam': 'Gaza',
  'islamic jihad': 'Gaza',
  dahieh: 'Lebanon',
  beirut: 'Lebanon',
  'bekaa valley': 'Lebanon',
  bekaa: 'Lebanon',
  baalbek: 'Lebanon',
  nabatieh: 'Lebanon',
  tyre: 'Lebanon',
  sidon: 'Lebanon',
  litani: 'Lebanon',
  lebanese: 'Lebanon',
  hezbollah: 'Lebanon',
  zarit: 'Israel',
  'kiryat shmona': 'Israel',
  'golan heights': 'Syria',
  golan: 'Syria',
  damascus: 'Syria',
  aleppo: 'Syria',
  idlib: 'Syria',
  homs: 'Syria',
  latakia: 'Syria',
  tartus: 'Syria',
  syrian: 'Syria',
  hodeidah: 'Yemen',
  sanaa: 'Yemen',
  saada: 'Yemen',
  aden: 'Yemen',
  marib: 'Yemen',
  yemeni: 'Yemen',
  houthi: 'Yemen',
  houthis: 'Yemen',
  'ansar allah': 'Yemen',
  tehran: 'Iran',
  isfahan: 'Iran',
  natanz: 'Iran',
  fordow: 'Iran',
  iranian: 'Iran',
  irgc: 'Iran',
  baghdad: 'Iraq',
  erbil: 'Iraq',
  iraqi: 'Iraq',

  // Africa
  'el fasher': 'Sudan',
  fasher: 'Sudan',
  darfur: 'Sudan',
  khartoum: 'Sudan',
  omdurman: 'Sudan',
  nyala: 'Sudan',
  geneina: 'Sudan',
  'port sudan': 'Sudan',
  sudanese: 'Sudan',
  rsf: 'Sudan',
  'rapid support forces': 'Sudan',
  saf: 'Sudan',
  goma: 'Democratic Republic of Congo',
  'north kivu': 'Democratic Republic of Congo',
  'south kivu': 'Democratic Republic of Congo',
  kivu: 'Democratic Republic of Congo',
  ituri: 'Democratic Republic of Congo',
  beni: 'Democratic Republic of Congo',
  rutshuru: 'Democratic Republic of Congo',
  drc: 'Democratic Republic of Congo',
  'dr congo': 'Democratic Republic of Congo',
  congolese: 'Democratic Republic of Congo',
  m23: 'Democratic Republic of Congo',
  mogadishu: 'Somalia',
  'lower shabelle': 'Somalia',
  galmudug: 'Somalia',
  somali: 'Somalia',
  'al-shabaab': 'Somalia',
  alshabaab: 'Somalia',
  tinzaouaten: 'Mali',
  gao: 'Mali',
  kidal: 'Mali',
  timbuktu: 'Mali',
  malian: 'Mali',
  djibo: 'Burkina Faso',
  soum: 'Burkina Faso',
  tillaberi: 'Niger',
  burkinabe: 'Burkina Faso',
  nigerien: 'Niger',
  chadian: 'Chad',
  'cabo delgado': 'Mozambique',
  palma: 'Mozambique',
  tigray: 'Ethiopia',
  amhara: 'Ethiopia',
  ethiopian: 'Ethiopia',

  // Asia & Americas
  'shan state': 'Myanmar',
  lashio: 'Myanmar',
  rakhine: 'Myanmar',
  sittwe: 'Myanmar',
  mandalay: 'Myanmar',
  sagaing: 'Myanmar',
  burma: 'Myanmar',
  mndaa: 'Myanmar',
  tnla: 'Myanmar',
  tatmadaw: 'Myanmar',
  baluchistan: 'Pakistan',
  balochistan: 'Pakistan',
  torkham: 'Pakistan',
  pakistani: 'Pakistan',
  afghan: 'Afghanistan',
  taliban: 'Afghanistan',
  'second thomas shoal': 'Philippines',
  'spratly islands': 'Philippines',
  'south china sea': 'Maritime & Global',
  filipino: 'Philippines',
  taiwanese: 'Taiwan',
  culiacan: 'Mexico',
  sinaloa: 'Mexico',
  mexican: 'Mexico',
  'port-au-prince': 'Haiti',
  haitian: 'Haiti',

  // Western Powers & Demonyms
  washington: 'United States',
  pentagon: 'United States',
  'white house': 'United States',
  usa: 'United States',
  america: 'United States',
  american: 'United States',
  ottawa: 'Canada',
  canadian: 'Canada',
  london: 'United Kingdom',
  uk: 'United Kingdom',
  britain: 'United Kingdom',
  british: 'United Kingdom',
  paris: 'France',
  french: 'France',
  berlin: 'Germany',
  german: 'Germany',
  brussels: 'Belgium',
  nato: 'Belgium',
  'european union': 'Belgium',
  eu: 'Belgium',
  beijing: 'China',
  chinese: 'China',
  tokyo: 'Japan',
  japanese: 'Japan',
  seoul: 'South Korea',
  korean: 'South Korea',
  pyongyang: 'North Korea',
  delhi: 'India',
  'new delhi': 'India',
  indian: 'India',
  india: 'India',
  ladakh: 'India',
  leh: 'India',
  srinagar: 'India',
  jammu: 'India',
  kashmir: 'India',
  rajouri: 'India',
  poonch: 'India',
  kupwara: 'India',
  anantnag: 'India',
  baramulla: 'India',
  siachen: 'India',
  galwan: 'India',
  pangong: 'India',
  chushul: 'India',
  doklam: 'India',
  loc: 'India',
  lac: 'India',
  manipur: 'India',
  imphal: 'India',
  churachandpur: 'India',
  moreh: 'India',
  arunachal: 'India',
  'arunachal pradesh': 'India',
  tawang: 'India',
  itanagar: 'India',
  assam: 'India',
  guwahati: 'India',
  nagaland: 'India',
  kohima: 'India',
  mizoram: 'India',
  aizawl: 'India',
  tripura: 'India',
  agartala: 'India',
  meghalaya: 'India',
  shillong: 'India',
  bastar: 'India',
  dantewada: 'India',
  sukma: 'India',
  bijapur: 'India',
  chhattisgarh: 'India',
  raipur: 'India',
  jharkhand: 'India',
  ranchi: 'India',
  odisha: 'India',
  bhubaneswar: 'India',
  chandipur: 'India',
  balasore: 'India',
  punjab: 'India',
  amritsar: 'India',
  chandigarh: 'India',
  rajasthan: 'India',
  pokhran: 'India',
  jaisalmer: 'India',
  bikaner: 'India',
  jaipur: 'India',
  mumbai: 'India',
  maharashtra: 'India',
  bengaluru: 'India',
  bangalore: 'India',
  karnataka: 'India',
  hyderabad: 'India',
  telangana: 'India',
  chennai: 'India',
  'tamil nadu': 'India',
  kerala: 'India',
  kochi: 'India',
  kolkata: 'India',
  'west bengal': 'India',
  visakhapatnam: 'India',
  vizag: 'India',
  andaman: 'India',
  'port blair': 'India',
  nicobar: 'India',
  drdo: 'India',
  isro: 'India',
  brasilia: 'Brazil',
  brazilian: 'Brazil',
  canberra: 'Australia',
  australian: 'Australia',

  // Global Node
  'global / strategic': 'Global / Strategic',
  global: 'Global / Strategic',
  transnational: 'Global / Strategic',
  international: 'Global / Strategic',
  un: 'Global / Strategic',
  'united nations': 'Global / Strategic',
};

export interface ExtractedLocation {
  country: string;
  location: string;
  lat: number;
  lon: number;
  isTransnational?: boolean;
}

/**
 * Multi-Tier Geocoding Engine:
 * Tier 1: Uses provider-supplied coordinates if valid.
 * Tier 2: Resolves provider structured country or ISO country code.
 * Tier 3: Scans headline and text for specific combat cities & frontlines.
 * Tier 4: Scans text for military factions, belligerent actors, and demonyms.
 * Tier 5: Scans text for standard country names.
 * Tier 6: Genuinely non-localized / macro-policy articles are assigned to the
 *         Global Strategic Staging Node (Option 5) so 100% of data is plotted!
 */
export function extractLocationAndCoords(
  text: string,
  metadata?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    countryCode?: string;
    location?: string;
  }
): ExtractedLocation {
  // Tier 1: Direct coordinates provided
  if (
    typeof metadata?.latitude === 'number' &&
    !isNaN(metadata.latitude) &&
    typeof metadata?.longitude === 'number' &&
    !isNaN(metadata.longitude) &&
    metadata.latitude !== 0 &&
    metadata.longitude !== 0
  ) {
    const country = metadata.country || 'Global / Strategic';
    return {
      country,
      location: metadata.location || country,
      lat: metadata.latitude,
      lon: metadata.longitude,
    };
  }

  // Tier 2: Structured ISO-2 / ISO-3 country code from provider
  if (metadata?.countryCode) {
    const cleanCode = metadata.countryCode.trim().toLowerCase();
    const match = ISO_COUNTRY_LOOKUP[cleanCode];
    if (match) {
      return {
        country: match.country,
        location: metadata.location || match.country,
        lat: match.lat,
        lon: match.lon,
      };
    }
  }

  // Tier 3: Provider-supplied country name string
  if (metadata?.country && metadata.country.trim() !== '') {
    const lowerProv = metadata.country.trim().toLowerCase();
    if (GLOBAL_COUNTRY_COORDS[lowerProv]) {
      const [lat, lon] = GLOBAL_COUNTRY_COORDS[lowerProv];
      const country = ALIAS_TO_COUNTRY[lowerProv] || metadata.country;
      return {
        country,
        location: metadata.location || country,
        lat,
        lon,
      };
    }
    const isoMatch = ISO_COUNTRY_LOOKUP[lowerProv];
    if (isoMatch) {
      return {
        country: isoMatch.country,
        location: metadata.location || isoMatch.country,
        lat: isoMatch.lat,
        lon: isoMatch.lon,
      };
    }
  }

  // Tier 4 & 5: Text scanning for frontlines, combat cities, actors, and countries
  const fullText = (text || '').toLowerCase();
  if (fullText.trim().length > 0) {
    // Sort keys descending by length so compound names ("el fasher", "bekaa valley") match first
    const sortedKeys = Object.keys(GLOBAL_COUNTRY_COORDS).sort((a, b) => b.length - a.length);

    for (const key of sortedKeys) {
      if (key === 'global' || key === 'international' || key === 'un' || key === 'transnational' || key === 'global / strategic') {
        continue; // check specific geographic places first
      }

      const isMatch = key.length <= 4
        ? new RegExp(`\\b${key}\\b`, 'i').test(fullText)
        : fullText.includes(key);

      if (isMatch) {
        const [lat, lon] = GLOBAL_COUNTRY_COORDS[key];
        const matchedName = key
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const country = ALIAS_TO_COUNTRY[key] || matchedName;
        const location = matchedName !== country ? `${matchedName}, ${country}` : country;
        return {
          country,
          location,
          lat,
          lon,
        };
      }
    }
  }

  // Tier 6: Option 5 Fallback — Global / Transnational Tactical Staging Node
  // Placed in the equatorial Atlantic Ocean staging zone [0.0, -25.0]
  return {
    country: 'Global / Strategic',
    location: 'Global / Transnational Staging Hub',
    lat: 0.0,
    lon: -25.0,
    isTransnational: true,
  };
}

export interface BuildEventParams {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  country?: string;
  countryCode?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  fatalities?: number;
  isConflict?: boolean;
}

/**
 * Builds a valid ConflictEvent with guaranteed numeric coordinates and severity scoring.
 * Jitters coordinates slightly (+/- 0.25 deg) so multiple news reports on the same country/theater
 * plot as distinct, interactive dots on the map.
 */
export function buildConflictEvent(params: BuildEventParams): ConflictEvent | null {
  const text = `${params.title} ${params.description || ''}`;
  const extracted = extractLocationAndCoords(text, {
    latitude: params.latitude,
    longitude: params.longitude,
    country: params.country,
    countryCode: params.countryCode,
    location: params.location,
  });

  const isoDate = params.publishedAt ? new Date(params.publishedAt).toISOString() : new Date().toISOString();
  const eventDate = isoDate.slice(0, 10);

  if (!isWithinWindow(eventDate, 10)) {
    return null;
  }

  const classification = classifyEvent(params.title, params.description);
  const conflict = typeof params.isConflict === 'boolean' ? params.isConflict : classification.isConflict;
  const eventType = classification.category;
  const subEventType = classification.subEventType;
  const fatalities = typeof params.fatalities === 'number' ? params.fatalities : (conflict ? estimateFatalities(text) : 0);

  const severityDetail = calculateSeverity({
    fatalities,
    eventType,
    subEventType,
    eventDate,
    timestamp: isoDate,
  });

  // Deterministic coordinate jitter based on article title/url seed so identical articles don't jump around
  const seed = `${params.url || params.title || ''}`;
  let seedHash = 0;
  for (let i = 0; i < seed.length; i++) {
    seedHash = (seedHash << 5) - seedHash + seed.charCodeAt(i);
    seedHash |= 0;
  }
  const absHash = Math.abs(seedHash);

  // Larger spread for Global / Transnational hub (+/- 3.5 deg) so global dots form an orbital constellation
  const isGlobal = extracted.country === 'Global / Strategic' || extracted.isTransnational;
  const jitterRange = isGlobal ? 4.5 : 0.44;
  const jitterLat = ((absHash % 1000) / 1000 - 0.5) * jitterRange;
  const jitterLon = (((absHash >> 3) % 1000) / 1000 - 0.5) * jitterRange;

  const notes = conflict
    ? `${params.title}. ${params.description ? params.description.slice(0, 250) + '.' : ''} Reported by ${params.source}. ${severityDetail.explanation}.`
    : `${params.title}. ${params.description ? params.description.slice(0, 250) + '.' : ''} Geopolitical dispatch reported by ${params.source}.`;

  const stableId = (params.id || '').replace(/-\d{10,14}$/, '') || `${params.source.toUpperCase().replace(/[^A-Z]/g, '')}-${absHash.toString(36)}`;

  const event: ConflictEvent = {
    id: stableId,
    eventDate,
    publishedAt: isoDate,
    timestamp: isoDate,
    country: extracted.country,
    location: extracted.location || extracted.country,
    region: COUNTRY_TO_REGION[extracted.country] || (isGlobal ? 'Maritime & Global' : 'Other'),
    latitude: extracted.lat + jitterLat,
    longitude: extracted.lon + jitterLon,
    primaryCategory: classification.category,
    categoryConfidence: classification.confidence,
    eventType,
    subEventType,
    fatalities,
    severity: severityDetail.severity,
    isConflict: conflict,
    verificationStatus: conflict ? 'REPORTED' : 'UNCONFIRMED',
    source: params.source,
    sourceUrl: params.url,
    notes,
  };

  if (isHistoricalOrStaleConflict(event)) {
    return null;
  }

  return event;
}

export function estimateFatalities(title: string): number {
  const numMatch = title.match(/(\d+)\s*(?:killed|dead|fatalities|casualties|troops?|soldiers?|fighters?|civilians?)/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    return isNaN(n) ? 0 : Math.min(n, 500);
  }
  if (/\b(massacre|dozens?|scores?|hundreds?)\b/i.test(title)) return 15;
  if (/\bseveral\b/i.test(title)) return 4;
  if (/\bmultiple\b/i.test(title)) return 3;
  return 0;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    method?: string;
    body?: any;
  } = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const { headers = {}, timeoutMs = 12000, method = 'GET', body } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'WarRoom-Geopolitical-Terminal/1.0 (Conflict-Monitoring-Dashboard)',
        Accept: 'application/json, text/plain, */*',
        ...headers,
      },
      signal: controller.signal,
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type']) {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, fetchOptions);
    const text = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: `HTTP ${res.status}: ${text.slice(0, 150)}` };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, data: null, error: `JSON Parse error: ${text.slice(0, 120)}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, data: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Fetches and parses open live RSS/XML feeds into ConflictEvent objects.
 * Enables zero-key hardcoded live intelligence streaming across global pipelines.
 */
export async function fetchOpenRssFeed(
  url: string,
  sourceName: string,
  options: { timeoutMs?: number; maxItems?: number } = {}
): Promise<ConflictEvent[]> {
  const { timeoutMs = 9000, maxItems = 25 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (WarRoom-Feed-Stream/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/plain, */*',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return [];
    }

    const xml = await res.text();
    return parseRssToConflictEvents(xml, sourceName, maxItems);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export function parseRssToConflictEvents(
  xml: string,
  sourceName: string,
  maxItems = 25
): ConflictEvent[] {
  const events: ConflictEvent[] = [];
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && events.length < maxItems) {
    const raw = match[1];

    const titleM = raw.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkM =
      raw.match(/<link[^>]*href=["'](https?[^"']+)["']/i) ||
      raw.match(/<link[^>]*>(?:<!\[CDATA\[)?(https?[^<\]]+)(?:\]\]>)?<\/link>/i) ||
      raw.match(/<guid[^>]*>(?:<!\[CDATA\[)?(https?[^<\]]+)(?:\]\]>)?<\/guid>/i);
    const descM =
      raw.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      raw.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) ||
      raw.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i);
    const dateM =
      raw.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      raw.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i) ||
      raw.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      raw.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);

    if (!titleM || !titleM[1]) continue;

    const cleanTitle = titleM[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]*>/g, '')
      .trim();

    if (!cleanTitle || cleanTitle.length < 5) continue;

    const cleanLink = linkM ? linkM[1].trim() : `https://news.google.com/search?q=${encodeURIComponent(cleanTitle.slice(0, 40))}`;
    const cleanDesc = descM
      ? descM[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#039;/g, "'")
          .replace(/&quot;/g, '"')
          .trim()
      : undefined;

    const pubDate = dateM ? new Date(dateM[1].trim()).toISOString() : new Date().toISOString();

    const ev = buildConflictEvent({
      id: `${sourceName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}-${simpleHash(cleanTitle)}-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      url: cleanLink,
      publishedAt: !isNaN(new Date(pubDate).getTime()) ? pubDate : new Date().toISOString(),
      source: sourceName,
    });

    if (ev) {
      events.push(ev);
    }
  }

  return events;
}
