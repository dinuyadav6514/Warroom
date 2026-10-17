'use client';

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { ConflictEvent, Conflict, MapMode } from '@/types/conflict';
import { RelationshipNetwork, CountryRelation } from '@/lib/data/country-relationships';
import { MapLegend } from './MapLegend';
import { TacticalBleedmarkCursor } from './TacticalBleedmarkCursor';
import { getCountryCoord } from '@/lib/data/country-coords';
import { Plus, Minus, X } from 'lucide-react';

// Dynamically import Globe to avoid SSR issues (it uses browser APIs & WebGL)
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-32 rounded-full border border-zinc-800 animate-pulse bg-zinc-900/40" />
        <span className="text-zinc-600 text-xs font-mono tracking-widest">INITIALIZING GLOBE...</span>
      </div>
    </div>
  ),
}) as any;

/* ── Razor-Sharp High-Contrast Tactical Palette ────────────────────── */
const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: '#ff2247', // Piercing Electric Crimson (armed conflict, kinetic strikes)
  HIGH:     '#ff8800', // Sharp Tactical Vivid Amber-Orange (active combat, escalation)
  MODERATE: '#ffea00', // Intense Razor-Sharp Yellow (standoffs, alerts)
  LOW:      '#00e676', // Luminous Emerald / Signal Mint (low intensity, patrol, security)
};

/* ── Deep High-Contrast Dark Marker Palette for Light Mode (Grey Land / White Waters) ── */
const SEVERITY_COLOR_LIGHT: Record<string, string> = {
  CRITICAL: '#7f1d1d', // Deep Blood Crimson / Burgundy
  HIGH:     '#9a3412', // Dark Burnt Ochre / Rust Orange
  MODERATE: '#78350f', // Dark Amber / Espresso Raw Umber
  LOW:      '#14532d', // Deep Dark Forest Pine
};

function getEventColor(event: { severity: string; isConflict?: boolean; primaryCategory?: string }, isLight = false): string {
  if (event.isConflict === false) {
    return isLight ? '#0f172a' : '#00d4ff'; // Obsidian Midnight Navy in light mode vs Electric Cyan
  }
  const palette = isLight ? SEVERITY_COLOR_LIGHT : SEVERITY_COLOR;
  return palette[event.severity] ?? (isLight ? '#7f1d1d' : '#ff2247');
}

function getSeverityColor(severity: string, isConflict: boolean, isLight = false): string {
  if (!isConflict) return isLight ? '#0f172a' : '#00d4ff';
  const palette = isLight ? SEVERITY_COLOR_LIGHT : SEVERITY_COLOR;
  return palette[severity] ?? (isLight ? '#7f1d1d' : '#ff2247');
}

/** Convert hex "#rrggbb" → "r,g,b" string for rgba() usage */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255,34,71';
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

/* ── Pre-cached textures: Crisp high-contrast 2D tactical reticle discs ── */
const dotTextureCache = new Map<string, THREE.CanvasTexture>();

function getFlatDotTexture(color: string, isLight = false): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `${color}-${isLight ? 'light' : 'dark'}`;
  if (dotTextureCache.has(key)) return dotTextureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 64, 64);

  // 1. High-contrast perimeter rim
  // In light mode, crisp white ring prevents marker bleed against grey land
  ctx.fillStyle = isLight ? '#ffffff' : '#020408';
  ctx.beginPath();
  ctx.arc(32, 32, 26, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tactical dark or vibrant color core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(32, 32, 22.5, 0, Math.PI * 2);
  ctx.fill();

  // 3. Precision optical center pinpoint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(32, 32, 5.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  dotTextureCache.set(key, texture);
  return texture;
}

/* ── Pre-cached theater target reticle texture (distinct tactical ring, zero text) ── */
function getTheaterReticleTexture(color: string, isLight = false): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `theater-${color}-${isLight ? 'light' : 'dark'}`;
  if (dotTextureCache.has(key)) return dotTextureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 64, 64);

  // 1. Outer rim
  ctx.strokeStyle = isLight ? '#ffffff' : '#020408';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(32, 32, 26, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Tactical outer reticle ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(32, 32, 23, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Inner solid target core
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(32, 32, 11, 0, Math.PI * 2);
  ctx.fill();

  // 4. Precision center pinpoint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(32, 32, 3.5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  dotTextureCache.set(key, texture);
  return texture;
}

/**
 * Calculates dynamically scaled arc peak altitude to guarantee that the 3D Cubic
 * Bezier curve never penetrates into the interior of the spherical globe,
 * even across long transcontinental and near-antipodal paths (e.g. India - USA).
 */
function calculateArcAltitude(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  isOutgoing: boolean
): number {
  const phi1 = (startLat * Math.PI) / 180;
  const phi2 = (endLat * Math.PI) / 180;
  const deltaPhi = ((endLat - startLat) * Math.PI) / 180;
  const deltaLambda = ((endLng - startLng) * Math.PI) / 180;

  // Haversine angular distance in radians (0 to PI)
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  // Great-circle normalized factor (0 = co-located, 1 = antipodal)
  const distFactor = c / Math.PI;

  // Base altitude smoothly scales with angular distance:
  // Short neighbor pairs (~10°-25°): ~0.14 - 0.17
  // Medium cross-theater pairs (~40°-70°): ~0.20 - 0.28
  // Long intercontinental pairs (~110°-150°, e.g. India - USA): ~0.42 - 0.52
  const baseAlt = 0.12 + Math.pow(distFactor, 1.2) * 0.48;
  const stagger = isOutgoing ? 0 : 0.035;

  return Math.min(0.68, Math.max(0.12, baseAlt + stagger));
}

/**
 * Calculates a point offset laterally (perpendicular) to the geodesic path from (lat1, lng1) to (lat2, lng2).
 * Used to horizontally separate multiple lines between the same country pair into parallel corridors,
 * completely eliminating visual overlap when viewed from above.
 */
function getPerpendicularPoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  offsetDeg: number
): { lat: number; lng: number } {
  if (Math.abs(offsetDeg) < 0.0001) {
    return { lat: lat1, lng: lng1 };
  }

  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaLambda = (lng2 - lng1) * toRad;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = Math.atan2(y, x);

  // Perpendicular bearing (+90 deg / right-hand side)
  const perpBearing = bearing + Math.PI / 2;
  const delta = offsetDeg * toRad;

  const latOffset = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(perpBearing)
  );
  const lngOffset =
    lng1 * toRad +
    Math.atan2(
      Math.sin(perpBearing) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(latOffset)
    );

  return { lat: latOffset * toDeg, lng: lngOffset * toDeg };
}

/**
 * Calculates perpendicular cross-track distance in degrees from point (clickLat, clickLng)
 * to a great-circle arc segment between (startLat, startLng) and (endLat, endLng).
 */
function distanceToArcDeg(
  clickLat: number,
  clickLng: number,
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): number {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const lat1 = startLat * toRad;
  const lng1 = startLng * toRad;
  const lat2 = endLat * toRad;
  const lng2 = endLng * toRad;
  const lat3 = clickLat * toRad;
  const lng3 = clickLng * toRad;

  const dAB = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
  ));
  const dAP = 2 * Math.asin(Math.sqrt(
    Math.sin((lat3 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat3) * Math.sin((lng3 - lng1) / 2) ** 2
  ));

  if (dAB === 0) return dAP * toDeg;

  const yAB = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const xAB = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  const brgAB = Math.atan2(yAB, xAB);

  const yAP = Math.sin(lng3 - lng1) * Math.cos(lat3);
  const xAP = Math.cos(lat1) * Math.sin(lat3) - Math.sin(lat1) * Math.cos(lat3) * Math.cos(lng3 - lng1);
  const brgAP = Math.atan2(yAP, xAP);

  const dxt = Math.asin(Math.sin(dAP) * Math.sin(brgAP - brgAB));
  const cosDxt = Math.cos(dxt);
  if (Math.abs(cosDxt) < 1e-7) return Math.abs(dxt) * toDeg;
  const dat = Math.acos(Math.max(-1, Math.min(1, Math.cos(dAP) / cosDxt)));

  if (dat < 0 || dat > dAB) {
    const dBP = 2 * Math.asin(Math.sqrt(
      Math.sin((lat3 - lat2) / 2) ** 2 +
      Math.cos(lat2) * Math.cos(lat3) * Math.sin((lng3 - lng2) / 2) ** 2
    ));
    return Math.min(dAP, dBP) * toDeg;
  }

  return Math.abs(dxt) * toDeg;
}

/* ── Props (mirrors ConflictMap exactly) ─────────────────────────────── */
interface GlobeConflictMapProps {
  events: ConflictEvent[];
  conflicts: Conflict[];
  selectedConflict: Conflict | null;
  selectedEvent: ConflictEvent | null;
  onSelectConflict: (conflict: Conflict | null) => void;
  onSelectEvent: (event: ConflictEvent | null) => void;
  onOpenEventModal?: (event: ConflictEvent) => void;
  onSelectRelation?: (relation: CountryRelation) => void;
  mapMode: MapMode;
  onChangeMapMode: (mode: MapMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  targetLocation?: { lng: number; lat: number; zoom?: number; timestamp: number; noZoom?: boolean } | null;
  relationNetwork?: RelationshipNetwork | null;
  onClearRelationNetwork?: () => void;
  showFirms?: boolean;
  onToggleFirms?: () => void;
  firmsGeoJson?: any;
  firmsCount?: number;
  isFirmsLoading?: boolean;
  showAviation?: boolean;
  onToggleAviation?: () => void;
  aviationGeoJson?: any;
  aviationCount?: number;
  isAviationLoading?: boolean;
  battlefrontClusters?: any[];
  verifiedIncidents?: any[];
  threatIndex?: number;
  theme?: 'dark' | 'light';
  leftInset?: number;
  rightInset?: number;
}

export const GlobeConflictMap: React.FC<GlobeConflictMapProps> = ({
  events,
  conflicts,
  selectedConflict,
  selectedEvent,
  onSelectConflict,
  onSelectEvent,
  onOpenEventModal,
  onSelectRelation,
  mapMode,
  onChangeMapMode,
  onRefresh,
  isRefreshing = false,
  targetLocation,
  relationNetwork,
  onClearRelationNetwork,
  showFirms = false,
  onToggleFirms,
  firmsGeoJson,
  firmsCount,
  isFirmsLoading = false,
  showAviation = false,
  onToggleAviation,
  aviationGeoJson,
  aviationCount,
  isAviationLoading = false,
  battlefrontClusters = [],
  verifiedIncidents = [],
  threatIndex = 0,
  theme = 'dark',
  leftInset = 0,
  rightInset = 0,
}) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDotHovered, setIsDotHovered] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [countries, setCountries] = useState<any>({ features: [] });
  const [cameraAltitude, setCameraAltitude] = useState(2.5);

  /**
   * Called once when the Three.js scene finishes initialising.
   * – Sets renderer pixel ratio to the display's actual DPR (2× on Retina, etc.)
   * – Enables smooth tactical auto-rotation when in global overview.
   */
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return;

    try {
      const renderer = globeRef.current.renderer?.();
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
        renderer.setSize(containerSize.width, containerSize.height, false);
      }
    } catch (e) {
      // Ignore if renderer not attached
    }

    try {
      const controls = globeRef.current.controls?.();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45; // Smooth tactical slow spin
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
      }
    } catch (e) {
      // Ignore if controls not available
    }

    try {
      const scene = globeRef.current.scene?.();
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.isAmbientLight) {
            obj.intensity = theme === 'light' ? 2.6 : 1.8;
          }
          if (obj.isDirectionalLight) {
            obj.intensity = theme === 'light' ? 1.6 : 1.2;
          }
        });
      }
    } catch (e) {
      // Ignore
    }

    // Apply initial globe sphere ocean material for active theme
    try {
      const mat = globeRef.current.globeMaterial?.();
      if (mat) {
        if (theme === 'light') {
          mat.color = new THREE.Color('#ffffff'); // Pure White Waters
          mat.emissive = new THREE.Color('#ffffff');
          mat.emissiveIntensity = 0.02;
        } else {
          mat.color = new THREE.Color('#020610');
          mat.emissive = new THREE.Color('#000000');
          mat.emissiveIntensity = 0;
        }
        mat.needsUpdate = true;
      }
    } catch (e) {
      // Ignore
    }
  }, [containerSize.width, containerSize.height, theme]);

  /* ── Reactive theme update for globe sphere ocean & scene lights ── */
  useEffect(() => {
    if (!globeRef.current) return;
    try {
      const mat = globeRef.current.globeMaterial?.();
      if (mat) {
        if (theme === 'light') {
          mat.color = new THREE.Color('#ffffff'); // Pure White Waters
          mat.emissive = new THREE.Color('#ffffff');
          mat.emissiveIntensity = 0.02;
        } else {
          mat.color = new THREE.Color('#020610');
          mat.emissive = new THREE.Color('#000000');
          mat.emissiveIntensity = 0;
        }
        mat.needsUpdate = true;
      }
    } catch (e) {
      // Ignore
    }

    try {
      const scene = globeRef.current.scene?.();
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.isAmbientLight) {
            obj.intensity = theme === 'light' ? 2.6 : 1.8;
          }
          if (obj.isDirectionalLight) {
            obj.intensity = theme === 'light' ? 1.6 : 1.2;
          }
        });
      }
    } catch (e) {
      // Ignore
    }
  }, [theme]);

  /* ── Load world country polygons from local static asset ────────── */
  useEffect(() => {
    fetch('/data/ne_110m.geojson')
      .then((r) => {
        if (!r.ok) throw new Error('Local fetch failed');
        return r.json();
      })
      .then((data) => setCountries(data))
      .catch((err) => {
        console.error('Failed to load local country geojson, falling back...', err);
        // Fallback to local high-res dataset if present
        fetch('/data/countries.geojson')
          .then((r) => r.json())
          .then((data) => setCountries(data))
          .catch(() => {});
      });
  }, []);

  /* ── Escape key → deselect + zoom back out ───────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectEvent(null);
        onSelectConflict(null);
        if (globeRef.current) {
          globeRef.current.pointOfView({ lat: 20, lng: 25, altitude: 2.5 }, 900);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectEvent, onSelectConflict]);

  /* ── Track container dimensions for responsive globe ────────────── */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

/* ── Sunflower spiral anti-collision dispersion for stacked events ──── */
function decollidePoints<T extends { lat: number; lng: number }>(points: T[]): T[] {
  const buckets = new Map<string, T[]>();
  for (const pt of points) {
    if (typeof pt.lat !== 'number' || typeof pt.lng !== 'number') continue;
    // Group into ~0.25 degree buckets (~25km)
    const key = `${Math.round(pt.lat * 4)}_${Math.round(pt.lng * 4)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(pt);
  }

  const result: T[] = [];
  const GOLDEN_ANGLE = 2.399963; // radians (~137.5 deg)

  for (const group of buckets.values()) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      group.forEach((pt, index) => {
        if (index === 0) {
          result.push(pt);
        } else {
          // Sunflower spiral radial offset so dots never occlude or overlap
          const r = 0.45 * Math.sqrt(index);
          const theta = index * GOLDEN_ANGLE;
          const latOffset = r * Math.cos(theta);
          const lngOffset = (r * Math.sin(theta)) / Math.max(0.2, Math.cos((pt.lat * Math.PI) / 180));

          result.push({
            ...pt,
            lat: pt.lat + latOffset,
            lng: pt.lng + lngOffset,
          });
        }
      });
    }
  }

  return result;
}

  /* ── Conflict/news event points (flat 2D discs on globe surface) ── */
  const conflictPoints = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let displayEvents = events;
    if (mapMode === 'ESCALATION') {
      displayEvents = events.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH');
    }

    // Map for fast verified incident lookup
    const verifiedMap = new Map<string, any>();
    for (const vi of verifiedIncidents) {
      if (vi?.event?.id) {
        verifiedMap.set(vi.event.id, vi);
      }
    }

    const raw = displayEvents
      .filter(
        (e) =>
          typeof e.latitude === 'number' &&
          !isNaN(e.latitude) &&
          typeof e.longitude === 'number' &&
          !isNaN(e.longitude)
      )
      .map((e) => {
        const time = new Date((e as any).timestamp || e.eventDate).getTime();
        const isRecent = !isNaN(time) && now - time <= oneDayMs;
        const color = getEventColor(e as any, theme === 'light');
        const verifiedInfo = verifiedMap.get(e.id);

        // Bold, distinct base dot radii (increased by ~1.18x for high clarity, strictly < 1.25x)
        const radius =
          e.severity === 'CRITICAL' ? 0.38 :
          e.severity === 'HIGH'     ? 0.31 :
          e.severity === 'MODERATE' ? 0.26 : 0.21;

        return {
          lat: e.latitude!,
          lng: e.longitude!,
          id: e.id,
          color,
          altitude: 0.001,
          radius,
          isRecent,
          isConflict: e.isConflict !== false,
          severity: e.severity,
          event: e,
          verifiedInfo,
        };
      });

    return decollidePoints(raw);
  }, [events, mapMode, verifiedIncidents, theme]);

  /* ── Conflict theater centroids (for CONFLICTS mode - clean, zero text clutter) ── */
  const conflictTheaterPoints = useMemo(() => {
    if (mapMode !== 'CONFLICTS') return [];
    const isLight = theme === 'light';
    return conflicts
      .filter((c) => typeof c.latitude === 'number' && typeof c.longitude === 'number')
      .map((c) => {
        const color = isLight
          ? (c.status === 'ESCALATING' ? '#7f1d1d' : c.status === 'DEESCALATING' ? '#14532d' : '#78350f')
          : (c.status === 'ESCALATING' ? '#ff2247' : c.status === 'DEESCALATING' ? '#00e676' : '#ffea00');
        return {
          lat: c.latitude!,
          lng: c.longitude!,
          id: `theater-${c.id}`,
          color,
          altitude: 0.002,
          radius: 0.46, // Sleek tactical command reticle (no heavy text clutter)
          isTheater: true,
          conflict: c,
          event: null,
        };
      });
  }, [conflicts, mapMode, theme]);

  /* ── Pulse rings ONLY around the selected item (event or conflict) when clicked ── */
  const ringsData = useMemo(() => {
    const isLight = theme === 'light';
    // 1. Manually clicked event
    if (
      selectedEvent &&
      typeof selectedEvent.latitude === 'number' &&
      typeof selectedEvent.longitude === 'number'
    ) {
      const color = getSeverityColor(selectedEvent.severity, selectedEvent.isConflict !== false, isLight);
      return [
        {
          lat: selectedEvent.latitude,
          lng: selectedEvent.longitude,
          color,
          rgb: hexToRgb(color),
          maxRadius: 4.5,
        },
      ];
    }

    // 2. Manually clicked conflict
    if (
      selectedConflict &&
      typeof selectedConflict.latitude === 'number' &&
      typeof selectedConflict.longitude === 'number'
    ) {
      const color = isLight
        ? (selectedConflict.status === 'ESCALATING' ? '#7f1d1d' : selectedConflict.status === 'DEESCALATING' ? '#14532d' : '#78350f')
        : (selectedConflict.status === 'ESCALATING' ? '#ff2247' : selectedConflict.status === 'DEESCALATING' ? '#00e676' : '#ffea00');
      return [
        {
          lat: selectedConflict.latitude,
          lng: selectedConflict.longitude,
          color,
          rgb: hexToRgb(color),
          maxRadius: 5.0,
        },
      ];
    }

    // Zero ripples on unclicked dots
    return [];
  }, [selectedEvent, selectedConflict, theme]);

  /* ── Relationship network arcs with lateral / horizontal separation ── */
  const arcsData = useMemo(() => {
    if (!relationNetwork?.relations || relationNetwork.relations.length === 0) return [];

    // Group relations by bilateral country pair (order-independent)
    const pairGroups = new Map<string, CountryRelation[]>();
    for (const rel of relationNetwork.relations) {
      const pairKey = [rel.fromCountry.trim().toLowerCase(), rel.toCountry.trim().toLowerCase()]
        .sort()
        .join('<->');
      const list = pairGroups.get(pairKey) || [];
      list.push(rel);
      pairGroups.set(pairKey, list);
    }

    const arcs: any[] = [];

    for (const [pairKey, rels] of pairGroups.entries()) {
      if (rels.length === 0) continue;

      const [countryA, countryB] = pairKey.split('<->');
      const coordA = getCountryCoord(countryA);
      const coordB = getCountryCoord(countryB);
      if (!coordA || !coordB) continue;
      if (coordA.lat === coordB.lat && coordA.lng === coordB.lng) continue;

      const totalInPair = rels.length;
      // 1.0 degree lateral separation guarantees visible horizontal gap between parallel lines
      const spacingDeg = 1.0;

      rels.forEach((rel, idx) => {
        const isOutgoing = rel.direction === 'OUTGOING';
        const offsetDeg = totalInPair > 1 ? (idx - (totalInPair - 1) / 2) * spacingDeg : 0;

        // Canonical perpendicular tracks
        const trackA = getPerpendicularPoint(coordA.lat, coordA.lng, coordB.lat, coordB.lng, offsetDeg);
        const trackB = getPerpendicularPoint(coordB.lat, coordB.lng, coordA.lat, coordA.lng, -offsetDeg);

        // Assign start and end according to actual flow direction
        const isFromA = rel.fromCountry.trim().toLowerCase() === countryA;
        const startCoord = isFromA ? trackA : trackB;
        const endCoord = isFromA ? trackB : trackA;

        const altitude = calculateArcAltitude(
          startCoord.lat,
          startCoord.lng,
          endCoord.lat,
          endCoord.lng,
          isOutgoing
        );

        const isLight = theme === 'light';
        const arcColor = isLight
          ? (isOutgoing ? '#0f172a' : '#7f1d1d')
          : (isOutgoing ? '#00e5ff' : '#ff2247');

        arcs.push({
          id: rel.id,
          startLat: startCoord.lat,
          startLng: startCoord.lng,
          endLat:   endCoord.lat,
          endLng:   endCoord.lng,
          color:    arcColor,
          altitude,
          stroke:   0.35, // Sleek, reduced cross-sectional area
          relation: rel,
        });
      });
    }

      return arcs;
    }, [relationNetwork, theme]);

    /* ── NASA FIRMS thermal hotspots ─────────────────────────────────── */
    const firmsPoints = useMemo(() => {
      if (!showFirms || !firmsGeoJson?.features) return [];
      const isLight = theme === 'light';
      return (firmsGeoJson.features as any[])
        .filter((f) => f.geometry?.coordinates)
        .map((f) => ({
          lat: f.geometry.coordinates[1] as number,
          lng: f.geometry.coordinates[0] as number,
          color: isLight ? '#991b1b' : '#ff3b00',
          altitude: 0.001,
          radius: 0.19,
          event: null,
          isConflict: false,
          severity: 'LOW',
          id: `firms-${f.properties?.id || Math.random()}`,
          firmsProp: f.properties,
        }));
    }, [showFirms, firmsGeoJson, theme]);

    /* ── Military aviation points ────────────────────────────────────── */
    const aviationPoints = useMemo(() => {
      if (!showAviation || !aviationGeoJson?.features) return [];
      const isLight = theme === 'light';
      return (aviationGeoJson.features as any[])
        .filter((f) => f.geometry?.coordinates)
        .map((f) => ({
          lat: f.geometry.coordinates[1] as number,
          lng: f.geometry.coordinates[0] as number,
          color: isLight ? '#0f172a' : '#00e5ff',
          altitude: 0.001,
          radius: 0.21,
          event: null,
          isConflict: false,
          severity: 'LOW',
          id: `avi-${f.properties?.id || Math.random()}`,
          aviationProp: f.properties,
        }));
    }, [showAviation, aviationGeoJson, theme]);

    /* ── Spatial Frontline / Danger Zone Corridor Centroids ── */
    const clusterPoints = useMemo(() => {
      if (!battlefrontClusters || battlefrontClusters.length === 0) return [];
      const isLight = theme === 'light';
      return battlefrontClusters.map((cl: any) => ({
        lat: cl.centroid.lat,
        lng: cl.centroid.lng,
        id: `corridor-${cl.id}`,
        color: isLight
          ? (cl.threatLevel === 'HIGH' ? '#7f1d1d' : cl.threatLevel === 'MODERATE' ? '#9a3412' : '#78350f')
          : (cl.threatLevel === 'HIGH' ? '#ff0033' : cl.threatLevel === 'MODERATE' ? '#ff9900' : '#ffea00'),
        altitude: 0.003,
        radius: 0.52,
        isCluster: true,
        cluster: cl,
        event: null,
        isConflict: true,
        severity: 'CRITICAL',
      }));
    }, [battlefrontClusters, theme]);

    /* ── Combined point dataset for the current Tac Mode ─────────────── */
    const allPoints = useMemo(() => {
      const base = mapMode === 'CONFLICTS'
        ? [...conflictTheaterPoints, ...(showFirms ? firmsPoints : []), ...(showAviation ? aviationPoints : [])]
        : [...conflictPoints, ...(showFirms ? firmsPoints : []), ...(showAviation ? aviationPoints : [])];

      return [...base, ...clusterPoints];
    }, [mapMode, conflictPoints, conflictTheaterPoints, firmsPoints, aviationPoints, showFirms, showAviation, clusterPoints]);

    /**
     * Guard ref: set true for 200ms after a point click so the globe's own
     * background-click handler doesn't immediately fire and deselect it.
     */
    const justClickedPointRef = useRef(false);

    /* ── 3D Custom Layer: Constant screen-size tactical dots (non-resizable on zoom) ── */
    const customThreeObject = useCallback((d: any) => {
      const isLight = theme === 'light';
      const texture = d.isTheater
        ? getTheaterReticleTexture(d.color, isLight)
        : getFlatDotTexture(d.color, isLight);

      const material = new THREE.SpriteMaterial({
        map: texture || undefined,
        color: 0xffffff,
        transparent: true,
        depthTest: true,
        depthWrite: false, // Prevents depth buffer clipping/Z-fighting with land polygons
      });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 999;

      // Anchor apparent factor: distanceToCamera * factor = constant on-screen pixel diameter
      // strictly maintains constant screen size regardless of zoom in/out
      const apparentFactor = (d.radius || 0.25) * 0.0136;
      sprite.userData = { apparentFactor, pointData: d };

      // Initial scale at nominal overview distance (~250 units at altitude 2.5)
      const initialSize = apparentFactor * 250;
      sprite.scale.set(initialSize, initialSize, 1);

      // Dynamic distance anchoring on every frame:
      // When camera zooms in (dist decreases), sprite 3D scale decreases proportionally
      // so scale / dist = constant, keeping the dot size on screen perfectly fixed!
      sprite.onBeforeRender = (_renderer: any, _scene: any, camera: any) => {
        if (!camera) return;
        const dist = camera.position.distanceTo(sprite.position);
        const s = apparentFactor * dist;
        sprite.scale.set(s, s, 1);
      };

      return sprite;
    }, [theme]);

  const customThreeObjectUpdate = useCallback((obj: any, d: any) => {
    if (!globeRef.current) return;
    try {
      const coords = globeRef.current.getCoords(d.lat, d.lng, 0.015);
      if (coords) {
        Object.assign(obj.position, coords);
      }
      const camera = globeRef.current.camera?.();
      if (camera && obj.userData?.apparentFactor) {
        const dist = camera.position.distanceTo(obj.position);
        const s = obj.userData.apparentFactor * dist;
        obj.scale.set(s, s, 1);
      }
    } catch (e) {
      // Ignore during unmount
    }
  }, []);

  /* ── Point click handler ─────────────────────────────────────────── */
  const handlePointClick = useCallback(
    (point: any) => {
      // 1. Conflict Theater click in CONFLICTS mode
      if (point?.isTheater && point?.conflict) {
        justClickedPointRef.current = true;
        setTimeout(() => { justClickedPointRef.current = false; }, 250);
        onSelectEvent(null);
        onSelectConflict(point.conflict);
        return;
      }

      const ev: ConflictEvent | null = point?.event ?? null;
      if (!ev) return;

      // Arm the guard so handleGlobeClick ignores this same interaction
      justClickedPointRef.current = true;
      setTimeout(() => { justClickedPointRef.current = false; }, 250);

      // Update selection — the useEffect below drives ALL camera movement.
      // Do NOT call pointOfView here: doing so AND in the effect causes a
      // double-fire that manifests as a visible camera stutter/flicker.
      onSelectEvent(ev);
      const related = conflicts.find(
        (c) => c.country?.toLowerCase() === ev.country?.toLowerCase()
      );
      onSelectConflict(related ?? null);
    },
    [onSelectEvent, onSelectConflict, conflicts]
  );

  /* ── Arc click handler ───────────────────────────────────────────── */
  const handleArcClick = useCallback(
    (arc: any) => {
      // Arm guard so globe background click doesn't fire simultaneously
      justClickedPointRef.current = true;
      setTimeout(() => { justClickedPointRef.current = false; }, 250);
      if (arc?.relation && onSelectRelation) {
        onSelectRelation(arc.relation);
      }
    },
    [onSelectRelation]
  );

  /* ── Fly to targetLocation (from terminal commands) ──────────────── */
  useEffect(() => {
    if (!targetLocation || !globeRef.current) return;
    const altitude = targetLocation.noZoom
      ? 1.8
      : targetLocation.zoom != null
      ? Math.max(0.4, 3.5 - targetLocation.zoom * 0.22)
      : 1.8;
    setCameraAltitude(altitude);

    try {
      const controls = globeRef.current.controls?.();
      if (controls) {
        controls.autoRotate = false;
      }
    } catch (e) {
      // Ignore
    }

    globeRef.current.pointOfView(
      { lat: targetLocation.lat, lng: targetLocation.lng, altitude },
      1200
    );
  }, [targetLocation]);

  /* ── Single source of truth for ALL globe camera movement & spin ───
     – Auto-rotates smoothly when unclicked in global overview.
     – Stops rotation and zooms in tight when an incident is selected.
     – Stops rotation and focuses on country when a relation network is active.
     – Resumes auto-rotation when clicking off / zoomed back out. ─────── */
  useEffect(() => {
    if (!globeRef.current) return;

    let controls: any = null;
    try {
      controls = globeRef.current.controls?.();
    } catch (e) {
      // Ignore
    }

    if (
      selectedEvent &&
      typeof selectedEvent.latitude === 'number' &&
      typeof selectedEvent.longitude === 'number'
    ) {
      // Stop spin while inspecting a selected event & scale dots down for clear separation
      if (controls) controls.autoRotate = false;
      setCameraAltitude(0.6);
      globeRef.current.pointOfView(
        { lat: selectedEvent.latitude, lng: selectedEvent.longitude, altitude: 0.6 },
        900
      );
    } else if (
      selectedConflict &&
      typeof selectedConflict.latitude === 'number' &&
      typeof selectedConflict.longitude === 'number'
    ) {
      // Stop spin while inspecting a selected conflict region
      if (controls) controls.autoRotate = false;
      setCameraAltitude(1.2);
      globeRef.current.pointOfView(
        { lat: selectedConflict.latitude, lng: selectedConflict.longitude, altitude: 1.2 },
        900
      );
    } else if (relationNetwork) {
      // Stop spin when inspecting relation network & focus on focal country!
      if (controls) controls.autoRotate = false;
      const fCoord = relationNetwork.focalCoords;
      if (fCoord && typeof fCoord.lat === 'number' && typeof fCoord.lng === 'number') {
        const altitude = 1.7;
        setCameraAltitude(altitude);
        globeRef.current.pointOfView(
          { lat: fCoord.lat, lng: fCoord.lng, altitude },
          1200
        );
      }
    } else {
      // Unclicked / zoomed out to overview -> restore original 100% size & resume smooth auto-spin
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.45;
      }
      setCameraAltitude(2.5);
      globeRef.current.pointOfView({ lat: 20, lng: 25, altitude: 2.5 }, 900);
    }
  }, [selectedEvent, selectedConflict, relationNetwork]);

  /* ── Distance helper for proximity click on relation arcs ── */
  const findNearestArc = useCallback(
    (clickLat: number, clickLng: number, maxDistanceDeg: number) => {
      let nearest: any = null;
      let minDistance = Infinity;

      for (const arc of arcsData) {
        if (
          typeof arc.startLat !== 'number' ||
          typeof arc.startLng !== 'number' ||
          typeof arc.endLat !== 'number' ||
          typeof arc.endLng !== 'number'
        ) {
          continue;
        }
        const dist = distanceToArcDeg(
          clickLat,
          clickLng,
          arc.startLat,
          arc.startLng,
          arc.endLat,
          arc.endLng
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearest = arc;
        }
      }

      if (minDistance <= maxDistanceDeg) {
        return nearest;
      }
      return null;
    },
    [arcsData]
  );

  /* ── Distance helper for proximity/fuzzy click on markers ── */
  const findNearestPoint = useCallback(
    (clickLat: number, clickLng: number, maxDistanceDeg: number) => {
      let nearest: any = null;
      let minDistance = Infinity;

      for (const pt of allPoints) {
        if (typeof pt.lat !== 'number' || typeof pt.lng !== 'number') continue;
        const dLat = pt.lat - clickLat;
        let dLng = Math.abs(pt.lng - clickLng);
        if (dLng > 180) dLng = 360 - dLng;
        const avgLatRad = ((pt.lat + clickLat) / 2) * (Math.PI / 180);
        const x = dLng * Math.cos(avgLatRad);
        const dist = Math.sqrt(dLat * dLat + x * x);

        if (dist < minDistance) {
          minDistance = dist;
          nearest = pt;
        }
      }

      if (minDistance <= maxDistanceDeg) {
        return nearest;
      }
      return null;
    },
    [allPoints]
  );

  /* ── Enhance 3D Arc Mesh Hit Margins (generous hover/click sensing without altering visual width) ── */
  const enhanceArcHitMargins = useCallback(() => {
    if (!globeRef.current) return;
    let scene: any = null;
    try {
      scene = globeRef.current.scene?.();
    } catch (e) {
      // Ignore
    }
    if (!scene) return;

    scene.traverse((obj: any) => {
      const isArcGroup = obj.__globeObjType === 'arc';
      const isArcChild = obj.parent?.__globeObjType === 'arc';

      if (isArcGroup || isArcChild) {
        const mesh = obj.isMesh ? obj : obj.children?.find((c: any) => c.isMesh);
        if (mesh && mesh.geometry && mesh.geometry.parameters?.path) {
          const currentPath = mesh.geometry.parameters.path;
          if (mesh.userData.__enhancedPath !== currentPath) {
            mesh.userData.__enhancedPath = currentPath;

            if (mesh.userData.hitGeo) {
              mesh.userData.hitGeo.dispose();
            }

            // Hit margin radius 0.75 (generous sensing margin while visual line stays sleek 0.35)
            const hitGeo = new THREE.TubeGeometry(currentPath, 32, 0.75, 6);
            mesh.userData.hitGeo = hitGeo;

            if (!mesh.userData.__origRaycast) {
              mesh.userData.__origRaycast = mesh.raycast;
              mesh.raycast = function (raycaster: any, intersects: any[]) {
                const origGeo = this.geometry;
                if (this.userData.hitGeo) {
                  this.geometry = this.userData.hitGeo;
                  this.userData.__origRaycast.call(this, raycaster, intersects);
                  this.geometry = origGeo;
                } else {
                  this.userData.__origRaycast.call(this, raycaster, intersects);
                }
              };
            }
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!arcsData.length) return;
    const t1 = setTimeout(enhanceArcHitMargins, 50);
    const t2 = setTimeout(enhanceArcHitMargins, 200);
    const t3 = setTimeout(enhanceArcHitMargins, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [arcsData, enhanceArcHitMargins]);

  /* ── Proximity Click or Deselect on globe click ───────────────────── */
  const handleGlobeClick = useCallback(
    (coords?: { lat?: number; lng?: number }) => {
      // Ignore if direct point/arc click already handled this event
      if (justClickedPointRef.current) return;

      if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
        // 1. High precision point check (within 2.2°)
        const closePoint = findNearestPoint(coords.lat, coords.lng, 2.2);
        if (closePoint) {
          handlePointClick(closePoint);
          return;
        }

        // 2. Comfortable margin arc check (within 1.8° cross-track)
        const nearArc = findNearestArc(coords.lat, coords.lng, 1.8);
        if (nearArc) {
          handleArcClick(nearArc);
          return;
        }

        // 3. Fallback to general point tolerance if zoomed out
        const currentPov = globeRef.current?.pointOfView();
        const currentAltitude = currentPov?.altitude || 2.5;
        const toleranceDeg = Math.max(4.5, currentAltitude * 3.5);

        const nearest = findNearestPoint(coords.lat, coords.lng, toleranceDeg);
        if (nearest) {
          handlePointClick(nearest);
          return;
        }
      }

      // No marker or arc nearby -> deselect and return to overview
      onSelectEvent(null);
      onSelectConflict(null);
    },
    [findNearestPoint, findNearestArc, handlePointClick, handleArcClick, onSelectEvent, onSelectConflict]
  );

  /* ── Zoom controls (manual +/- buttons) ─────────────────────────── */
  const zoomIn = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAlt = Math.max(0.25, pov.altitude * 0.65);
    setCameraAltitude(newAlt);
    globeRef.current.pointOfView({ ...pov, altitude: newAlt }, 280);
  }, []);

  const zoomOut = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAlt = Math.min(5.5, pov.altitude * 1.45);
    setCameraAltitude(newAlt);
    globeRef.current.pointOfView({ ...pov, altitude: newAlt }, 280);
  }, []);

  /* ── Ring colour interpolator ────────────────────────────────────── */
  const ringColorFn = useCallback(
    (d: any) =>
      (t: number) =>
        `rgba(${d.rgb},${Math.max(0, 1 - t)})`,
    []
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-300 ${
        theme === 'light' ? 'bg-white' : 'bg-black'
      }`}
    >
      {/* 3D Globe Canvas */}
      <Globe
        ref={globeRef}
        width={containerSize.width}
        height={containerSize.height}
        backgroundColor={theme === 'light' ? '#ffffff' : 'rgba(0,0,0,0)'}

        /* ── High-quality rendering — pixel ratio & material set in onGlobeReady */
        onGlobeReady={handleGlobeReady}
        globeImageUrl={undefined}
        bumpImageUrl={undefined}
        showAtmosphere={true}
        atmosphereColor={theme === 'light' ? '#cbd5e1' : '#0284c7'}
        atmosphereAltitude={theme === 'light' ? 0.08 : 0.14}
        showGraticules={true}

        /* ── Country polygons — Grey land in light mode, deep tactical charcoal in dark mode ── */
        polygonsData={countries.features}
        polygonCapColor={() => theme === 'light' ? '#cbd5e1' : 'rgba(18, 24, 34, 0.98)'}
        polygonSideColor={() => theme === 'light' ? '#94a3b8' : 'rgba(12, 16, 24, 0.98)'}
        polygonStrokeColor={() => theme === 'light' ? '#64748b' : '#384b64'}
        polygonAltitude={0.008}
        polygonLabel={({ properties: d }: any) =>
          d?.ADMIN || d?.NAME || d?.name
            ? `<div style="background:${theme === 'light' ? '#ffffff' : '#090d12'}; border:1px solid ${theme === 'light' ? '#64748b' : '#0284c7'}; padding:3px 8px; font-family:monospace; font-size:11px; color:${theme === 'light' ? '#000000' : '#38bdf8'}; border-radius:4px; box-shadow:${theme === 'light' ? '0 4px 14px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.8)'}; font-weight:bold;">${
                d.ADMIN || d.NAME || d.name
              }</div>`
            : ''
        }

        /* ── Flat 2D WebGL Surface Dots with Subtle Glow (Always Visible & Consistent) ── */
        customLayerData={allPoints}
        customThreeObject={customThreeObject}
        customThreeObjectUpdate={customThreeObjectUpdate}
        customLayerLabel={(d: any) => {
          const isLight = theme === 'light';
          const cardBg = isLight ? '#ffffff' : '#090d12';
          const titleColor = isLight ? '#000000' : '#ffffff';
          const subColor = isLight ? '#262626' : '#94a3b8';
          const shadow = isLight ? '0 6px 20px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.85)';

          if (d.isCluster && d.cluster) {
            const cl = d.cluster;
            return `<div style="background:${cardBg}; border:1.5px solid ${d.color}; padding:6px 10px; font-family:monospace; font-size:11px; max-width:280px; border-radius:4px; box-shadow:${shadow};">
              <div style="color:${d.color}; font-weight:bold; font-size:11px; margin-bottom:3px;">
                ⚡ [DANGER ZONE / BATTLEFRONT] ${cl.label.toUpperCase()}
              </div>
              <div style="color:${titleColor}; font-size:10px;">
                SECTOR: <strong style="color:${titleColor};">${cl.dominantCountry}</strong> • THREAT: <span style="color:${d.color}; font-weight:bold;">${cl.threatLevel}</span>
              </div>
              <div style="color:${subColor}; font-size:10px; margin-top:2px;">
                KINETIC INCIDENTS: ${cl.eventCount} | THERMAL: ${cl.firmsCount} (MAX FRP: ${cl.maxFrp} MW)
              </div>
              ${cl.driftKmPerDay > 0 ? `
              <div style="color:${isLight ? '#0284c7' : '#38bdf8'}; font-size:10px; margin-top:2px; font-weight:bold;">
                DRIFT VECTOR: ${cl.headingDeg}° @ ${cl.driftKmPerDay} KM/DAY
              </div>` : ''}
            </div>`;
          }
          if (d.isTheater && d.conflict) {
            const c: Conflict = d.conflict;
            return `<div style="background:${cardBg}; border:1.5px solid ${d.color}; padding:6px 10px; font-family:monospace; font-size:11px; max-width:280px; border-radius:4px; box-shadow:${shadow};">
              <div style="color:${d.color}; font-weight:bold; font-size:11px; margin-bottom:3px;">
                [THEATER] ${c.name.toUpperCase()}
              </div>
              <div style="color:${titleColor}; font-size:10px;">
                STATUS: <span style="color:${d.color}; font-weight:bold;">${c.status}</span> • INTENSITY: ${c.intensity}%
              </div>
              <div style="color:${subColor}; font-size:10px; margin-top:2px;">
                ${c.eventCount7d || c.recentEvents?.length || 0} INCIDENTS IN LAST 7 DAYS
              </div>
            </div>`;
          }
          const ev: ConflictEvent = d.event;
          if (!ev) {
            if (d.firmsProp) {
              return `<div style="background:${cardBg}; border:1.5px solid ${isLight ? '#991b1b' : '#ff3b00'}; padding:4px 8px; font-family:monospace; font-size:10px; color:${titleColor}; border-radius:4px; box-shadow:${shadow};">
                <div style="color:${isLight ? '#991b1b' : '#ff3b00'}; font-weight:bold;">THERMAL HOTSPOT</div>
                <div>FRP: ${d.firmsProp.frp || 'N/A'} MW</div>
              </div>`;
            }
            if (d.aviationProp) {
              return `<div style="background:${cardBg}; border:1.5px solid ${isLight ? '#0f172a' : '#00e5ff'}; padding:4px 8px; font-family:monospace; font-size:10px; color:${titleColor}; border-radius:4px; box-shadow:${shadow};">
                <div style="color:${isLight ? '#0f172a' : '#00e5ff'}; font-weight:bold;">${d.aviationProp.callsign || 'MIL-AIR'} (${d.aviationProp.typeCode || 'AIRCRAFT'})</div>
              </div>`;
            }
            return '';
          }

          // Format AI verification badge
          const confLabel = d.verifiedInfo?.confidenceLabel
            ? (d.verifiedInfo.confidenceScore >= 0.70
                ? `<span style="background:${isLight ? 'rgba(20,83,45,0.1)' : 'rgba(16,185,129,0.2)'}; color:${isLight ? '#14532d' : '#10b981'}; border:1px solid ${isLight ? 'rgba(20,83,45,0.4)' : 'rgba(16,185,129,0.5)'}; padding:1px 4px; font-weight:bold; font-size:9px; border-radius:2px;">[${d.verifiedInfo.confidenceLabel}]</span>`
                : `<span style="background:${isLight ? 'rgba(127,29,29,0.1)' : 'rgba(239,68,68,0.2)'}; color:${isLight ? '#7f1d1d' : '#f87171'}; border:1px solid ${isLight ? 'rgba(127,29,29,0.4)' : 'rgba(239,68,68,0.5)'}; padding:1px 4px; font-weight:bold; font-size:9px; border-radius:2px;">[${d.verifiedInfo.confidenceLabel}]</span>`)
            : `<span style="background:${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(148,163,184,0.15)'}; color:${isLight ? '#333333' : '#94a3b8'}; border:1px solid ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(148,163,184,0.3)'}; padding:1px 4px; font-weight:bold; font-size:9px; border-radius:2px;">[UNVERIFIED 40%]</span>`;

          return `<div style="background:${cardBg}; border:1.5px solid ${d.color}; padding:6px 9px; font-family:monospace; font-size:11px; max-width:260px; border-radius:4px; box-shadow:${shadow};">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:3px;">
              <span style="color:${d.color}; font-weight:bold; font-size:10px;">[${ev.severity}]</span>
              ${confLabel}
            </div>
            <div style="color:${titleColor}; font-weight:bold; font-size:11px; margin-bottom:2px;">
              ${ev.location ? `${ev.location}, ` : ''}${ev.country}
            </div>
            <div style="color:${subColor}; font-size:10px;">
              ${ev.eventType}
            </div>
            ${typeof ev.fatalities === 'number' && ev.fatalities > 0 ? `<div style="color:${isLight ? '#7f1d1d' : '#ff2247'}; font-size:10px; margin-top:2px; font-weight:bold;">${ev.fatalities} CASUALTIES</div>` : ''}
            ${d.verifiedInfo?.activeSorties?.length ? `<div style="color:${isLight ? '#0369a1' : '#38bdf8'}; font-size:9px; margin-top:2px;">SORTIES: ${d.verifiedInfo.activeSorties.slice(0, 2).join(', ')}</div>` : ''}
          </div>`;
        }}
        onCustomLayerClick={(d: any) => handlePointClick(d)}
        onCustomLayerHover={(d: any) => {
          setIsDotHovered(!!d);
          if (containerRef.current) {
            containerRef.current.style.cursor = d ? 'pointer' : 'default';
          }
        }}

        /* ── Dynamic pulse rings: selected event, conflict theaters, or escalation hotspots ── */
        ringsData={ringsData}
        ringColor={ringColorFn}
        ringAltitude={0.018}
        ringMaxRadius={(d: any) => d.maxRadius || 4.5}
        ringPropagationSpeed={mapMode === 'ESCALATION' ? 1.6 : Math.max(0.8, 1.0 + (threatIndex / 100) * 1.5)}
        ringRepeatPeriod={
          threatIndex >= 80 ? 450 :
          threatIndex >= 60 ? 600 :
          threatIndex >= 40 ? 800 :
          mapMode === 'ESCALATION' ? 700 : 1000
        }

        /* ── Relationship network arcs ───────────────────────── */
        arcsData={arcsData}
        arcColor={(d: any) => d.color}
        arcAltitude={(d: any) => d.altitude}
        arcStroke={(d: any) => d.stroke || 0.35}
        arcCurveResolution={64}
        arcCircularResolution={8}
        arcDashLength={1}
        arcDashGap={0}
        arcDashInitialGap={0}
        arcDashAnimateTime={0}
        arcLabel={(d: any) => {
          if (!d?.relation) return '';
          const isLight = theme === 'light';
          const rel: CountryRelation = d.relation;
          const isOutgoing = rel.direction === 'OUTGOING';
          const color = isLight
            ? (isOutgoing ? '#0f172a' : '#7f1d1d')
            : (isOutgoing ? '#00e5ff' : '#ff2247');
          const dirLabel = isOutgoing ? 'OUTGOING VECTOR' : 'INCOMING VECTOR';
          const reason = rel.strategicContext || rel.primaryReason || '';
          const incidents = rel.eventCount || rel.relatedEvents?.length || 0;
          const fatalities = rel.fatalities || 0;
          const cardBg = isLight ? '#ffffff' : '#090d12';
          const titleColor = isLight ? '#000000' : '#ffffff';
          const subColor = isLight ? '#262626' : '#94a3b8';
          const shadow = isLight ? '0 6px 20px rgba(0,0,0,0.12)' : '0 6px 20px rgba(0,0,0,0.95)';

          return `<div style="background:${cardBg}; border:1.5px solid ${color}; padding:8px 12px; font-family:monospace; font-size:11px; max-width:290px; border-radius:4px; box-shadow:${shadow}; pointer-events:none;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
              <span style="color:${color}; font-weight:bold; font-size:10px; letter-spacing:0.5px;">[${dirLabel}]</span>
              <span style="color:${subColor}; font-size:9px; font-weight:bold;">TACTICAL INTEL</span>
            </div>
            <div style="color:${titleColor}; font-weight:bold; font-size:12px; margin-bottom:4px; letter-spacing:0.3px;">
              ${rel.fromCountry} <span style="color:${color};">➔</span> ${rel.toCountry}
            </div>
            ${reason ? `<div style="color:${subColor}; font-size:10px; line-height:1.4; margin-bottom:6px; border-left:2px solid ${color}; padding-left:6px;">${reason}</div>` : ''}
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:10px; padding-top:4px; border-top:1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};">
              <span style="color:${subColor};">INCIDENTS: <strong style="color:${titleColor};">${incidents}</strong></span>
              ${fatalities > 0 ? `<span style="color:${isLight ? '#7f1d1d' : '#ff2247'}; font-weight:bold;">${fatalities} CASUALTIES</span>` : `<span style="color:${isLight ? '#14532d' : '#22c55e'};">MONITORED</span>`}
            </div>
            <div style="color:${color}; font-size:9px; margin-top:5px; text-align:right; font-weight:bold; opacity:0.85;">CLICK LINE TO OPEN INTEL DOSSIER »</div>
          </div>`;
        }}
        onArcClick={handleArcClick}
        onArcHover={(arc: any) => {
          setIsDotHovered(!!arc);
          if (containerRef.current) {
            containerRef.current.style.cursor = arc ? 'pointer' : 'default';
          }
        }}

        /* ── Proximity click detection on ocean, land, or empty space ── */
        onGlobeClick={(coords: any) => handleGlobeClick(coords)}
        onPolygonClick={(_polygon: any, _event: any, coords: any) => handleGlobeClick(coords)}
        onZoom={(pov: any) => {
          if (pov?.altitude && typeof pov.altitude === 'number') {
            setCameraAltitude(pov.altitude);
          }
          enhanceArcHitMargins();
        }}
      />

      {/* Tactical cursor overlay */}
      <TacticalBleedmarkCursor containerRef={containerRef} isDotHovered={isDotHovered} />

      {/* Active relation network HUD pill */}
      {relationNetwork && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 glass-panel border border-cyan-500/40 px-3.5 py-1.5 font-mono text-[11px] shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-full">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="text-cyan-300 font-bold uppercase tracking-wider">
            [VECTORS ACTIVE] {relationNetwork.focalCountry}
          </span>
          <span className="text-slate-400 text-[10px]">
            &bull; {relationNetwork.relations.length} VECTORS &bull; {relationNetwork.connectedCountries.length} THEATERS
          </span>
          {onClearRelationNetwork && (
            <button
              onClick={onClearRelationNetwork}
              className="text-slate-400 hover:text-red-400 ml-1.5 transition-colors cursor-pointer"
              title="Close vector network"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div
        style={{ right: rightInset > 0 ? `${rightInset + 12}px` : undefined }}
        className={`absolute top-3 ${rightInset > 0 ? '' : 'right-3'} z-20 flex items-center gap-1 glass-panel border border-white/12 p-1 font-mono shadow-[0_8px_24px_rgba(0,0,0,0.6)] rounded-full transition-all duration-300 pointer-events-auto`}
      >
        <button
          onClick={zoomIn}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-full"
          title="Zoom In (+)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={zoomOut}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer rounded-full"
          title="Zoom Out (-)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map mode selector & FIRMS / aviation toggles */}
      <MapLegend
        style={{ left: leftInset > 0 ? `${leftInset + 16}px` : undefined }}
        activePage="MAIN"
        mapMode={mapMode}
        onChangeMode={onChangeMapMode}
        showFirms={showFirms}
        onToggleFirms={onToggleFirms}
        firmsCount={firmsCount}
        isFirmsLoading={isFirmsLoading}
        showAviation={showAviation}
        onToggleAviation={onToggleAviation}
        aviationCount={aviationCount}
        isAviationLoading={isAviationLoading}
      />
    </div>
  );
};
