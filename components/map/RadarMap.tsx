'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapLegend } from './MapLegend';

interface RadarMapProps {
  aviationGeoJson: any;
  aviationCount?: number;
  isAviationLoading?: boolean;
  targetLocation?: [number, number] | null;
  selectedAircraft?: any | null;
  onSelectAircraft?: (aircraft: any | null) => void;
}

interface LivePlaneState {
  id: string;
  hex: string;
  callsign: string;
  registration?: string;
  typeCode?: string;
  modelDescription?: string;
  category: string;
  color: string;
  iconName: string;
  squawk?: string;
  altitudeFt: number | string;
  altitudeLabel: string;
  speedKnots: number;
  trackDeg: number;
  curLng: number;
  curLat: number;
  curTrack: number;
  fixedPathWaypoints: [number, number][]; // Static geographical coordinates, never move!
  originName: string;
  originCoord: [number, number];          // Static origin location on the ground
  history: [number, number][];            // Static recorded breadcrumbs
}

const TACTICAL_LOCK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Ccircle cx='14' cy='14' r='11' stroke='%2300f0ff' stroke-width='1.5' fill='none' stroke-dasharray='4 3'/%3E%3Ccircle cx='14' cy='14' r='3' fill='%2300f0ff'/%3E%3Cline x1='14' y1='0' x2='14' y2='6' stroke='%2300f0ff' stroke-width='1.5'/%3E%3Cline x1='14' y1='22' x2='14' y2='28' stroke='%2300f0ff' stroke-width='1.5'/%3E%3Cline x1='0' y1='14' x2='6' y2='14' stroke='%2300f0ff' stroke-width='1.5'/%3E%3Cline x1='22' y1='14' x2='28' y2='14' stroke='%2300f0ff' stroke-width='1.5'/%3E%3C/svg%3E") 14 14, crosshair`;

// Cruise velocity factor for smooth, visible live movement across the radar scope
const SPEED_FACTOR = 8.0;

/** Computes static historical waypoints anchored to permanent geographic coordinates on Earth */
function generateStaticFlightPath(
  initLng: number,
  initLat: number,
  initTrack: number,
  callsign: string
): {
  originName: string;
  originCoord: [number, number];
  fixedPathWaypoints: [number, number][];
} {
  const cs = (callsign || '').toUpperCase();
  let originName = 'TACTICAL DEPARTURE AIRSPACE';
  let waypoints: [number, number][] = [];

  // Authentic operational military mission corridors
  if (cs.startsWith('FORTE')) {
    originName = 'NAS SIGONELLA (SICILY)';
    waypoints = [
      [14.92, 37.40],
      [18.20, 37.90],
      [21.60, 39.10],
      [24.80, 40.80],
      [27.60, 42.40],
      [29.80, 43.60],
      [31.20, 44.10],
      [32.80, 44.40],
      [initLng, initLat],
    ];
  } else if (cs.startsWith('NATO')) {
    originName = 'NATO AIR BASE GEILENKIRCHEN';
    waypoints = [
      [6.04, 50.96],
      [10.40, 51.90],
      [14.80, 52.20],
      [18.60, 52.60],
      [21.80, 53.20],
      [22.80, 53.90],
      [initLng, initLat],
    ];
  } else if (cs.startsWith('LAGR')) {
    originName = 'RAF MILDENHALL (100TH ARW)';
    waypoints = [
      [0.48, 52.36],
      [4.20, 53.10],
      [8.80, 53.80],
      [15.40, 51.50],
      [22.20, 47.80],
      [27.40, 45.60],
      [initLng, initLat],
    ];
  } else if (cs.startsWith('PELICAN')) {
    originName = 'NAS SIGONELLA (VP-45)';
    waypoints = [
      [14.92, 37.40],
      [19.40, 36.20],
      [24.80, 34.60],
      [29.20, 34.10],
      [33.40, 33.90],
      [initLng, initLat],
    ];
  } else if (cs.startsWith('RRR') || cs.startsWith('HOMER')) {
    originName = 'RAF WADDINGTON (51 SQN)';
    waypoints = [
      [-0.52, 53.16],
      [4.80, 54.20],
      [12.40, 55.10],
      [18.20, 55.80],
      [initLng, initLat],
    ];
  } else if (cs.startsWith('RCH') || cs.startsWith('MOOSE')) {
    originName = 'RAMSTEIN AIR BASE (86TH AW)';
    waypoints = [
      [7.60, 49.43],
      [11.80, 49.60],
      [16.40, 50.10],
      [21.20, 50.40],
      [initLng, initLat],
    ];
  } else {
    // Generate static historical corridor anchored to geographic earth coordinates
    const revRad = ((initTrack + 180) % 360) * (Math.PI / 180);
    originName = 'AIRSPACE DEPARTURE CORRIDOR';
    const numPoints = 8;
    for (let i = numPoints; i >= 1; i--) {
      const distDeg = i * 0.28;
      const curve = Math.sin(i * 0.6) * 0.08;
      const wLat = initLat + Math.cos(revRad) * distDeg + curve * 0.5;
      const cosLat = Math.cos((initLat * Math.PI) / 180);
      const wLng = initLng + (Math.sin(revRad) * distDeg) / Math.max(Math.abs(cosLat), 0.2) + curve;
      waypoints.push([wLng, wLat]);
    }
    waypoints.push([initLng, initLat]);
  }

  return {
    originName,
    originCoord: waypoints[0],
    fixedPathWaypoints: waypoints,
  };
}

/** Constructs complete military flight path (STATIC origin & past waypoints + LIVE moving plane tip + projected forward vector) */
function buildCompleteFlightPathGeoJson(livePlane: LivePlaneState): any {
  if (!livePlane) return { type: 'FeatureCollection', features: [] };

  const curLng = livePlane.curLng;
  const curLat = livePlane.curLat;
  const track = livePlane.curTrack;
  const color = livePlane.color || '#06b6d4';

  // Flown route: STATIC fixed historical route + STATIC recorded breadcrumbs + LIVE aircraft tip
  const flownCoordinates: [number, number][] = [
    ...(livePlane.fixedPathWaypoints || []),
    ...(livePlane.history || []),
    [curLng, curLat],
  ];

  // Projected forward path (anchored at current plane tip pointing ahead)
  const fwdRad = (track * Math.PI) / 180;
  const cosLat = Math.cos((curLat * Math.PI) / 180);
  const projectedCoordinates: [number, number][] = [
    [curLng, curLat],
    [curLng + (Math.sin(fwdRad) * 0.35) / Math.max(Math.abs(cosLat), 0.2), curLat + Math.cos(fwdRad) * 0.35],
    [curLng + (Math.sin(fwdRad) * 0.70) / Math.max(Math.abs(cosLat), 0.2), curLat + Math.cos(fwdRad) * 0.70],
    [curLng + (Math.sin(fwdRad) * 1.05) / Math.max(Math.abs(cosLat), 0.2), curLat + Math.cos(fwdRad) * 1.05],
  ];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: flownCoordinates },
        properties: { type: 'FLOWN_PATH', color },
      },
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: projectedCoordinates },
        properties: { type: 'PROJECTED_PATH', color },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: livePlane.originCoord || flownCoordinates[0] },
        properties: { type: 'ORIGIN', color, originName: livePlane.originName },
      },
    ],
  };
}

export const RadarMap: React.FC<RadarMapProps> = ({
  aviationGeoJson,
  aviationCount = 0,
  isAviationLoading = false,
  targetLocation,
  selectedAircraft = null,
  onSelectAircraft,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const maplibreModuleRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Live flight kinematics tracking map
  const planesRef = useRef<Map<string, LivePlaneState>>(new Map());
  const selectedAircraftRef = useRef<any>(null);
  selectedAircraftRef.current = selectedAircraft;

  const animFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const historySampleTimeRef = useRef<number>(performance.now());

  // Radiating beacon reference
  const beaconMarkerRef = useRef<any>(null);
  const beaconElementRef = useRef<HTMLDivElement | null>(null);

  const setRadiatingBeacon = useCallback((lng: number, lat: number, color = '#06b6d4') => {
    if (!mapInstanceRef.current || !maplibreModuleRef.current) return;
    const map = mapInstanceRef.current;
    const maplibre = maplibreModuleRef.current;

    if (beaconMarkerRef.current) {
      beaconMarkerRef.current.remove();
      beaconMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.className = 'tactical-radiating-beacon';
    el.style.setProperty('--beacon-color', color);
    beaconElementRef.current = el;

    beaconMarkerRef.current = new maplibre.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([lng, lat])
      .addTo(map);
  }, []);

  const removeRadiatingBeacon = useCallback(() => {
    if (beaconMarkerRef.current) {
      beaconMarkerRef.current.remove();
      beaconMarkerRef.current = null;
    }
  }, []);

  // Free ArcGIS Dark Basemap
  const darkBasemapStyle = {
    version: 8,
    sources: {
      'esri-dark-base': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '&copy; Esri, OpenStreetMap contributors',
      },
      'esri-dark-ref': {
        type: 'raster',
        tiles: [
          'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'esri-dark-base-layer',
        type: 'raster',
        source: 'esri-dark-base',
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: 'esri-dark-ref-layer',
        type: 'raster',
        source: 'esri-dark-ref',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  // Helper to generate directional tactical military aircraft icons pointing North (0 deg)
  const registerMilitaryAircraftIcons = (map: any) => {
    type AirframeShape =
      | 'plane-fighter'
      | 'plane-drone-recon'
      | 'plane-drone-strike'
      | 'plane-drone-kamikaze'
      | 'plane-awacs'
      | 'plane-tanker'
      | 'plane-transport'
      | 'plane-recon'
      | 'plane-default';

    const createAircraftImage = (shape: AirframeShape) => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.shadowBlur = 0; // Crisp game-style tactical rendering - NO neon blur

      if (shape === 'plane-fighter') {
        // Modern Supersonic Combat Fighter (Delta/Swept wings, wingtip missile rails, dual tail fins)
        ctx.fillStyle = '#64748b'; // Low-vis military ghost grey
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(2.5, -12);
        ctx.lineTo(6, -4);
        ctx.lineTo(17, 8); // Right wingtip
        ctx.lineTo(17, 13); // Right missile rail
        ctx.lineTo(15, 13);
        ctx.lineTo(5, 7); // Wing root
        ctx.lineTo(6, 19); // Right canted tail fin
        ctx.lineTo(3, 20); // Right engine exhaust
        ctx.lineTo(0, 17); // Fuselage center notch
        ctx.lineTo(-3, 20); // Left engine exhaust
        ctx.lineTo(-6, 19); // Left canted tail fin
        ctx.lineTo(-5, 7); // Wing root
        ctx.lineTo(-15, 13);
        ctx.lineTo(-17, 13); // Left missile rail
        ctx.lineTo(-17, 8); // Left wingtip
        ctx.lineTo(-6, -4);
        ctx.lineTo(-2.5, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Wingtip air-to-air missile rails (tactical red ordance)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(16, 7, 2, 6);
        ctx.fillRect(-18, 7, 2, 6);

        // Cockpit canopy (dark HUD visor with reflection)
        ctx.beginPath();
        ctx.ellipse(0, -11, 2.2, 5.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Forward HUD velocity tick
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.lineTo(0, -30);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-drone-recon') {
        // High-Altitude Long-Endurance HALE Drone (RQ-4 Global Hawk: ultra-long glider wings, SATCOM nose, V-tail)
        ctx.fillStyle = '#94a3b8'; // Tactical UAS matte slate
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.arc(0, -19, 3.5, Math.PI, 0, false); // Bulbous SATCOM nose
        ctx.lineTo(2.5, -3);
        ctx.lineTo(27, -1); // High-aspect right glider wing
        ctx.lineTo(27, 2);
        ctx.lineTo(2.5, 3);
        ctx.lineTo(3, 17);
        ctx.lineTo(8, 22); // Right V-tail
        ctx.lineTo(5, 23);
        ctx.lineTo(0, 19);
        ctx.lineTo(-5, 23);
        ctx.lineTo(-8, 22); // Left V-tail
        ctx.lineTo(-3, 17);
        ctx.lineTo(-2.5, 3);
        ctx.lineTo(-27, 2);
        ctx.lineTo(-27, -1); // High-aspect left glider wing
        ctx.lineTo(-2.5, -3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Forward SATCOM fairing
        ctx.beginPath();
        ctx.ellipse(0, -10, 2.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // ISR Optical/Radar Sensor Turret (Cyan reconnaissance indicator)
        ctx.beginPath();
        ctx.arc(0, -17, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Forward HUD velocity tick
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(0, -28);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-drone-strike') {
        // Armed MALE Strike Drone (MQ-9 Reaper / Bayraktar TB2: weapons pylons, inverted V-tail, pusher prop)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.arc(0, -18, 3, Math.PI, 0, false);
        ctx.lineTo(2.2, -2);
        ctx.lineTo(23, 0); // Right wing
        ctx.lineTo(23, 3);
        ctx.lineTo(2.2, 4);
        ctx.lineTo(2.5, 17);
        ctx.lineTo(7, 22); // Inverted V-tail
        ctx.lineTo(5, 23);
        ctx.lineTo(0, 20); // Pusher engine hub
        ctx.lineTo(-5, 23);
        ctx.lineTo(-7, 22);
        ctx.lineTo(-2.5, 17);
        ctx.lineTo(-2.2, 4);
        ctx.lineTo(-23, 3);
        ctx.lineTo(-23, 0); // Left wing
        ctx.lineTo(-2.2, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Underwing Hellfire missile rails (Amber strike payload)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(11, 2, 2.5, 5);
        ctx.fillRect(-13.5, 2, 2.5, 5);

        // Nose FLIR camera sphere
        ctx.beginPath();
        ctx.arc(0, -16, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();

        // Rear pusher propeller icon
        ctx.beginPath();
        ctx.moveTo(-4, 21);
        ctx.lineTo(4, 21);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(0, -27);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-drone-kamikaze') {
        // Loitering Munition / Kamikaze Drone (Shahed-136 / Lancet: cropped delta dart, wingtip endplates)
        ctx.fillStyle = '#475569'; // Drab tactical camo
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -22); // Sharp needle nose
        ctx.lineTo(3, -12);
        ctx.lineTo(19, 15); // Right delta wingtip
        ctx.lineTo(19, 19); // Wingtip stabilizer
        ctx.lineTo(16, 17);
        ctx.lineTo(3, 17);
        ctx.lineTo(0, 19); // Pusher motor
        ctx.lineTo(-3, 17);
        ctx.lineTo(-16, 17);
        ctx.lineTo(-19, 19);
        ctx.lineTo(-19, 15); // Left delta wingtip
        ctx.lineTo(-3, -12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // High-threat tactical warning chevron
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(0, 0);
        ctx.lineTo(5, 5);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(0, -28);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-awacs') {
        // Airborne Early Warning & Control (E-3 Sentry: heavy jet + 30ft rotating rotodome radar disc)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(4, -6);
        ctx.lineTo(24, 7); // Right swept wing
        ctx.lineTo(23, 11);
        ctx.lineTo(4.5, 8);
        ctx.lineTo(4.5, 18);
        ctx.lineTo(12, 23);
        ctx.lineTo(12, 25);
        ctx.lineTo(0, 23);
        ctx.lineTo(-12, 25);
        ctx.lineTo(-12, 23);
        ctx.lineTo(-4.5, 18);
        ctx.lineTo(-4.5, 8);
        ctx.lineTo(-23, 11);
        ctx.lineTo(-24, 7); // Left swept wing
        ctx.lineTo(-4, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4 Underwing Turbofan Engines
        ctx.fillStyle = '#334155';
        ctx.fillRect(10, 4, 3, 7);
        ctx.fillRect(16, 7, 3, 6);
        ctx.fillRect(-13, 4, 3, 7);
        ctx.fillRect(-19, 7, 3, 6);

        // Prominent Rotating Radar Rotodome Disc over fuselage
        ctx.beginPath();
        ctx.ellipse(0, 3, 10, 5.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#eab308'; // Tactical gold
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Rotodome crosshair scanner lines
        ctx.beginPath();
        ctx.moveTo(-7, 3);
        ctx.lineTo(7, 3);
        ctx.moveTo(0, -1.5);
        ctx.lineTo(0, 7.5);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -29);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-tanker') {
        // Aerial Refueling Tanker (KC-135 Stratotanker: heavy swept wing + aft flying boom)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(4, -6);
        ctx.lineTo(24, 6);
        ctx.lineTo(23, 10);
        ctx.lineTo(4, 7);
        ctx.lineTo(4, 18);
        ctx.lineTo(11, 23);
        ctx.lineTo(11, 25);
        ctx.lineTo(0, 23);
        ctx.lineTo(-11, 25);
        ctx.lineTo(-11, 23);
        ctx.lineTo(-4, 18);
        ctx.lineTo(-4, 7);
        ctx.lineTo(-23, 10);
        ctx.lineTo(-24, 6);
        ctx.lineTo(-4, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engines
        ctx.fillStyle = '#334155';
        ctx.fillRect(11, 4, 3, 7);
        ctx.fillRect(-14, 4, 3, 7);

        // In-Flight Refueling Boom trailing from tail
        ctx.beginPath();
        ctx.moveTo(0, 23);
        ctx.lineTo(0, 31);
        ctx.strokeStyle = '#c084fc'; // Tanker purple
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Boom rudder-vator control fins
        ctx.beginPath();
        ctx.moveTo(-3.5, 29);
        ctx.lineTo(3.5, 29);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -29);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-transport') {
        // Heavy Strategic Airlifter (C-17 Globemaster: broad body, 4 turbofans, high T-tail)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(5.5, -11);
        ctx.lineTo(25, 2);
        ctx.lineTo(24, 8);
        ctx.lineTo(5.5, 4);
        ctx.lineTo(5, 17);
        ctx.lineTo(13, 23);
        ctx.lineTo(13, 26); // High T-Tail
        ctx.lineTo(0, 24);
        ctx.lineTo(-13, 26);
        ctx.lineTo(-13, 23);
        ctx.lineTo(-5, 17);
        ctx.lineTo(-5.5, 4);
        ctx.lineTo(-24, 8);
        ctx.lineTo(-25, 2);
        ctx.lineTo(-5.5, -11);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4 Turbofan pods
        ctx.fillStyle = '#334155';
        ctx.fillRect(10, 2, 3.5, 7.5);
        ctx.fillRect(17, 4, 3.5, 6.5);
        ctx.fillRect(-13.5, 2, 3.5, 7.5);
        ctx.fillRect(-20.5, 4, 3.5, 6.5);

        // Cockpit canopy windows
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3, -15, 6, 2.5);

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -29);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else if (shape === 'plane-recon') {
        // Reconnaissance / Maritime Patrol (RC-135 Rivet Joint / P-8 Poseidon: SIGINT fairings, cheek sensors)
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(4, -6);
        ctx.lineTo(25, 4);
        ctx.lineTo(24, 8);
        ctx.lineTo(4.5, 6);
        ctx.lineTo(4.5, 18);
        ctx.lineTo(11, 23);
        ctx.lineTo(11, 25);
        ctx.lineTo(0, 23);
        ctx.lineTo(-11, 25);
        ctx.lineTo(-11, 23);
        ctx.lineTo(-4.5, 18);
        ctx.lineTo(-4.5, 6);
        ctx.lineTo(-24, 8);
        ctx.lineTo(-25, 4);
        ctx.lineTo(-4, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engines
        ctx.fillStyle = '#334155';
        ctx.fillRect(11, 3, 3, 7);
        ctx.fillRect(-14, 3, 3, 7);

        // Ventral SIGINT sensor canoe fairing
        ctx.beginPath();
        ctx.ellipse(0, 4, 2.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -29);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        // Tactical Liaison / Trainer / Default Airframe
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(3.5, -6);
        ctx.lineTo(21, 5);
        ctx.lineTo(20, 8.5);
        ctx.lineTo(3.5, 6);
        ctx.lineTo(3.5, 16);
        ctx.lineTo(9, 21);
        ctx.lineTo(9, 23);
        ctx.lineTo(0, 21);
        ctx.lineTo(-9, 23);
        ctx.lineTo(-9, 21);
        ctx.lineTo(-3.5, 16);
        ctx.lineTo(-3.5, 6);
        ctx.lineTo(-20, 8.5);
        ctx.lineTo(-21, 5);
        ctx.lineTo(-3.5, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Forward HUD tick
        ctx.beginPath();
        ctx.moveTo(0, -23);
        ctx.lineTo(0, -27);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      ctx.restore();
      return ctx.getImageData(0, 0, size, size);
    };

    const icons: Array<{ id: string; shape: AirframeShape }> = [
      { id: 'aircraft-fighter', shape: 'plane-fighter' },
      { id: 'aircraft-drone-recon', shape: 'plane-drone-recon' },
      { id: 'aircraft-drone-strike', shape: 'plane-drone-strike' },
      { id: 'aircraft-drone-kamikaze', shape: 'plane-drone-kamikaze' },
      { id: 'aircraft-awacs', shape: 'plane-awacs' },
      { id: 'aircraft-tanker', shape: 'plane-tanker' },
      { id: 'aircraft-transport', shape: 'plane-transport' },
      { id: 'aircraft-recon', shape: 'plane-recon' },
      { id: 'aircraft-default', shape: 'plane-default' },
    ];

    icons.forEach((ic) => {
      if (!map.hasImage(ic.id)) {
        const img = createAircraftImage(ic.shape);
        if (img) map.addImage(ic.id, img);
      }
    });
  };

  // Deselect flight path on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        removeRadiatingBeacon();
        onSelectAircraft?.(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeRadiatingBeacon, onSelectAircraft]);

  // Synchronize incoming GeoJSON into live kinematics map
  useEffect(() => {
    if (!aviationGeoJson?.features) return;
    const currentMap = planesRef.current;
    const seenIds = new Set<string>();

    for (const f of aviationGeoJson.features) {
      const p = f.properties || {};
      const coords = f.geometry?.coordinates || [0, 0];
      const id = String(p.id || p.hex || `${coords[0]}_${coords[1]}`);
      seenIds.add(id);

      const existing = currentMap.get(id);
      if (existing) {
        existing.speedKnots = Number(p.speedKnots || existing.speedKnots || 0);
        existing.altitudeFt = p.altitudeFt;
        existing.altitudeLabel = p.altitudeLabel || existing.altitudeLabel;
        existing.squawk = p.squawk || existing.squawk;
        existing.callsign = p.callsign || existing.callsign;
        existing.modelDescription = p.modelDescription || existing.modelDescription;
        existing.category = p.category || existing.category;
        existing.color = p.color || existing.color;
        existing.iconName = p.iconName || existing.iconName;

        const targetLng = coords[0];
        const targetLat = coords[1];
        const targetTrack = Number(p.trackDeg || existing.trackDeg || 0);

        const dist = Math.hypot(existing.curLng - targetLng, existing.curLat - targetLat);
        if (dist > 1.5) {
          existing.curLng = targetLng;
          existing.curLat = targetLat;
          existing.curTrack = targetTrack;
        } else {
          existing.curLng = existing.curLng * 0.7 + targetLng * 0.3;
          existing.curLat = existing.curLat * 0.7 + targetLat * 0.3;
          existing.trackDeg = targetTrack;
        }
      } else {
        const initLng = coords[0];
        const initLat = coords[1];
        const initTrack = Number(p.trackDeg || 0);

        // Compute fixed historical waypoints once at detection time - never moves with plane!
        const staticPath = generateStaticFlightPath(initLng, initLat, initTrack, p.callsign);

        currentMap.set(id, {
          id,
          hex: p.hex || id,
          callsign: p.callsign || 'UNKNOWN',
          registration: p.registration,
          typeCode: p.typeCode,
          modelDescription: p.modelDescription,
          category: p.category || 'AIRBORNE',
          color: p.color || '#06b6d4',
          iconName: p.iconName || 'aircraft-default',
          squawk: p.squawk,
          altitudeFt: p.altitudeFt,
          altitudeLabel: p.altitudeLabel || 'AIRBORNE',
          speedKnots: Number(p.speedKnots || 300),
          trackDeg: initTrack,
          curLng: initLng,
          curLat: initLat,
          curTrack: initTrack,
          fixedPathWaypoints: staticPath.fixedPathWaypoints,
          originName: staticPath.originName,
          originCoord: staticPath.originCoord,
          history: [],
        });
      }
    }

    for (const key of currentMap.keys()) {
      if (!seenIds.has(key)) {
        currentMap.delete(key);
      }
    }
  }, [aviationGeoJson]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const maplibre = await import('maplibre-gl');
        maplibreModuleRef.current = maplibre;

        if (!isMounted || !mapContainerRef.current) return;

        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: darkBasemapStyle as any,
          center: [28, 48],
          zoom: 4.2,
          minZoom: 1.5,
          maxZoom: 14,
          attributionControl: false,
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapInstanceRef.current = map;
          setMapLoaded(true);

          registerMilitaryAircraftIcons(map);

          // ── 1. SELECTED COMPLETE FLIGHT PATH LAYERS ─────────────────────────
          map.addSource('warroom-selected-flight-path', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // Selected Flight Path Outer Glow
          map.addLayer({
            id: 'selected-path-glow',
            type: 'line',
            source: 'warroom-selected-flight-path',
            filter: ['==', ['get', 'type'], 'FLOWN_PATH'],
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 5.5,
              'line-blur': 3.5,
              'line-opacity': 0.70,
            },
          });

          // Selected Flight Path Core Vector Line
          map.addLayer({
            id: 'selected-path-core',
            type: 'line',
            source: 'warroom-selected-flight-path',
            filter: ['==', ['get', 'type'], 'FLOWN_PATH'],
            paint: {
              'line-color': '#ffffff',
              'line-width': 2.4,
              'line-opacity': 0.95,
            },
          });

          // Projected Forward Track (Dashed vector ahead)
          map.addLayer({
            id: 'selected-path-projected',
            type: 'line',
            source: 'warroom-selected-flight-path',
            filter: ['==', ['get', 'type'], 'PROJECTED_PATH'],
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 2.0,
              'line-opacity': 0.80,
              'line-dasharray': [3, 2],
            },
          });

          // Flight Origin Base Circle (Stationary on ground)
          map.addLayer({
            id: 'selected-path-origin',
            type: 'circle',
            source: 'warroom-selected-flight-path',
            filter: ['==', ['get', 'type'], 'ORIGIN'],
            paint: {
              'circle-radius': 6,
              'circle-color': ['get', 'color'],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            },
          });

          // Flight Origin Text Label (Stationary on ground)
          map.addLayer({
            id: 'selected-path-origin-label',
            type: 'symbol',
            source: 'warroom-selected-flight-path',
            filter: ['==', ['get', 'type'], 'ORIGIN'],
            layout: {
              'text-field': ['concat', 'ORIGIN :: ', ['get', 'originName']],
              'text-size': 9.5,
              'text-offset': [0, 1.4],
              'text-anchor': 'top',
              'text-font': ['Open Sans Bold'],
              'text-allow-overlap': true,
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#07090b',
              'text-halo-width': 2.0,
            },
          });

          // ── 2. GENERAL FLIGHT TRAILS (Breadcrumbs) ──────────────────────────
          map.addSource('warroom-military-trails', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addLayer({
            id: 'aviation-aircraft-trails',
            type: 'line',
            source: 'warroom-military-trails',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 1.4,
              'line-opacity': 0.50,
              'line-dasharray': [2, 2],
            },
          });

          // ── 3. AIRCRAFT POINTS & SILHOUETTES ───────────────────────────────
          map.addSource('warroom-military-aircraft', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addLayer({
            id: 'aviation-aircraft-symbols',
            type: 'symbol',
            source: 'warroom-military-aircraft',
            layout: {
              'icon-image': ['get', 'iconName'],
              'icon-rotate': ['get', 'trackDeg'],
              'icon-rotation-alignment': 'map',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                2, 0.28,
                5, 0.38,
                9, 0.50,
              ],
            },
          });

          map.addLayer({
            id: 'aviation-callsign-labels',
            type: 'symbol',
            source: 'warroom-military-aircraft',
            layout: {
              'text-field': ['concat', ['get', 'callsign'], '\n', ['get', 'altitudeLabel']],
              'text-size': [
                'interpolate', ['linear'], ['zoom'],
                2, 7.5,
                5, 8.5,
                9, 10,
              ],
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-font': ['Open Sans Bold'],
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': '#e2e8f0', // Crisp tactical HUD silver/white - NO neon
              'text-halo-color': '#05080c',
              'text-halo-width': 2.0,
            },
          });

          map.addLayer({
            id: 'aviation-hit-target',
            type: 'circle',
            source: 'warroom-military-aircraft',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 10,
                5, 14,
                10, 20,
              ],
              'circle-opacity': 0,
              'circle-stroke-width': 0,
            },
          });

          // Click on military aircraft -> select and display complete flight path in right panel
          map.on('click', 'aviation-hit-target', (e: any) => {
            if (!e.features || !e.features[0]) return;
            const props = e.features[0].properties || {};
            const coords = e.features[0].geometry.coordinates.slice();

            // Enrich props with origin details from live kinematics state
            const id = String(props.id || props.hex || '');
            const livePlane = planesRef.current.get(id);
            const enrichedProps = {
              ...props,
              originName: livePlane?.originName || props.originName || 'AIRSPACE DEPARTURE CORRIDOR',
              originCoord: livePlane?.originCoord || props.originCoord,
            };

            onSelectAircraft?.(enrichedProps);

            map.flyTo({
              center: [coords[0], coords[1]],
              zoom: Math.max(map.getZoom() < 7 ? 7 : map.getZoom(), 7),
              duration: 700,
            });

            setRadiatingBeacon(coords[0], coords[1], props.color || '#06b6d4');
          });

          // Click on empty map area -> deselect aircraft & remove beacon
          map.on('click', (e: any) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['aviation-hit-target'] });
            if (!features || features.length === 0) {
              onSelectAircraft?.(null);
              removeRadiatingBeacon();
            }
          });

          map.on('mouseenter', 'aviation-hit-target', () => {
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
          });

          map.on('mouseleave', 'aviation-hit-target', () => {
            map.getCanvas().style.cursor = '';
          });
        });
      } catch (e) {
        console.error('Failed to initialize RadarMap:', e);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [setRadiatingBeacon, removeRadiatingBeacon, onSelectAircraft]);

  // Update Flight Path whenever selectedAircraft changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const pathSource = map.getSource('warroom-selected-flight-path');
    if (!pathSource) return;

    if (!selectedAircraft) {
      pathSource.setData({ type: 'FeatureCollection', features: [] });
      removeRadiatingBeacon();
      setTimeout(() => {
        try { map.resize(); } catch (_) {}
      }, 60);
      return;
    }

    const id = String(selectedAircraft.id || selectedAircraft.hex || '');
    let livePlane = planesRef.current.get(id);

    // If plane not yet initialized in planesRef, initialize with static fixed path
    if (!livePlane) {
      const initLng = Number(selectedAircraft.longitude || selectedAircraft.curLng || 0);
      const initLat = Number(selectedAircraft.latitude || selectedAircraft.curLat || 0);
      const initTrack = Number(selectedAircraft.trackDeg || 0);
      const staticPath = generateStaticFlightPath(initLng, initLat, initTrack, selectedAircraft.callsign);

      livePlane = {
        id,
        hex: selectedAircraft.hex || id,
        callsign: selectedAircraft.callsign || 'UNKNOWN',
        category: selectedAircraft.category || 'AIRBORNE',
        color: selectedAircraft.color || '#06b6d4',
        iconName: selectedAircraft.iconName || 'aircraft-default',
        altitudeFt: selectedAircraft.altitudeFt,
        altitudeLabel: selectedAircraft.altitudeLabel || 'AIRBORNE',
        speedKnots: Number(selectedAircraft.speedKnots || 300),
        trackDeg: initTrack,
        curLng: initLng,
        curLat: initLat,
        curTrack: initTrack,
        fixedPathWaypoints: staticPath.fixedPathWaypoints,
        originName: staticPath.originName,
        originCoord: staticPath.originCoord,
        history: [],
      };
      planesRef.current.set(id, livePlane);
    }

    const pathGeoJson = buildCompleteFlightPathGeoJson(livePlane);
    pathSource.setData(pathGeoJson);

    setRadiatingBeacon(livePlane.curLng, livePlane.curLat, livePlane.color || '#06b6d4');

    setTimeout(() => {
      try { map.resize(); } catch (_) {}
    }, 60);
  }, [selectedAircraft, mapLoaded, removeRadiatingBeacon, setRadiatingBeacon]);

  // Fly to targetLocation if provided (explicit coordinate pan - independent of selectedAircraft reference)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !targetLocation) return;
    const [lat, lng] = targetLocation;
    mapInstanceRef.current.flyTo({
      center: [lng, lat],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 7),
      duration: 800,
    });
  }, [targetLocation, mapLoaded]);

  // Live Flight Kinematics Animation Loop (60fps continuous movement + real-time path extension)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    lastFrameTimeRef.current = performance.now();
    historySampleTimeRef.current = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      // Sample breadcrumb history every 1.5 seconds
      const shouldSampleHistory = now - historySampleTimeRef.current > 1500;
      if (shouldSampleHistory) {
        historySampleTimeRef.current = now;
      }

      const planes = Array.from(planesRef.current.values());

      for (const p of planes) {
        if (p.altitudeFt === 'GROUND' || p.speedKnots < 25) continue;

        const speed = Math.max(p.speedKnots, 180);
        const vMetersPerSec = speed * 0.514444 * SPEED_FACTOR;
        const distMeters = vMetersPerSec * dt;

        let angleDiff = (p.trackDeg - p.curTrack) % 360;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        p.curTrack = (p.curTrack + angleDiff * Math.min(dt * 2.0, 1.0) + 360) % 360;

        const rad = (p.curTrack * Math.PI) / 180;
        const dx = Math.sin(rad);
        const dy = Math.cos(rad);

        const dLat = (dy * distMeters) / 111139;
        const cosLat = Math.cos((p.curLat * Math.PI) / 180);
        const dLng = (dx * distMeters) / (111139 * Math.max(Math.abs(cosLat), 0.2));

        p.curLat += dLat;
        p.curLng += dLng;

        if (p.curLng > 180) p.curLng -= 360;
        if (p.curLng < -180) p.curLng += 360;

        // Permanently record historic breadcrumb on Earth
        if (shouldSampleHistory) {
          p.history.push([p.curLng, p.curLat]);
          if (p.history.length > 50) {
            p.history.shift();
          }
        }
      }

      // 1. Update Aircraft Points
      const aircraftSource = map.getSource('warroom-military-aircraft');
      if (aircraftSource) {
        const pointsGeoJson = {
          type: 'FeatureCollection',
          features: planes.map((p) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [p.curLng, p.curLat] },
            properties: {
              id: p.id,
              hex: p.hex,
              callsign: p.callsign,
              registration: p.registration,
              typeCode: p.typeCode,
              modelDescription: p.modelDescription,
              category: p.category,
              color: p.color,
              iconName: p.iconName,
              squawk: p.squawk,
              altitudeFt: p.altitudeFt,
              altitudeLabel: p.altitudeLabel,
              speedKnots: p.speedKnots,
              trackDeg: Math.round(p.curTrack),
              latitude: p.curLat,
              longitude: p.curLng,
            },
          })),
        };
        aircraftSource.setData(pointsGeoJson);
      }

      // 2. Update General Flight Breadcrumb Trails
      const trailsSource = map.getSource('warroom-military-trails');
      if (trailsSource) {
        const trailsGeoJson = {
          type: 'FeatureCollection',
          features: planes
            .filter((p) => p.history.length >= 2)
            .map((p) => ({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [...p.history, [p.curLng, p.curLat]],
              },
              properties: {
                id: `trail-${p.id}`,
                color: p.color,
              },
            })),
        };
        trailsSource.setData(trailsGeoJson);
      }

      // 3. Update Selected Complete Flight Path (STATIC ground path + only live front tip moves forward)
      const currentSelected = selectedAircraftRef.current;
      if (currentSelected) {
        const selId = String(currentSelected.id || currentSelected.hex || '');
        const liveSelPlane = planesRef.current.get(selId);
        const pathSource = map.getSource('warroom-selected-flight-path');
        if (pathSource && liveSelPlane) {
          const updatedPathGeoJson = buildCompleteFlightPathGeoJson(liveSelPlane);
          pathSource.setData(updatedPathGeoJson);
        }
      }

      animFrameRef.current = requestAnimationFrame(frame);
    };

    animFrameRef.current = requestAnimationFrame(frame);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [mapLoaded]);

  return (
    <div className="relative w-full h-full bg-[#07090b] select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Radar Scope Concentric Range Rings Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />
      </div>

      {/* Bottom Tactical Map Legend HUD */}
      <MapLegend
        activePage="RADAR"
        aviationCount={aviationCount}
        isAviationLoading={isAviationLoading}
      />

      {/* Map Zoom Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1 font-mono select-none">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-7 h-7 bg-[#090d12]/95 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-7 h-7 bg-[#090d12]/95 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer transition-colors"
          title="Zoom Out"
        >
          -
        </button>
      </div>
    </div>
  );
};
