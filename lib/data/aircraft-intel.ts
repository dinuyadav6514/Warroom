/**
 * Tactical Military Aircraft & Drone Capabilities Intelligence Database
 * Provides deep classification, mission profiles, sensor suites, armaments,
 * and operational flight envelopes for military aircraft and unmanned systems.
 */

export interface AircraftTacticalIntel {
  airframeTypeTitle: string;
  airframeCategoryTag: string;
  isDrone: boolean;
  droneTypeBadge?: string;
  primaryMission: string;
  keyCapabilities: string[];
  sensorsAndAvionics: string;
  armamentAndPayload: string;
  operationalEnvelope: {
    maxCeiling: string;
    endurance: string;
    combatRange: string;
    maxSpeed: string;
  };
  operators: string;
}

interface KnownAirframeRecord {
  title: string;
  categoryTag: string;
  isDrone: boolean;
  droneBadge?: string;
  mission: string;
  capabilities: string[];
  sensors: string;
  armament: string;
  envelope: {
    ceiling: string;
    endurance: string;
    range: string;
    speed: string;
  };
  operators: string;
}

const AIRFRAME_INTEL_REGISTRY: Record<string, KnownAirframeRecord> = {
  // ── 1. STRATEGIC RECONNAISSANCE DRONES (HALE) ─────────────────────────
  'RQ4': {
    title: 'Northrop Grumman RQ-4B Global Hawk',
    categoryTag: 'SURVEILLANCE DRONE (HALE)',
    isDrone: true,
    droneBadge: 'STRATEGIC SURVEILLANCE DRONE (HALE)',
    mission: 'High-Altitude Long-Endurance (HALE) strategic optical, infrared & synthetic aperture radar (SAR) theater surveillance.',
    capabilities: [
      'Synthetic Aperture Radar (SAR) with Ground Moving Target Indicator (GMTI)',
      'High-resolution multi-spectral optical & thermal imaging through cloud cover',
      'Wideband satellite communications for real-time worldwide intelligence relay',
      'Continuous standoff observation of non-permissive borders without entering airspace',
    ],
    sensors: 'AN/ZPY-2 Multi-Platform Radar Insertion (MP-RTIP) AESA radar, Raytheon Enhanced Integrated Sensor Suite (EISS) EO/IR.',
    armament: 'Unarmed; strictly dedicated intelligence, surveillance, target acquisition and reconnaissance (ISTAR) platform.',
    envelope: {
      ceiling: '60,000+ FT (FL600 Stratospheric)',
      endurance: '34+ Hours Continuous Loiter',
      range: '12,300 NM (22,780 km)',
      speed: '340 KTS (629 km/h, Mach 0.55)',
    },
    operators: 'US Air Force (9th Reconnaissance Wing), NATO Alliance Ground Surveillance (AGS Sigonella), Japan Air Self-Defense Force.',
  },
  'GLHX': {
    title: 'Northrop Grumman RQ-4 Global Hawk / Triton',
    categoryTag: 'SURVEILLANCE DRONE (HALE)',
    isDrone: true,
    droneBadge: 'STRATEGIC SURVEILLANCE DRONE (HALE)',
    mission: 'Stratospheric wide-area maritime and land theater surveillance and SIGINT reconnaissance.',
    capabilities: [
      'Active Electronically Scanned Array (AESA) 360° maritime surface radar',
      'Automated Identification System (AIS) vessel tracking and correlation',
      'Stratospheric standoff endurance over contested maritime chokepoints',
    ],
    sensors: 'AN/ZPY-3 Multi-Function Active Sensor (MFAS) 360° AESA radar, electro-optical/infrared ball.',
    armament: 'Unarmed strategic surveillance platform.',
    envelope: {
      ceiling: '56,000 FT (FL560)',
      endurance: '30+ Hours Continuous',
      range: '8,200 NM (15,180 km)',
      speed: '330 KTS (Mach 0.53)',
    },
    operators: 'US Navy (VUP-19), US Air Force, NATO AGS.',
  },

  // ── 2. ARMED ATTACK & RECONNAISSANCE DRONES (MALE) ───────────────────
  'MQ9': {
    title: 'General Atomics MQ-9A Reaper / Predator B',
    categoryTag: 'ARMED ATTACK & RECON DRONE (MALE)',
    isDrone: true,
    droneBadge: 'ARMED STRIKE & RECON DRONE (MALE)',
    mission: 'Medium-Altitude Long-Endurance (MALE) armed precision strike, close air support, and persistent high-value target hunting.',
    capabilities: [
      'Precision air-to-ground surgical strikes with laser and GPS-guided munitions',
      'Multi-Spectral Targeting System (MTS-B) with thermal FLIR & laser target designation',
      'Synthetic Aperture Radar (SAR) with maritime wide-area search modes',
      'Encrypted Ku/Ka-Band Beyond-Line-of-Sight (BLOS) satellite piloting',
    ],
    sensors: 'Raytheon AN/DAS-1 MTS-B EO/IR turret, AN/APY-8 Lynx SAR/GMTI radar, Laser designator/illuminator.',
    armament: 'Up to 8x AGM-114 Hellfire laser-guided missiles, GBU-12 Paveway II laser bombs, GBU-38 JDAM, or AIM-9X air-to-air.',
    envelope: {
      ceiling: '50,000 FT (FL500)',
      endurance: '27 Hours (Clean) / 14 Hours (Full Combat Load)',
      range: '1,000 NM (1,850 km Combat Radius)',
      speed: '240 KTS (445 km/h, Turboprop)',
    },
    operators: 'US Air Force (AFSOC/ACC), Royal Air Force (UK 39 Sqn), French Air Force, Italian Air Force, Royal Netherlands Air Force.',
  },
  'TB2': {
    title: 'Baykar Bayraktar TB2',
    categoryTag: 'TACTICAL ARMED RECON DRONE',
    isDrone: true,
    droneBadge: 'TACTICAL STRIKE & RECON DRONE (MALE)',
    mission: 'Medium-altitude tactical reconnaissance, artillery fire direction, and surgical precision strikes against armor and air defenses.',
    capabilities: [
      'Surgical precision laser-guided micro-munitions strikes on mobile armor and radar units',
      'Real-time encrypted video streaming directly to frontline command centers and artillery batteries',
      'Autonomous navigation, automated takeoff, taxi, and landing without runway arrestor cables',
    ],
    sensors: 'WESCAM MX-15D or Aselsan CATS High-Definition Electro-Optical/Infrared/Laser Designator gimbal.',
    armament: '4x Hardpoints carrying Roketsan MAM-L (thermobaric/HE) & MAM-C laser-guided smart micro-munitions.',
    envelope: {
      ceiling: '25,000 FT (FL250)',
      endurance: '27 Hours Max Loiter',
      range: '160 NM (Line-of-Sight) / Unlimited via Satcom',
      speed: '120 KTS (222 km/h, Rotax 912 engine)',
    },
    operators: 'Ukrainian Armed Forces, Turkish Armed Forces, Polish Armed Forces, Azerbaijan Armed Forces.',
  },

  // ── 3. LOITERING MUNITIONS / KAMIKAZE DRONES ────────────────────────
  'SHAHED': {
    title: 'HESA Shahed-136 / Geran-2',
    categoryTag: 'KAMIKAZE DRONE / LOITERING MUNITION',
    isDrone: true,
    droneBadge: 'ONE-WAY ATTACK / KAMIKAZE DRONE',
    mission: 'One-Way Long-Range Autonomous Saturation Strike against critical infrastructure, radar sites, and fixed installations.',
    capabilities: [
      'Low-radar-cross-section delta-wing composite honeycomb radar-absorbent airframe',
      'Pre-programmed autonomous navigation via commercial & military GNSS with CRPA anti-jamming',
      'Swarm attack capability intended to saturate and deplete expensive surface-to-air missile defenses',
    ],
    sensors: 'Commercial multi-constellation GNSS receiver (GPS/GLONASS), Inertial Measurement Unit (IMU), terrain contour follower.',
    armament: '40–50 kg High-Explosive fragmentation or thermobaric penetrating warhead (Integral to fuselage).',
    envelope: {
      ceiling: '13,000 FT (Typically ingress at 200–500 FT AGL)',
      endurance: '8–10 Hours Flight Time',
      range: '1,000–1,350 NM (1,850–2,500 km)',
      speed: '100 KTS (185 km/h, MD-550 two-stroke piston engine)',
    },
    operators: 'Russian Armed Forces, Islamic Revolutionary Guard Corps (Iran), Houthi Militant Forces.',
  },
  'LANCET': {
    title: 'ZALA Lancet-3',
    categoryTag: 'LOITERING MUNITION / KAMIKAZE DRONE',
    isDrone: true,
    droneBadge: 'TACTICAL KAMIKAZE / LOITERING MUNITION',
    mission: 'Frontline optical hunting and precision kinetic destruction of self-propelled artillery, armor, and air defense radar vehicles.',
    capabilities: [
      'Double X-wing aerodynamic configuration providing extreme agility in terminal attack dives',
      'Man-in-the-loop optical tracking with automated terminal target lock-on (AI optical seeker)',
      'High-explosive anti-tank (HEAT) shaped-charge warhead capable of penetrating armored roof plates',
    ],
    sensors: 'High-definition nose optical/thermal TV seeker with onboard target tracking algorithms.',
    armament: '3–5 kg High-Explosive Shaped Charge (HEAT) or fragmentation warhead.',
    envelope: {
      ceiling: '10,000 FT',
      endurance: '40–60 Minutes Loiter',
      range: '25–40 NM (45–70 km Combat Radius)',
      speed: '160 KTS (Terminal Dive) / 60 KTS (Cruise, Electric Motor)',
    },
    operators: 'Russian Ground Forces, Naval Infantry.',
  },

  // ── 4. SIGNALS INTELLIGENCE & ELECTRONIC WARFARE ─────────────────────
  'R135': {
    title: 'Boeing RC-135W Rivet Joint',
    categoryTag: 'SIGNALS INTELLIGENCE (SIGINT / ELINT)',
    isDrone: false,
    mission: 'Theater-level strategic electronic warfare, radar emitter location, and communication intercepts.',
    capabilities: [
      'Real-time geographic pinpointing of hostile radar emissions (SAM air defense systems)',
      'Intercept and decryption of military communications across full VHF/UHF/Microwave spectrum',
      'Direct real-time datalink dissemination of target coordinates to NATO Combat Air Patrols',
    ],
    sensors: 'Multi-mission Automated Signals Intelligence suite, cheek-mounted antenna arrays, direction-finding radomes.',
    armament: 'Unarmed; operates in friendly/international airspace under electronic warfare standoff umbrella.',
    envelope: {
      ceiling: '42,000 FT (FL420)',
      endurance: '12+ Hours (Unlimited via KC-135 aerial refueling)',
      range: '3,900 NM (6,500 km)',
      speed: '470 KTS (870 km/h, Mach 0.76)',
    },
    operators: 'US Air Force (55th Wing, Offutt AFB), Royal Air Force (51 Sqn, RAF Waddington).',
  },
  'RC135': {
    title: 'Boeing RC-135V/W Rivet Joint',
    categoryTag: 'SIGNALS INTELLIGENCE (SIGINT / ELINT)',
    isDrone: false,
    mission: 'Theater-level electronic warfare, intercepting and analyzing hostile electronic and radar order of battle.',
    capabilities: [
      'Real-time geolocating of enemy air defense radar emitters (SAM sites)',
      'Signals Intelligence (SIGINT) and Communication Intelligence (COMINT) capture',
      'Tactical datalink broadcasting (Link 16) directly to allied strike packages',
    ],
    sensors: 'Advanced Electronic Support Measures (ESM) receiver suite, wideband SIGINT sensors.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '42,000 FT (FL420)',
      endurance: '12+ Hours (Aerial refuelable)',
      range: '3,900 NM',
      speed: '470 KTS (Mach 0.76)',
    },
    operators: 'US Air Force, Royal Air Force.',
  },

  // ── 5. MARITIME PATROL & ANTI-SUBMARINE WARFARE ──────────────────────
  'P8': {
    title: 'Boeing P-8A Poseidon',
    categoryTag: 'MARITIME PATROL & ASW',
    isDrone: false,
    mission: 'Long-range Anti-Submarine Warfare (ASW), Anti-Surface Warfare (ASUW), and ocean intelligence/surveillance.',
    capabilities: [
      'Acoustic underwater submarine tracking via 126+ deployable active/passive sonobuoys',
      'Synthetic Aperture Radar (SAR) maritime surface search and periscope detection mode',
      'Long-range anti-ship missile attack and high-altitude torpedo weapon delivery',
    ],
    sensors: 'Raytheon AN/APY-10 Multi-mission maritime radar, L3 Wescam MX-20HD digital EO/IR turret, ALQ-240 ESM.',
    armament: 'Internal weapons bay: Mk 54 lightweight ASW torpedoes; Wing pylons: AGM-84 Harpoon anti-ship missiles, AGM-158C LRASM.',
    envelope: {
      ceiling: '41,000 FT (FL410)',
      endurance: '10+ Hours (Combat radius 1,200 NM with 4h on-station)',
      range: '4,500 NM (8,300 km)',
      speed: '490 KTS (907 km/h, Mach 0.79)',
    },
    operators: 'US Navy, Royal Air Force, Royal Australian Air Force, Royal Norwegian Air Force, Indian Navy.',
  },
  'P8A': {
    title: 'Boeing P-8A Poseidon',
    categoryTag: 'MARITIME PATROL & ASW',
    isDrone: false,
    mission: 'Maritime patrol, open-ocean anti-submarine warfare, and surface vessel interdiction.',
    capabilities: [
      'Multi-static active coherent acoustic sonobuoy submarine tracking',
      'High-resolution inverse SAR periscope and surface vessel imaging',
      'Direct automated link with allied carrier strike groups and maritime task forces',
    ],
    sensors: 'AN/APY-10 maritime radar, MX-20HD EO/IR sensor ball, electronic support measures.',
    armament: 'Mk 54 torpedoes, depth charges, AGM-84D Harpoon anti-ship missiles.',
    envelope: {
      ceiling: '41,000 FT (FL410)',
      endurance: '10 Hours',
      range: '4,500 NM',
      speed: '490 KTS',
    },
    operators: 'US Navy, RAF, RAAF, Norwegian Air Force.',
  },

  // ── 6. AIRBORNE EARLY WARNING & CONTROL (AWACS) ──────────────────────
  'B703': {
    title: 'Boeing E-3A Sentry (AWACS)',
    categoryTag: 'AIRBORNE EARLY WARNING (AWACS)',
    isDrone: false,
    mission: 'Airborne battle management, theater surveillance, and fighter vectoring/command and control.',
    capabilities: [
      '360-degree all-altitude radar tracking out to 250+ NM (400 km) for low-flying cruise missiles and jets',
      'Simultaneous automated identification and track correlation for over 600 airborne targets',
      'Tactical datalink battle management hub transmitting directly to NATO fighter cockpits',
    ],
    sensors: 'Westinghouse AN/APY-2 rotodome radar (30-foot rotating saucer), AN/APX-103 IFF interrogator.',
    armament: 'Unarmed flying command post.',
    envelope: {
      ceiling: '36,000 FT (FL360)',
      endurance: '11+ Hours (Continuous on-station with tanker aerial refueling)',
      range: '4,000 NM (7,400 km)',
      speed: '460 KTS (850 km/h, Mach 0.74)',
    },
    operators: 'NATO Airborne Early Warning & Control Force (Geilenkirchen), US Air Force, French Air Force, Royal Saudi Air Force.',
  },
  'E3': {
    title: 'Boeing E-3 Sentry (AWACS)',
    categoryTag: 'AIRBORNE EARLY WARNING (AWACS)',
    isDrone: false,
    mission: 'Airborne radar surveillance and battle management.',
    capabilities: [
      'Long-range look-down Doppler radar tracking hostile aircraft and cruise missiles against ground clutter',
      'Tactical air defense sector command and fighter intercept control',
    ],
    sensors: 'AN/APY-1/2 passive/active phased rotodome radar.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '36,000 FT',
      endurance: '11 Hours',
      range: '4,000 NM',
      speed: '460 KTS',
    },
    operators: 'NATO, USAF, RAF, French Air Force.',
  },
  'E7': {
    title: 'Boeing E-7A Wedgetail (AEW&C)',
    categoryTag: 'AIRBORNE EARLY WARNING (AEW&C)',
    isDrone: false,
    mission: 'Next-generation airborne early warning, electronic surveillance, and air-to-air intercept control.',
    capabilities: [
      'Multi-role Electronically Scanned Array (MESA) radar providing simultaneous air and sea surveillance',
      'Direct 360-degree electronic beam steering with zero moving mechanical radar parts',
      'Dedicated integration with 5th-generation F-35 and F-22 stealth fighter data networks',
    ],
    sensors: 'Northrop Grumman MESA L-Band active electronically scanned array radar, integrated IFF.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '41,000 FT (FL410)',
      endurance: '10 Hours',
      range: '3,800 NM',
      speed: '470 KTS',
    },
    operators: 'Royal Australian Air Force, Royal Air Force (UK), US Air Force (Selected E-3 replacement), Turkish Air Force.',
  },

  // ── 7. AERIAL REFUELING TANKERS ──────────────────────────────────────
  'KC35': {
    title: 'Boeing KC-135R Stratotanker',
    categoryTag: 'AERIAL REFUELING TANKER',
    isDrone: false,
    mission: 'Strategic aerial refueling and air mobility projection for NATO combat fighters and bombers.',
    capabilities: [
      'High-speed flying boom fuel transfer delivering up to 1,000 gallons per minute in-flight',
      'Dual multi-point refueling system (MPRS) wing pods for refueling probe-equipped NATO jets',
      'Secondary aeromedical evacuation and priority cargo transport role',
    ],
    sensors: 'Digital flight deck avionics, tactical airborne collision avoidance, secure UHF/satellite radios.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '50,000 FT (FL500)',
      endurance: '8+ Hours',
      range: '1,500 NM with 150,000 lbs fuel transfer capacity',
      speed: '460 KTS (850 km/h, Mach 0.75)',
    },
    operators: 'US Air Force (Air Mobility Command), French Air & Space Force, Turkish Air Force.',
  },
  'K35R': {
    title: 'Boeing KC-135R Stratotanker',
    categoryTag: 'AERIAL REFUELING TANKER',
    isDrone: false,
    mission: 'Air-to-air refueling of combat air patrols and reconnaissance sorties.',
    capabilities: [
      'Flying boom and probe-and-drogue fuel transfer capacity (up to 200,000 lbs JP-8 jet fuel)',
      'Crucial mission enabler keeping combat air patrols airborne across European theater',
    ],
    sensors: 'Avionics modernization suite, weather radar, military tactical datalink.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '50,000 FT',
      endurance: '8+ Hours',
      range: '1,500 NM combat radius',
      speed: '460 KTS',
    },
    operators: 'US Air Force, NATO Allied Air Command.',
  },
  'A332': {
    title: 'Airbus A330-243 MRTT (Voyager Tanker)',
    categoryTag: 'AERIAL REFUELING & TRANSPORT',
    isDrone: false,
    mission: 'Dual-role strategic tanker refueling and military passenger/cargo transport.',
    capabilities: [
      'Simultaneous dual-wing probe-and-drogue refueling pods for Eurofighter and Rafale fighters',
      'Capacity to carry up to 291 troops alongside 111,000 kg of aviation fuel without extra tanks',
    ],
    sensors: 'Fly-by-wire aerial refueling boom system, night vision compatible glass cockpit.',
    armament: 'Unarmed.',
    envelope: {
      ceiling: '41,000 FT',
      endurance: '10+ Hours',
      range: '8,000 NM (Ferry)',
      speed: '475 KTS (Mach 0.82)',
    },
    operators: 'Royal Air Force (Voyager), NATO Multinational MRTT Fleet (MMF), French Air Force (Phénix), RAAF.',
  },

  // ── 8. STRATEGIC HEAVY AIRLIFT ───────────────────────────────────────
  'C17': {
    title: 'Boeing C-17A Globemaster III',
    categoryTag: 'STRATEGIC HEAVY AIRLIFT',
    isDrone: false,
    mission: 'Rapid strategic airlift of combat troops, main battle tanks, and oversized military cargo directly to forward airfields.',
    capabilities: [
      'Direct airlift of 77 metric tons (170,900 lbs) of payload (e.g. M1A2 Abrams tank or 102 paratroopers)',
      'Short-field assault landings on 3,500-foot unpaved dirt and tactical forward runways',
      'In-flight deployable thrust reversers enabling steep, rapid tactical descents into combat zones',
    ],
    sensors: 'AN/APN-241 all-weather precision navigation/weather radar, dual head-up displays (HUD).',
    armament: 'Unarmed; equipped with Directional Infrared Countermeasures (DIRCM) laser missile jammers and flares.',
    envelope: {
      ceiling: '45,000 FT (FL450)',
      endurance: '10 Hours (Aerial refuelable for unlimited endurance)',
      range: '2,420 NM (Full Payload) / 5,600 NM (Ferry)',
      speed: '450 KTS (830 km/h, Mach 0.74)',
    },
    operators: 'US Air Force (AMC), Royal Air Force (99 Sqn), Royal Australian Air Force, Royal Canadian Air Force, NATO Heavy Airlift Wing.',
  },
  'C130': {
    title: 'Lockheed Martin C-130 Hercules / Super Hercules',
    categoryTag: 'TACTICAL TACTICAL AIRLIFT',
    isDrone: false,
    mission: 'Tactical theater transport, paratroop drops, humanitarian assistance, and austere dirt strip cargo delivery.',
    capabilities: [
      'Unsurpassed rough-field operating capability on sand, ice, and unpaved dirt clearings',
      'Low-altitude parachute extraction system (LAPES) cargo delivery without landing',
    ],
    sensors: 'AN/APN-241 radar, digital defensive avionics, FLIR night vision system.',
    armament: 'Transport variants unarmed; equipped with chaff/flare dispensers.',
    envelope: {
      ceiling: '28,000 FT',
      endurance: '8 Hours',
      range: '2,050 NM',
      speed: '310 KTS (Turboprop)',
    },
    operators: 'US Air Force, RAF, French Air Force, 70+ Allied Air Forces.',
  },

  // ── 9. COMBAT & STRIKE FIGHTERS ──────────────────────────────────────
  'F35': {
    title: 'Lockheed Martin F-35 Lightning II',
    categoryTag: '5TH-GEN STEALTH STRIKE FIGHTER',
    isDrone: false,
    mission: '5th-Generation stealth multirole air superiority, deep penetrating precision strike, and electronic attack.',
    capabilities: [
      'Very Low Observable (VLO) stealth radar cross-section (golf-ball radar return size)',
      'Automated sensor fusion combining radar, optical, and electronic intelligence into helmet visor display',
      'Standoff electronic attack and passive detection of enemy integrated air defense radars',
    ],
    sensors: 'AN/APG-81 Active Electronically Scanned Array (AESA) Radar, AN/AAQ-37 360° DAS IR cameras, EOTS targeting turret.',
    armament: 'Internal bay: 2x AIM-120D AMRAAM + 2x GBU-31 JDAM / 8x Small Diameter Bombs; External pylons: AIM-9X, AGM-158 JASSM.',
    envelope: {
      ceiling: '50,000+ FT (FL500)',
      endurance: '3+ Hours (Internal fuel)',
      range: '670 NM Combat Radius / 1,200 NM Ferry',
      speed: '1,060 KTS (1,960 km/h, Mach 1.6 Supersonic)',
    },
    operators: 'US Air Force / Navy / Marine Corps, Royal Air Force, Italian Air Force, Royal Netherlands Air Force, Norwegian Air Force, Israeli Air Force.',
  },
  'F16': {
    title: 'General Dynamics F-16 Fighting Falcon',
    categoryTag: '4TH++ GEN MULTIROLE FIGHTER',
    isDrone: false,
    mission: 'Air superiority, suppression of enemy air defenses (SEAD / Wild Weasel), and all-weather precision strike.',
    capabilities: [
      'High-g dogfighting agility with 9G sustained turn capability and fly-by-wire controls',
      'Beyond-Visual-Range (BVR) radar missile engagement and precision laser/GPS ground targeting',
      'Suppression of Enemy Air Defenses (SEAD) armed with AGM-88 HARM anti-radiation missiles',
    ],
    sensors: 'AN/APG-68 / AN/APG-83 SABR AESA Radar, Sniper Advanced Targeting Pod / Litening Pod.',
    armament: 'M61A1 20mm Vulcan rotary cannon (511 rounds), AIM-120 AMRAAM, AIM-9X, AGM-88 HARM, GBU-39 SDB, JDAM.',
    envelope: {
      ceiling: '50,000+ FT',
      endurance: '3.5 Hours (Drop tanks)',
      range: '480 NM Combat Radius',
      speed: '1,320 KTS (Mach 2.05 Supersonic)',
    },
    operators: 'US Air Force, Ukrainian Air Force, Polish Air Force, Turkish Air Force, Israeli Air Force, Hellenic Air Force.',
  },
  'EUFI': {
    title: 'Eurofighter Typhoon',
    categoryTag: '4TH++ GEN AIR SUPERIORITY FIGHTER',
    isDrone: false,
    mission: 'High-altitude supersonic interception, air superiority, and multirole precision strike.',
    capabilities: [
      'Supercruise capability (sustained Mach 1.2+ flight without afterburner engagement)',
      'Meteor Beyond-Visual-Range ramjet-powered air-to-air missile engagement capability (100+ km)',
      'PIRATE Infrared Search and Track (IRST) passive stealth target acquisition',
    ],
    sensors: 'Captor-E AESA Radar, PIRATE IRST forward-looking infrared system, Praetorian DASS EW defensive suite.',
    armament: '27mm Mauser BK-27 cannon, Meteor BVR missiles, AIM-120 AMRAAM, ASRAAM, Storm Shadow cruise missiles, Brimstone.',
    envelope: {
      ceiling: '55,000 FT',
      endurance: '3.5 Hours',
      range: '750 NM Combat Radius',
      speed: '1,350 KTS (Mach 2.0 Supersonic)',
    },
    operators: 'Royal Air Force (UK), German Luftwaffe, Italian Air Force, Spanish Air Force, Austrian Air Force.',
  },
  'RFL': {
    title: 'Dassault Rafale',
    categoryTag: '4TH++ GEN OMNIROLE FIGHTER',
    isDrone: false,
    mission: 'Omnirole air defense, deep interdiction, reconnaissance, and maritime carrier strike.',
    capabilities: [
      'Simultaneous multi-target Beyond-Visual-Range engagement with Meteor air-to-air missiles',
      'SPECTRA integrated electronic warfare suite providing active radar cancellation and jamming',
      'Heavy standoff payload delivery including SCALP-EG cruise missiles and AM39 Exocet anti-ship missiles',
    ],
    sensors: 'Thales RBE2 Active Electronically Scanned Array (AESA) radar, Front Sector Optronics (FSO) TV/laser sensor, SPECTRA EW.',
    armament: '30mm GIAT 30/M791 cannon (125 rounds), Meteor, MICA IR/EM, SCALP-EG cruise missiles, Hammer precision-guided bombs.',
    envelope: {
      ceiling: '50,000 FT',
      endurance: '3.5 Hours',
      range: '950 NM Combat Radius',
      speed: '1,190 KTS (Mach 1.8)',
    },
    operators: 'French Air & Space Force, French Navy, Greek Air Force, Indian Air Force, Croatian Air Force.',
  },
};

/**
 * Returns comprehensive tactical intelligence, classification, mission, sensors,
 * armament, and flight envelope for any detected military aircraft or drone.
 */
export function getAircraftTacticalIntel(
  typeCode?: string,
  callsign?: string,
  modelDescription?: string,
  category?: string
): AircraftTacticalIntel {
  const cleanType = (typeCode || '').trim().toUpperCase();
  const cleanCs = (callsign || '').trim().toUpperCase();
  const cleanModel = (modelDescription || '').toLowerCase();
  const cleanCat = (category || '').toUpperCase();

  // 1. Direct registry hit by Type Code
  if (cleanType && AIRFRAME_INTEL_REGISTRY[cleanType]) {
    const r = AIRFRAME_INTEL_REGISTRY[cleanType];
    return {
      airframeTypeTitle: r.title,
      airframeCategoryTag: r.categoryTag,
      isDrone: r.isDrone,
      droneTypeBadge: r.droneBadge,
      primaryMission: r.mission,
      keyCapabilities: r.capabilities,
      sensorsAndAvionics: r.sensors,
      armamentAndPayload: r.armament,
      operationalEnvelope: {
        maxCeiling: r.envelope.ceiling,
        endurance: r.envelope.endurance,
        combatRange: r.envelope.range,
        maxSpeed: r.envelope.speed,
      },
      operators: r.operators,
    };
  }

  // 2. Drone detection via Callsign, Model Description, or Type Code
  const isDroneByCallsign =
    cleanCs.startsWith('FORTE') ||
    cleanCs.startsWith('UAV') ||
    cleanCs.startsWith('REAP') ||
    cleanCs.startsWith('BLK') ||
    cleanCs.startsWith('TB2') ||
    cleanCs.startsWith('SHAH') ||
    cleanCs.startsWith('GERAN') ||
    cleanCs.startsWith('ANGOLA') ||
    cleanCs.startsWith('GHOST');

  const isDroneByModel =
    cleanModel.includes('drone') ||
    cleanModel.includes('uav') ||
    cleanModel.includes('reaper') ||
    cleanModel.includes('global hawk') ||
    cleanModel.includes('shahed') ||
    cleanModel.includes('bayraktar') ||
    cleanModel.includes('unmanned');

  if (cleanCs.startsWith('FORTE') || cleanModel.includes('global hawk')) {
    const r = AIRFRAME_INTEL_REGISTRY['RQ4'];
    return {
      airframeTypeTitle: r.title,
      airframeCategoryTag: r.categoryTag,
      isDrone: true,
      droneTypeBadge: r.droneBadge,
      primaryMission: r.mission,
      keyCapabilities: r.capabilities,
      sensorsAndAvionics: r.sensors,
      armamentAndPayload: r.armament,
      operationalEnvelope: {
        maxCeiling: r.envelope.ceiling,
        endurance: r.envelope.endurance,
        combatRange: r.envelope.range,
        maxSpeed: r.envelope.speed,
      },
      operators: r.operators,
    };
  }

  if (cleanCs.startsWith('SHAH') || cleanCs.startsWith('GERAN') || cleanModel.includes('shahed') || cleanModel.includes('loitering')) {
    const r = AIRFRAME_INTEL_REGISTRY['SHAHED'];
    return {
      airframeTypeTitle: r.title,
      airframeCategoryTag: r.categoryTag,
      isDrone: true,
      droneTypeBadge: r.droneBadge,
      primaryMission: r.mission,
      keyCapabilities: r.capabilities,
      sensorsAndAvionics: r.sensors,
      armamentAndPayload: r.armament,
      operationalEnvelope: {
        maxCeiling: r.envelope.ceiling,
        endurance: r.envelope.endurance,
        combatRange: r.envelope.range,
        maxSpeed: r.envelope.speed,
      },
      operators: r.operators,
    };
  }

  if (cleanCs.startsWith('TB2') || cleanModel.includes('bayraktar')) {
    const r = AIRFRAME_INTEL_REGISTRY['TB2'];
    return {
      airframeTypeTitle: r.title,
      airframeCategoryTag: r.categoryTag,
      isDrone: true,
      droneTypeBadge: r.droneBadge,
      primaryMission: r.mission,
      keyCapabilities: r.capabilities,
      sensorsAndAvionics: r.sensors,
      armamentAndPayload: r.armament,
      operationalEnvelope: {
        maxCeiling: r.envelope.ceiling,
        endurance: r.envelope.endurance,
        combatRange: r.envelope.range,
        maxSpeed: r.envelope.speed,
      },
      operators: r.operators,
    };
  }

  if (isDroneByCallsign || isDroneByModel) {
    // Attack / Recon Drone default (Reaper class)
    const r = AIRFRAME_INTEL_REGISTRY['MQ9'];
    return {
      airframeTypeTitle: modelDescription || 'General Atomics MQ-9A Reaper (UAV)',
      airframeCategoryTag: 'ARMED ATTACK & RECON DRONE (MALE)',
      isDrone: true,
      droneTypeBadge: 'UNMANNED COMBAT AIR VEHICLE (UCAV)',
      primaryMission: 'Persistent unmanned armed reconnaissance, close air support, and surgical precision standoff strikes.',
      keyCapabilities: [
        'High-definition FLIR thermal optical targeting turret with laser designation',
        'Precision surgical strikes with AGM-114 Hellfire laser-guided missiles',
        'Satellite Beyond-Line-of-Sight (BLOS) datalink with 24+ hour continuous orbit',
        'Low acoustic and radar cross-section optimized for loitering over combat sectors',
      ],
      sensorsAndAvionics: 'MTS-B Electro-Optical/Infrared Turret, Lynx Synthetic Aperture Radar (SAR/GMTI).',
      armamentAndPayload: 'Up to 8x AGM-114 Hellfire air-to-ground missiles, GBU-12 laser bombs, or GBU-38 JDAM.',
      operationalEnvelope: {
        maxCeiling: '50,000 FT (FL500)',
        endurance: '24+ Hours Loiter',
        combatRange: '1,000 NM (1,850 km)',
        maxSpeed: '240 KTS (445 km/h)',
      },
      operators: 'US Air Force, NATO Allied Air Forces, Special Operations Command (AFSOC).',
    };
  }

  // 3. Fallback synthesis by category
  if (cleanCat === 'RECON_ISR' || cleanCs.startsWith('HOMER') || cleanCs.startsWith('JAKE')) {
    const r = AIRFRAME_INTEL_REGISTRY['R135'];
    return {
      airframeTypeTitle: modelDescription || 'Strategic Reconnaissance Platform (ISR)',
      airframeCategoryTag: 'SIGNALS INTELLIGENCE (SIGINT / ELINT)',
      isDrone: false,
      primaryMission: 'Strategic optical, radar, and signals intelligence reconnaissance across theater borders.',
      keyCapabilities: [
        'Automated direction-finding and electronic intelligence mapping of hostile radar networks',
        'Real-time communications intercept and decryption across military spectrums',
        'Standoff intelligence relay directly to combat operations centers',
      ],
      sensorsAndAvionics: 'High-sensitivity electronic warfare receiver antennas, optical sensor suites.',
      armamentAndPayload: 'Unarmed; operates under friendly fighter escort protection.',
      operationalEnvelope: {
        maxCeiling: '42,000 FT',
        endurance: '12+ Hours',
        combatRange: '3,500 NM',
        maxSpeed: '460 KTS',
      },
      operators: 'NATO Air Command, US Air Force, Allied Strategic Reconnaissance Wings.',
    };
  }

  if (cleanCat === 'AIRBORNE_EARLY_WARNING' || cleanCs.startsWith('NATO') || cleanCs.startsWith('SENTRY')) {
    const r = AIRFRAME_INTEL_REGISTRY['B703'];
    return {
      airframeTypeTitle: modelDescription || 'Airborne Early Warning & Control (AWACS)',
      airframeCategoryTag: 'AIRBORNE EARLY WARNING (AWACS)',
      isDrone: false,
      primaryMission: 'All-altitude 360-degree radar tracking, early warning of cruise missiles/jets, and fighter vectoring.',
      keyCapabilities: [
        'Long-range 360° pulse-Doppler radar tracking hundreds of air/sea targets simultaneously',
        'Identification Friend or Foe (IFF) and tactical datalink (Link 16) battle management',
      ],
      sensorsAndAvionics: 'Rotodome active/passive surveillance radar, ESM receivers.',
      armamentAndPayload: 'Unarmed flying command and control post.',
      operationalEnvelope: {
        maxCeiling: '36,000 FT',
        endurance: '11+ Hours',
        combatRange: '4,000 NM',
        maxSpeed: '460 KTS',
      },
      operators: 'NATO E-3A Component, Allied Air Commands.',
    };
  }

  if (cleanCat === 'TANKER_REFUEL' || cleanCs.startsWith('LAGR') || cleanCs.startsWith('QUID')) {
    const r = AIRFRAME_INTEL_REGISTRY['KC35'];
    return {
      airframeTypeTitle: modelDescription || 'Strategic Aerial Refueling Tanker',
      airframeCategoryTag: 'AERIAL REFUELING TANKER (AAR)',
      isDrone: false,
      primaryMission: 'In-flight refueling of allied strike fighters, bombers, and reconnaissance sorties to extend mission loiter.',
      keyCapabilities: [
        'High-capacity flying boom and drogue fuel delivery transferring thousands of gallons per minute',
        'Force multiplier enabling uninterrupted 24/7 air patrols over contested regions',
      ],
      sensorsAndAvionics: 'Specialized aerial refueling observation systems, military communications suite.',
      armamentAndPayload: 'Unarmed.',
      operationalEnvelope: {
        maxCeiling: '50,000 FT',
        endurance: '8+ Hours',
        combatRange: '1,500 NM Refueling Radius',
        maxSpeed: '460 KTS',
      },
      operators: 'US Air Force (AMC), NATO Allied Air Forces.',
    };
  }

  if (cleanCat === 'TRANSPORT_CARGO' || cleanCs.startsWith('RCH') || cleanCs.startsWith('MOOSE')) {
    const r = AIRFRAME_INTEL_REGISTRY['C17'];
    return {
      airframeTypeTitle: modelDescription || 'Strategic Heavy Airlifter / Cargo',
      airframeCategoryTag: 'STRATEGIC HEAVY AIRLIFT',
      isDrone: false,
      primaryMission: 'Rapid worldwide strategic delivery of combat armor, weapons, munitions, and troops to austere runways.',
      keyCapabilities: [
        'Heavy intercontinental payload capacity carrying tanks, helicopters, or 100+ paratroopers',
        'Tactical short-runway assault landing capability on rough forward airfields',
      ],
      sensorsAndAvionics: 'All-weather digital weather/navigation radar, defensive electronic countermeasures.',
      armamentAndPayload: 'Unarmed; equipped with chaff and infrared flare dispensers.',
      operationalEnvelope: {
        maxCeiling: '45,000 FT',
        endurance: '10 Hours',
        combatRange: '2,500 NM (Payload) / 5,500 NM (Ferry)',
        maxSpeed: '450 KTS',
      },
      operators: 'US Air Force, Royal Air Force, Allied Strategic Airlift Squadrons.',
    };
  }

  if (cleanCat === 'FIGHTER_STRIKE' || cleanCs.startsWith('VIPER') || cleanCs.startsWith('STRIKE')) {
    const r = AIRFRAME_INTEL_REGISTRY['F16'];
    return {
      airframeTypeTitle: modelDescription || 'Multirole Combat Strike Fighter',
      airframeCategoryTag: 'AIR SUPERIORITY & STRIKE FIGHTER',
      isDrone: false,
      primaryMission: 'Air-to-air combat air patrol, hostile aircraft interception, and precision surface strike.',
      keyCapabilities: [
        'Beyond-Visual-Range (BVR) radar-guided missile engagement',
        'Extreme tactical maneuverability and high supersonic acceleration',
        'Precision all-weather ground attack with laser and satellite-guided ordnance',
      ],
      sensorsAndAvionics: 'AESA / Multi-mode Pulse-Doppler Radar, Advanced Targeting Pod, RWR suite.',
      armamentAndPayload: 'Internal cannon, AIM-120 AMRAAM, Sidewinder, precision JDAM / laser bombs.',
      operationalEnvelope: {
        maxCeiling: '50,000+ FT',
        endurance: '3+ Hours',
        combatRange: '500 NM Combat Radius',
        maxSpeed: 'Mach 1.8+ Supersonic',
      },
      operators: 'NATO Air Policing, Allied Combat Air Squadrons.',
    };
  }

  // Generic Military Aircraft fallback
  return {
    airframeTypeTitle: modelDescription || `Military Aircraft (${cleanType || 'MIL'})`,
    airframeCategoryTag: cleanCat ? cleanCat.replace('_', ' ') : 'MILITARY SORTIE',
    isDrone: false,
    primaryMission: 'Operational military flight tasking under national and NATO air tasking orders.',
    keyCapabilities: [
      'Military transponder (Mode-S / IFF) active radar tracking',
      'Tactical communications link with military air traffic control centers',
      'Standardized military flight envelope and assigned operational corridors',
    ],
    sensorsAndAvionics: 'Military aviation radar, situational awareness transponder systems.',
    armamentAndPayload: 'Configured in accordance with operational mission directive.',
    operationalEnvelope: {
      maxCeiling: '40,000+ FT',
      endurance: '6+ Hours',
      combatRange: '2,000 NM',
      maxSpeed: '400+ KTS',
    },
    operators: 'Allied Armed Forces / Defense Ministries.',
  };
}
