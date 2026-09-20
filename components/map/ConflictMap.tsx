'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ConflictEvent, Conflict, MapMode, Severity } from '@/types/conflict';
import { MapLegend } from './MapLegend';
import { TacticalBleedmarkCursor } from './TacticalBleedmarkCursor';
import { formatShortDate } from '@/lib/data/date-utils';
import { Plus, Minus } from 'lucide-react';

import { RelationshipNetwork, CountryRelation } from '@/lib/data/country-relationships';

interface ConflictMapProps {
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
  showFirms?: boolean;
  onToggleFirms?: () => void;
  firmsGeoJson?: any;
  firmsCount?: number;
  isFirmsLoading?: boolean;
}

const TACTICAL_CURSOR_SVG = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='32'%20height='32'%20viewBox='0%200%2032%2032'%20fill='none'%3E%3Cdefs%3E%3Cfilter%20id='s'%20x='-30%25'%20y='-30%25'%20width='160%25'%20height='160%25'%3E%3CfeDropShadow%20dx='0'%20dy='0'%20stdDeviation='1.2'%20flood-color='%23000000'%20flood-opacity='0.9'/%3E%3C/filter%3E%3C/defs%3E%3Cg%20filter='url(%23s)'%20stroke='%23ffffff'%20stroke-width='1.5'%20stroke-linecap='round'%3E%3Cline%20x1='9'%20y1='16'%20x2='13.5'%20y2='16'/%3E%3Cline%20x1='18.5'%20y1='16'%20x2='23'%20y2='16'/%3E%3Cline%20x1='16'%20y1='9'%20x2='16'%20y2='13.5'/%3E%3Cline%20x1='16'%20y1='18.5'%20x2='16'%20y2='23'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='1.25'%20fill='%23ffffff'%20stroke='none'/%3E%3C/g%3E%3C/svg%3E") 16 16, crosshair`;
const TACTICAL_LOCK_SVG = TACTICAL_CURSOR_SVG;

function registerTacticalMilitaryIcons(map: any) {
  if (typeof document === 'undefined') return;

  const createIconData = (
    shape: 'diamond' | 'diamond-lock' | 'square' | 'circle' | 'recon' | 'arrow',
    fillColor: string,
    strokeColor: string,
    accentColor?: string
  ) => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);

    if (shape === 'diamond' || shape === 'diamond-lock') {
      // 1. Lightweight modern corner brackets for active frontline (<24H)
      if (shape === 'diamond-lock' && accentColor) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'square';

        const arm = 9;
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(8, 8 + arm);
        ctx.lineTo(8, 8);
        ctx.lineTo(8 + arm, 8);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(56 - arm, 8);
        ctx.lineTo(56, 8);
        ctx.lineTo(56, 8 + arm);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(8, 56 - arm);
        ctx.lineTo(8, 56);
        ctx.lineTo(8 + arm, 56);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(56 - arm, 56);
        ctx.lineTo(56, 56);
        ctx.lineTo(56, 56 - arm);
        ctx.stroke();
      }

      // 2. Modern Tactical NATO Lozenge (Diamond)
      ctx.beginPath();
      ctx.moveTo(32, 13);
      ctx.lineTo(51, 32);
      ctx.lineTo(32, 51);
      ctx.lineTo(13, 32);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 3. Precision optical crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(24, 32);
      ctx.lineTo(40, 32);
      ctx.moveTo(32, 24);
      ctx.lineTo(32, 40);
      ctx.stroke();

      // Optical center pinpoint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 32, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'square') {
      // Modern Tactical Alert Square
      const x = 16;
      const y = 16;
      const w = 32;
      const h = 32;

      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x, y, w, h, 3);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner tactical crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(24, 32);
      ctx.lineTo(40, 32);
      ctx.moveTo(32, 24);
      ctx.lineTo(32, 40);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 32, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'circle') {
      // Modern Tactical Patrolled Post
      ctx.beginPath();
      ctx.arc(32, 32, 16, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Precision center dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32, 32, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (shape === 'recon') {
      // Modern Sleek Scout Lozenge
      ctx.beginPath();
      ctx.moveTo(32, 18);
      ctx.lineTo(46, 32);
      ctx.lineTo(32, 46);
      ctx.lineTo(18, 32);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(32, 32, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'arrow') {
      // Aerodynamic tactical chevron arrowhead pointing East (along 0 deg tangent)
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(48, 32);
      ctx.lineTo(14, 50);
      ctx.lineTo(24, 32);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 5;
      ctx.fill();

      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Sharp central optical groove
      ctx.beginPath();
      ctx.moveTo(24, 32);
      ctx.lineTo(44, 32);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    return ctx.getImageData(0, 0, size, size);
  };

  const icons: Array<{
    id: string;
    shape: 'diamond' | 'diamond-lock' | 'square' | 'circle' | 'recon' | 'arrow';
    fillColor: string;
    strokeColor: string;
    accentColor?: string;
  }> = [
    { id: 'army-critical', shape: 'diamond', fillColor: '#dc2626', strokeColor: '#0f172a' },
    { id: 'army-critical-24h', shape: 'diamond-lock', fillColor: '#dc2626', strokeColor: '#0f172a', accentColor: '#22c55e' },
    { id: 'army-high', shape: 'diamond', fillColor: '#ea580c', strokeColor: '#0f172a' },
    { id: 'army-high-24h', shape: 'diamond-lock', fillColor: '#ea580c', strokeColor: '#0f172a', accentColor: '#22c55e' },
    { id: 'army-moderate', shape: 'square', fillColor: '#ca8a04', strokeColor: '#0f172a' },
    { id: 'army-moderate-24h', shape: 'diamond-lock', fillColor: '#ca8a04', strokeColor: '#0f172a', accentColor: '#22c55e' },
    { id: 'army-low', shape: 'circle', fillColor: '#4d7c0f', strokeColor: '#0f172a' },
    { id: 'army-news', shape: 'recon', fillColor: '#64748b', strokeColor: '#0f172a' },
    { id: 'army-global', shape: 'circle', fillColor: '#0284c7', strokeColor: '#0f172a' },
    { id: 'vector-arrow-cyan', shape: 'arrow', fillColor: '#06b6d4', strokeColor: '#050a12' },
    { id: 'vector-arrow-red', shape: 'arrow', fillColor: '#ef4444', strokeColor: '#050a12' },
  ];

  for (const { id, shape, fillColor, strokeColor, accentColor } of icons) {
    const imgData = createIconData(shape, fillColor, strokeColor, accentColor);
    if (!imgData) continue;
    if (map.hasImage(id)) {
      map.removeImage(id);
    }
    map.addImage(id, imgData, { pixelRatio: 2 });
  }
}

export const ConflictMap: React.FC<ConflictMapProps> = ({
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
  showFirms = false,
  onToggleFirms,
  firmsGeoJson,
  firmsCount,
  isFirmsLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDotHovered, setIsDotHovered] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const clickPopupRef = useRef<any>(null);

  // References to always access the freshest state in closures
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const conflictsRef = useRef(conflicts);
  conflictsRef.current = conflicts;

  const selectedEventRef = useRef(selectedEvent);
  selectedEventRef.current = selectedEvent;

  const selectedConflictRef = useRef(selectedConflict);
  selectedConflictRef.current = selectedConflict;

  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;

  const onOpenEventModalRef = useRef(onOpenEventModal);
  onOpenEventModalRef.current = onOpenEventModal;

  const onSelectConflictRef = useRef(onSelectConflict);
  onSelectConflictRef.current = onSelectConflict;

  const onSelectRelationRef = useRef(onSelectRelation);
  onSelectRelationRef.current = onSelectRelation;

  const relationNetworkRef = useRef(relationNetwork);
  relationNetworkRef.current = relationNetwork;

  const radiatingMarkerRef = useRef<any>(null);
  const maplibreModuleRef = useRef<any>(null);

  const setRadiatingBeacon = useCallback((lng: number, lat: number, color = '#dc2626') => {
    if (!mapInstanceRef.current || !maplibreModuleRef.current) return;
    const map = mapInstanceRef.current;
    const maplibre = maplibreModuleRef.current;

    if (!radiatingMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'warroom-radiating-marker';
      el.style.cssText = `
        width: 38px;
        height: 38px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        color: ${color};
      `;

      el.innerHTML = `
        <div class="warroom-modern-reticle">
          <div class="warroom-modern-brackets"></div>
          <div class="warroom-modern-crosshairs"></div>
        </div>
      `;

      radiatingMarkerRef.current = new maplibre.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      radiatingMarkerRef.current.setLngLat([lng, lat]);
      const el = radiatingMarkerRef.current.getElement();
      if (el) {
        el.style.color = color;
      }
    }
  }, []);

  const removeRadiatingBeacon = useCallback(() => {
    if (radiatingMarkerRef.current) {
      radiatingMarkerRef.current.remove();
      radiatingMarkerRef.current = null;
    }
  }, []);

  // ── Hovered Animated Line Controller ────────────────────────────────────────
  const lineAnimationRef = useRef<{ animId: number | null; activeRelId: string | null }>({
    animId: null,
    activeRelId: null,
  });

  const stopLineAnimation = useCallback(() => {
    if (lineAnimationRef.current.animId !== null) {
      cancelAnimationFrame(lineAnimationRef.current.animId);
      lineAnimationRef.current.animId = null;
      lineAnimationRef.current.activeRelId = null;
    }
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const hSource = map.getSource('warroom-hovered-relationship-line');
      if (hSource) hSource.setData({ type: 'FeatureCollection', features: [] });
      const tSource = map.getSource('warroom-hovered-tracer');
      if (tSource) tSource.setData({ type: 'FeatureCollection', features: [] });
    }
  }, []);

  const startLineAnimation = useCallback((feature: any) => {
    if (!mapInstanceRef.current || !feature || !feature.geometry || !feature.geometry.coordinates) return;
    const map = mapInstanceRef.current;
    const hSource = map.getSource('warroom-hovered-relationship-line');
    const tSource = map.getSource('warroom-hovered-tracer');
    if (!hSource || !tSource) return;

    const relId = feature.properties?.id;
    if (lineAnimationRef.current.activeRelId === relId && lineAnimationRef.current.animId !== null) {
      return; // Already animating this line
    }

    if (lineAnimationRef.current.animId !== null) {
      cancelAnimationFrame(lineAnimationRef.current.animId);
    }
    lineAnimationRef.current.activeRelId = relId;

    // Light up the hovered line
    hSource.setData({
      type: 'FeatureCollection',
      features: [feature],
    });

    const rawCoords: Array<[number, number]> = feature.geometry.coordinates;
    if (!rawCoords || rawCoords.length < 2) return;

    const totalPoints = rawCoords.length;
    const duration = 1200; // 1.2s per full pulse cycle
    const animStart = performance.now();

    const frame = (now: number) => {
      const elapsed = now - animStart;
      const progress = (elapsed % duration) / duration; // 0.0 to 1.0

      const totalSegments = totalPoints - 1;
      const exactIndex = progress * totalSegments;
      const baseIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
      const frac = exactIndex - baseIndex;

      const p1 = rawCoords[baseIndex];
      const p2 = rawCoords[baseIndex + 1];
      const headLng = p1[0] + (p2[0] - p1[0]) * frac;
      const headLat = p1[1] + (p2[1] - p1[1]) * frac;

      // Trailing kinetic comet (~25% of line length behind the head)
      const tailLength = 0.25;
      const tailStartProgress = Math.max(0, progress - tailLength);
      const tailStartIndex = Math.min(Math.floor(tailStartProgress * totalSegments), totalSegments - 1);

      const tailCoords = rawCoords.slice(tailStartIndex, baseIndex + 1);
      tailCoords.push([headLng, headLat]);

      tSource.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: tailCoords,
            },
            properties: {
              color: feature.properties?.color || '#06b6d4',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [headLng, headLat],
            },
            properties: {
              color: feature.properties?.color || '#06b6d4',
            },
          },
        ],
      });

      lineAnimationRef.current.animId = requestAnimationFrame(frame);
    };

    lineAnimationRef.current.animId = requestAnimationFrame(frame);
  }, []);

  const startLineAnimationRef = useRef(startLineAnimation);
  startLineAnimationRef.current = startLineAnimation;

  const stopLineAnimationRef = useRef(stopLineAnimation);
  stopLineAnimationRef.current = stopLineAnimation;

  const [mapLoaded, setMapLoaded] = useState(false);

  // 100% Free, zero-API-key dark basemap (no CARTO watermark or key requirement)
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

  // Close map popups on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clickPopupRef.current?.remove();
        removeRadiatingBeacon();
        if (onSelectEventRef.current) onSelectEventRef.current(null);
        if (onSelectConflictRef.current) onSelectConflictRef.current(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeRadiatingBeacon]);

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
          center: [25, 20], // Centered on Mediterranean / Middle East / Global view
          zoom: 2.2,
          minZoom: 1.5,
          maxZoom: 14,
          attributionControl: false,
        });

        clickPopupRef.current = new maplibre.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 14,
          className: 'warroom-click-popup',
          maxWidth: '350px',
        });

        clickPopupRef.current.on('close', () => {
          if (onSelectEventRef.current) onSelectEventRef.current(null);
          if (onSelectConflictRef.current) onSelectConflictRef.current(null);
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapInstanceRef.current = map;
          setMapLoaded(true);
          try {
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
          } catch (e) {
            // Ignore if canvas not yet attached
          }

          // Register authentic military tactical icons into MapLibre
          registerTacticalMilitaryIcons(map);

          // Add GeoJSON sources — NO clustering so every dot is always individually visible
          map.addSource('warroom-conflict-events', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: false,
          });

          map.addSource('warroom-general-news', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
            cluster: false,
          });

          map.addSource('warroom-conflicts', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // NASA FIRMS Satellite Thermal Anomaly GeoJSON Source
          map.addSource('warroom-firms-hotspots', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // 1. Heatmap Layer (conflict events only, HEATMAP mode)
          map.addLayer({
            id: 'events-heat',
            type: 'heatmap',
            source: 'warroom-conflict-events',
            maxzoom: 9,
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'fatalities'], 0, 0.2, 10, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
              'heatmap-color': [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(77, 124, 15, 0)',
                0.25, '#4d7c0f',
                0.5, '#ca8a04',
                0.75, '#ea580c',
                1, '#dc2626',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 25],
              'heatmap-opacity': 0.8,
            },
            layout: { visibility: 'none' },
          });

          // ── Tactical Relationship Trajectory Lines (Kinetic Vectors) ───────
          map.addSource('warroom-relationship-lines', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // 1. Elevated Glow Halo
          map.addLayer({
            id: 'relationship-lines-glow',
            type: 'line',
            source: 'warroom-relationship-lines',
            paint: {
              'line-color': ['get', 'glowColor'],
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                2, 5.0,
                6, 12.0,
              ],
              'line-blur': 4,
              'line-opacity': 0.75,
            },
          });

          // 2. Main Directed Vector (Cyan for Outgoing, Red for Incoming)
          map.addLayer({
            id: 'relationship-lines',
            type: 'line',
            source: 'warroom-relationship-lines',
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                2, 2.4,
                6, 4.0,
              ],
              'line-opacity': 0.95,
            },
          });

          // 3. Kinetic Core Pulsing Dash
          map.addLayer({
            id: 'relationship-lines-dash',
            type: 'line',
            source: 'warroom-relationship-lines',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.4,
              'line-dasharray': [2, 5],
              'line-opacity': 0.85,
            },
          });

          // 4. Directional Tactical Vector Arrows along the lines
          map.addLayer({
            id: 'relationship-lines-arrows',
            type: 'symbol',
            source: 'warroom-relationship-lines',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 60,
              'icon-image': [
                'match',
                ['get', 'direction'],
                'OUTGOING', 'vector-arrow-cyan',
                'vector-arrow-red',
              ],
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                2, 0.40,
                5, 0.52,
                9, 0.70,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-rotation-alignment': 'map',
              'icon-keep-upright': false,
            },
          });

          // ── Hovered Animated Line Layers ───────────────────────────────────
          map.addSource('warroom-hovered-relationship-line', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          map.addSource('warroom-hovered-tracer', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          });

          // 5. Intense Animated Glow for Hovered Line
          map.addLayer({
            id: 'hovered-line-glow',
            type: 'line',
            source: 'warroom-hovered-relationship-line',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                2, 8.0,
                6, 16.0,
              ],
              'line-blur': 6,
              'line-opacity': 0.95,
            },
          });

          // 6. High-contrast Core for Hovered Line
          map.addLayer({
            id: 'hovered-line-core',
            type: 'line',
            source: 'warroom-hovered-relationship-line',
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                2, 3.2,
                6, 5.0,
              ],
              'line-opacity': 0.95,
            },
          });

          // 7. Hovered Line Highlighted Arrows
          map.addLayer({
            id: 'hovered-line-arrows',
            type: 'symbol',
            source: 'warroom-hovered-relationship-line',
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 48,
              'icon-image': [
                'match',
                ['get', 'direction'],
                'OUTGOING', 'vector-arrow-cyan',
                'vector-arrow-red',
              ],
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                2, 0.55,
                5, 0.72,
                9, 0.95,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-rotation-alignment': 'map',
              'icon-keep-upright': false,
            },
          });

          // 8. Kinetic Traveling Pulse Comet Trail
          map.addLayer({
            id: 'hovered-tracer-trail',
            type: 'line',
            source: 'warroom-hovered-tracer',
            filter: ['==', '$type', 'LineString'],
            layout: {
              'line-cap': 'round',
              'line-join': 'round',
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': [
                'interpolate', ['linear'], ['zoom'],
                2, 3.5,
                6, 6.0,
              ],
              'line-blur': 2,
              'line-opacity': 0.95,
            },
          });

          // 9. Kinetic Traveling Pulse Leading Orb Head
          map.addLayer({
            id: 'hovered-tracer-head',
            type: 'circle',
            source: 'warroom-hovered-tracer',
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-color': '#ffffff',
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                2, 4.5,
                6, 7.5,
              ],
              'circle-stroke-color': ['get', 'color'],
              'circle-stroke-width': 2.5,
              'circle-blur': 0.15,
            },
          });

          // 10. Invisible hit-target buffer for effortless clicking
          map.addLayer({
            id: 'relationship-lines-hit',
            type: 'line',
            source: 'warroom-relationship-lines',
            paint: {
              'line-width': 24,
              'line-opacity': 0,
            },
          });

          // 2. Tactical Military Operational Symbology
          // 2a. Armed Conflict Frontline Markers (NATO Tactical Symbols)
          map.addLayer({
            id: 'warroom-tactical-markers',
            type: 'symbol',
            source: 'warroom-conflict-events',
            layout: {
              'icon-image': ['get', 'markerIcon'],
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                1, 0.36,
                4, 0.48,
                7, 0.68,
                11, 0.92,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-pitch-alignment': 'map',
            },
          });

          // 2b. Tactical Recon & Intelligence Dispatches (Scout Lozenges)
          map.addLayer({
            id: 'warroom-news-markers',
            type: 'symbol',
            source: 'warroom-general-news',
            layout: {
              'icon-image': ['get', 'markerIcon'],
              'icon-size': [
                'interpolate', ['linear'], ['zoom'],
                1, 0.28,
                4, 0.38,
                7, 0.54,
                11, 0.76,
              ],
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'icon-pitch-alignment': 'map',
            },
          });

          // 3. Invisible hit-target layers for responsive clicking and hovering
          map.addLayer({
            id: 'conflict-dots-hit',
            type: 'circle',
            source: 'warroom-conflict-events',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 14,
                5, 16,
                10, 20,
              ],
              'circle-opacity': 0,
              'circle-stroke-width': 0,
            },
          });

          map.addLayer({
            id: 'news-dots-hit',
            type: 'circle',
            source: 'warroom-general-news',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 12,
                5, 14,
                10, 18,
              ],
              'circle-opacity': 0,
              'circle-stroke-width': 0,
            },
          });

          // 4b. Military Sector Boundary
          map.addLayer({
            id: 'conflict-centroids',
            type: 'circle',
            source: 'warroom-conflicts',
            paint: {
              'circle-color': [
                'match',
                ['get', 'status'],
                'ESCALATING', 'rgba(185, 28, 28, 0.08)',
                'DEESCALATING', 'rgba(77, 124, 15, 0.08)',
                'rgba(161, 98, 7, 0.08)',
              ],
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'intensity'],
                0, 16,
                50, 28,
                100, 42,
              ],
              'circle-stroke-width': 1.4,
              'circle-stroke-color': [
                'match',
                ['get', 'status'],
                'ESCALATING', '#dc2626',
                'DEESCALATING', '#4d7c0f',
                '#ca8a04',
              ],
              'circle-stroke-opacity': 0.85,
            },
            layout: { visibility: 'none' },
          });

          // Conflict Labels Layer
          map.addLayer({
            id: 'conflict-labels',
            type: 'symbol',
            source: 'warroom-conflicts',
            layout: {
              'text-field': '{name}\n[{eventCount} EVTS]',
              'text-size': 10,
              'text-offset': [0, 2],
              'text-anchor': 'top',
              'text-font': ['Open Sans Bold'],
              visibility: 'none',
            },
            paint: {
              'text-color': '#94a3b8',
              'text-halo-color': '#0a0e14',
              'text-halo-width': 1.5,
            },
          });

          // ── NASA FIRMS Satellite Thermal Anomaly & Kinetic Strike Layers ────
          // 1. Incandescent Thermal Halo Glow (scaled by Fire Radiative Power MW)
          map.addLayer({
            id: 'firms-thermal-glow',
            type: 'circle',
            source: 'warroom-firms-hotspots',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, ['interpolate', ['linear'], ['get', 'frp'], 5, 2.5, 50, 7, 150, 14],
                5, ['interpolate', ['linear'], ['get', 'frp'], 5, 5, 50, 14, 150, 28],
                10, ['interpolate', ['linear'], ['get', 'frp'], 5, 10, 50, 24, 150, 48],
              ],
              'circle-color': [
                'interpolate', ['linear'], ['get', 'frp'],
                5, '#f59e0b',   // Amber
                25, '#f97316',  // Orange
                60, '#ef4444',  // Red
                120, '#ffffff', // Incandescent Blast White
              ],
              'circle-blur': 0.6,
              'circle-opacity': 0.75,
            },
            layout: { visibility: 'none' },
          });

          // 2. Precision Thermal Reticle Core
          map.addLayer({
            id: 'firms-thermal-core',
            type: 'circle',
            source: 'warroom-firms-hotspots',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 1.5,
                5, 2.5,
                10, 4.0,
              ],
              'circle-color': '#ffffff',
              'circle-stroke-width': 1.2,
              'circle-stroke-color': '#f97316',
              'circle-opacity': 0.95,
            },
            layout: { visibility: 'none' },
          });

          // 3. Invisible Hit-target for clicking & hovering
          map.addLayer({
            id: 'firms-thermal-hit',
            type: 'circle',
            source: 'warroom-firms-hotspots',
            paint: {
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 8,
                5, 12,
                10, 18,
              ],
              'circle-opacity': 0,
              'circle-stroke-width': 0,
            },
            layout: { visibility: 'none' },
          });

          // Function to open popup for an event dot (works for both conflict and news dots)
          let lastDotClickTime = 0;
          let lastDotClickId = '';

          const openEventPopup = (feature: any, coords: any) => {
            if (!feature) return;

            const props = feature.properties;
            const now = Date.now();

            // Ignore duplicate layer click from the same user click (e.g. dots + hit-target layer firing together)
            if (now - lastDotClickTime < 250 && lastDotClickId === String(props.id)) {
              return;
            }
            lastDotClickTime = now;
            lastDotClickId = String(props.id);

            // Toggle behavior: clicking the SAME dot again closes news and returns to terminal
            if (selectedEventRef.current && String(selectedEventRef.current.id) === String(props.id)) {
              clickPopupRef.current?.remove();
              removeRadiatingBeacon();
              selectedEventRef.current = null;
              selectedConflictRef.current = null;
              if (onSelectEventRef.current) onSelectEventRef.current(null);
              if (onSelectConflictRef.current) onSelectConflictRef.current(null);
              return;
            }

            let foundEvent = eventsRef.current.find((ev) => String(ev.id) === String(props.id));
            if (!foundEvent) {
              // Fallback: reconstruct valid ConflictEvent so selection & news display never fails
              foundEvent = {
                id: String(props.id),
                eventDate: props.date || new Date().toISOString().split('T')[0],
                country: props.country || 'Global',
                location: props.location || 'Unknown',
                latitude: coords ? coords[1] : undefined,
                longitude: coords ? coords[0] : undefined,
                eventType: props.eventType || 'News Dispatch',
                severity: (props.severity as Severity) || 'LOW',
                verificationStatus: 'REPORTED',
                isConflict: props.isConflict === true || props.isConflict === 'true',
                source: props.source || 'VERIFIED DISPATCH',
                sourceUrl: props.sourceUrl || '',
                notes: props.notes || '',
                mergedCount: props.mergedCount || 1,
              };
            }

            selectedEventRef.current = foundEvent;

            // Guaranteed immediate zoom & center on the clicked dot every single time
            if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              map.flyTo({
                center: [coords[0], coords[1]],
                zoom: Math.max(map.getZoom() < 7 ? 7 : map.getZoom(), 7),
                duration: 800,
              });
            } else if (foundEvent && typeof foundEvent.longitude === 'number' && typeof foundEvent.latitude === 'number') {
              map.flyTo({
                center: [foundEvent.longitude, foundEvent.latitude],
                zoom: Math.max(map.getZoom() < 7 ? 7 : map.getZoom(), 7),
                duration: 800,
              });
            }

            // Immediately activate radiating tactical beacon on the opened dot
            const isNewsItem = props.isConflict === false || props.isConflict === 'false';
            const accentColor = isNewsItem ? '#64748b' : (
              props.severity === 'CRITICAL' ? '#dc2626' :
              props.severity === 'HIGH' ? '#ea580c' :
              props.severity === 'MODERATE' ? '#ca8a04' :
              props.severity === 'LOW' ? '#4d7c0f' : '#dc2626'
            );
            const beaconLng = (coords && typeof coords[0] === 'number') ? coords[0] : foundEvent?.longitude;
            const beaconLat = (coords && typeof coords[1] === 'number') ? coords[1] : foundEvent?.latitude;
            if (typeof beaconLng === 'number' && typeof beaconLat === 'number') {
              setRadiatingBeacon(beaconLng, beaconLat, accentColor);
            }

            // Notify parent components of selection
            if (onSelectEventRef.current) {
              onSelectEventRef.current(foundEvent);
            }
            const relatedConflict = conflictsRef.current.find(
              (c) => c.country?.toLowerCase() === foundEvent?.country?.toLowerCase()
            );
            if (onSelectConflictRef.current) {
              onSelectConflictRef.current(relatedConflict || null);
            }

            // Ensure any prior map popup is closed so no popup appears on the map canvas itself
            clickPopupRef.current?.remove();
          };

          // Conflict marker interactions — ONLY responds to clicks
          map.on('click', 'warroom-tactical-markers', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('click', 'conflict-dots-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('mouseenter', 'conflict-dots-hit', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });
          map.on('mouseleave', 'conflict-dots-hit', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });
          map.on('mouseenter', 'warroom-tactical-markers', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });
          map.on('mouseleave', 'warroom-tactical-markers', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });

          // News marker interactions — ONLY responds to clicks
          map.on('click', 'warroom-news-markers', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('click', 'news-dots-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('mouseenter', 'news-dots-hit', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });
          map.on('mouseleave', 'news-dots-hit', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });
          map.on('mouseenter', 'warroom-news-markers', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });
          map.on('mouseleave', 'warroom-news-markers', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });

          // Interaction: Conflict Centroid Click
          map.on('click', 'conflict-centroids', (e: any) => {
            if (!e.features || !e.features[0]) return;

            const props = e.features[0].properties;

            // Toggle behavior: clicking the SAME theater centroid again closes it and returns to terminal
            if (selectedConflictRef.current && String(selectedConflictRef.current.id) === String(props.id)) {
              clickPopupRef.current?.remove();
              selectedConflictRef.current = null;
              selectedEventRef.current = null;
              if (onSelectConflictRef.current) onSelectConflictRef.current(null);
              if (onSelectEventRef.current) onSelectEventRef.current(null);
              return;
            }

            const coords = e.features[0].geometry.coordinates.slice();
            const found = conflictsRef.current.find((c) => String(c.id) === String(props.id));

            if (found) {
              removeRadiatingBeacon();
              selectedConflictRef.current = found;
              selectedEventRef.current = null;
              onSelectConflictRef.current(found);
              if (onSelectEventRef.current) onSelectEventRef.current(null);
              if (found.latitude && found.longitude) {
                map.flyTo({ center: [found.longitude, found.latitude], zoom: 5.5, duration: 800 });
              }
            }

            const statusColor =
              props.status === 'ESCALATING'
                ? '#dc2626'
                : props.status === 'DEESCALATING'
                ? '#4d7c0f'
                : '#ca8a04';

            const conflictPopupHtml = `
              <div style="font-family: monospace; font-size: 11px; line-height: 1.45; color: #e6edf3; min-width: 250px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(202,138,4,0.3); padding-bottom: 5px; margin-bottom: 6px; padding-right: 22px;">
                  <span style="color: #ca8a04; font-weight: bold;">// THEATER SECTOR</span>
                  <span style="font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 2px; border: 1px solid ${statusColor}; color: ${statusColor};">
                    ${props.status}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #ffffff; margin-bottom: 6px;">
                  ${props.name}
                </div>
                <div style="display: grid; gap: 3px; margin-bottom: 8px; font-size: 10.5px;">
                  <div><span style="color: #8b949e;">7D EVENTS    ::</span> <strong style="color: #ffffff;">${props.eventCount} incidents</strong></div>
                  <div><span style="color: #8b949e;">7D CASUALTIES ::</span> <strong style="color: #dc2626;">${props.fatalities} reported</strong></div>
                  <div><span style="color: #8b949e;">INTENSITY     ::</span> <span style="color: #ea580c; font-weight: bold;">${props.intensity}/100</span></div>
                </div>
                <div style="display: flex; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                  <button id="warroom-btn-close-theater-${props.id}" style="padding: 3px 8px; font-size: 10px; font-family: monospace; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); color: #cbd5e1; cursor: pointer; border-radius: 2px;">
                    CLOSE
                  </button>
                </div>
              </div>
            `;

            clickPopupRef.current
              .setLngLat(coords)
              .setHTML(conflictPopupHtml)
              .addTo(map);

            setTimeout(() => {
              const closeBtn = document.getElementById(`warroom-btn-close-theater-${props.id}`);
              if (closeBtn) {
                closeBtn.onclick = (btnE) => {
                  btnE.stopPropagation();
                  clickPopupRef.current?.remove();
                  selectedConflictRef.current = null;
                  selectedEventRef.current = null;
                  if (onSelectEventRef.current) onSelectEventRef.current(null);
                  if (onSelectConflictRef.current) onSelectConflictRef.current(null);
                };
              }
            }, 25);
          });

          map.on('mouseenter', 'conflict-centroids', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });
          map.on('mouseleave', 'conflict-centroids', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });

          // ── Relationship Trajectory Vector Interaction ──────────────────
          const handleRelationLineClick = (e: any) => {
            if (!e.features || !e.features[0]) return;
            const props = e.features[0].properties || {};
            const relId = props.id;

            // Dismiss any active on-map mini-popup so only the full Vector Intel Modal displays
            clickPopupRef.current?.remove();

            // Find matching relation in current network
            const currentNet = relationNetworkRef.current;
            const foundRel = currentNet?.relations.find(
              (r) =>
                r.id === relId ||
                (r.fromCountry.toLowerCase() === (props.fromCountry || '').toLowerCase() &&
                  r.toCountry.toLowerCase() === (props.toCountry || '').toLowerCase() &&
                  r.direction === props.direction)
            );

            if (foundRel && onSelectRelationRef.current) {
              onSelectRelationRef.current(foundRel);
            }
          };

          map.on('click', 'relationship-lines', handleRelationLineClick);
          map.on('click', 'relationship-lines-hit', handleRelationLineClick);
          map.on('click', 'hovered-line-core', handleRelationLineClick);
          map.on('click', 'hovered-line-glow', handleRelationLineClick);

          map.on('mouseenter', 'relationship-lines-hit', (e: any) => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = 'pointer';
            if (e.features && e.features[0]) {
              startLineAnimationRef.current(e.features[0]);
            }
          });
          map.on('mousemove', 'relationship-lines-hit', (e: any) => {
            if (e.features && e.features[0]) {
              startLineAnimationRef.current(e.features[0]);
            }
          });
          map.on('mouseleave', 'relationship-lines-hit', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            stopLineAnimationRef.current();
          });
          map.on('mouseenter', 'relationship-lines', (e: any) => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = 'pointer';
            if (e.features && e.features[0]) {
              startLineAnimationRef.current(e.features[0]);
            }
          });
          map.on('mouseleave', 'relationship-lines', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            stopLineAnimationRef.current();
          });

          // ── NASA FIRMS Thermal Anomaly Interactions ──────────────────────
          map.on('click', 'firms-thermal-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            const props = e.features[0].properties || {};
            const coords = e.features[0].geometry.coordinates.slice();

            map.flyTo({
              center: [coords[0], coords[1]],
              zoom: Math.max(map.getZoom() < 6.5 ? 6.5 : map.getZoom(), 6.5),
              duration: 700,
            });

            setRadiatingBeacon(coords[0], coords[1], '#f59e0b');

            const firmsPopupHtml = `
              <div style="font-family: monospace; font-size: 11px; line-height: 1.45; color: #e6edf3; min-width: 255px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(245,158,11,0.4); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span>
                    // SATELLITE THERMAL HIT
                  </span>
                  <span style="font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 2px; border: 1px solid #f97316; color: #f97316; background: rgba(249,115,22,0.1);">
                    NASA VIIRS
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #ffffff; margin-bottom: 6px;">
                  ${props.theater || 'Kinetic Thermal Anomaly'}
                </div>
                <div style="display: grid; gap: 3px; font-size: 10px; margin-bottom: 7px;">
                  <div><span style="color: #8b949e;">RADIATIVE POWER ::</span> <strong style="color: #f97316;">${props.frp} MW (FRP)</strong></div>
                  <div><span style="color: #8b949e;">BRIGHTNESS TEMP ::</span> <strong style="color: #fbbf24;">${props.brightTi4} K</strong></div>
                  <div><span style="color: #8b949e;">DETECTED UTC    ::</span> <span style="color: #e2e8f0;">${props.acqDate} ${props.acqTime} UTC</span></div>
                  <div><span style="color: #8b949e;">SENSOR / ORBIT  ::</span> <span style="color: #94a3b8;">${props.satellite} (${props.daynight === 'N' ? 'NIGHT' : 'DAY'})</span></div>
                  <div><span style="color: #8b949e;">CONFIDENCE      ::</span> <span style="color: #22c55e;">${props.confidence}</span></div>
                  <div><span style="color: #8b949e;">COORDINATES     ::</span> <span style="color: #64748b;">${Number(props.latitude).toFixed(4)}°, ${Number(props.longitude).toFixed(4)}°</span></div>
                </div>
                <div style="font-size: 9px; color: #71717a; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                  * Infrared signature indicates active kinetic blast, heavy artillery, or burning infrastructure.
                </div>
              </div>
            `;

            clickPopupRef.current
              .setLngLat(coords)
              .setHTML(firmsPopupHtml)
              .addTo(map);
          });

          map.on('mouseenter', 'firms-thermal-hit', () => {
            setIsDotHovered(true);
            map.getCanvas().style.cursor = TACTICAL_LOCK_SVG;
            map.getCanvas().classList.add('tactical-lock');
          });

          map.on('mouseleave', 'firms-thermal-hit', () => {
            setIsDotHovered(false);
            map.getCanvas().style.cursor = TACTICAL_CURSOR_SVG;
            map.getCanvas().classList.remove('tactical-lock');
          });

          // Global canvas click: clicking empty space on the map deselects active dot and returns to terminal
          map.on('click', (e: any) => {
            const interactiveLayers = [
              'warroom-tactical-markers',
              'conflict-dots-hit',
              'warroom-news-markers',
              'news-dots-hit',
              'conflict-centroids',
              'relationship-lines',
              'relationship-lines-hit',
              'hovered-line-glow',
              'hovered-line-core',
              'firms-thermal-hit',
            ].filter((layerId) => map.getLayer(layerId));

            const bbox: [any, any] = [
              [e.point.x - 3, e.point.y - 3],
              [e.point.x + 3, e.point.y + 3],
            ];

            const features = map.queryRenderedFeatures(bbox, {
              layers: interactiveLayers,
            });

            if (!features || features.length === 0) {
              selectedEventRef.current = null;
              selectedConflictRef.current = null;
              removeRadiatingBeacon();
              if (onSelectEventRef.current) onSelectEventRef.current(null);
              if (onSelectConflictRef.current) onSelectConflictRef.current(null);
              clickPopupRef.current?.remove();
            }
          });
        });
      } catch (err) {
        console.error('MapLibre GL initialization failed:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      removeRadiatingBeacon();
      stopLineAnimationRef.current();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update GeoJSON data when events or conflicts change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Filter events by mapMode if in ESCALATION mode
    let displayEvents = events;
    if (mapMode === 'ESCALATION') {
      displayEvents = events.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH');
    }

    const toFeature = (e: ConflictEvent) => {
      const time = new Date(e.timestamp || e.eventDate).getTime();
      const isRecent24h = !isNaN(time) && now - time <= oneDayMs;

      let markerIcon = 'army-low';
      if (e.country === 'Global / Strategic' || e.location?.includes('Global / Transnational')) {
        markerIcon = 'army-global';
      } else if (e.isConflict === false) {
        markerIcon = 'army-news';
      } else if (e.severity === 'CRITICAL') {
        markerIcon = isRecent24h ? 'army-critical-24h' : 'army-critical';
      } else if (e.severity === 'HIGH') {
        markerIcon = isRecent24h ? 'army-high-24h' : 'army-high';
      } else if (e.severity === 'MODERATE') {
        markerIcon = isRecent24h ? 'army-moderate-24h' : 'army-moderate';
      } else {
        markerIcon = 'army-low';
      }

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.longitude!, e.latitude!],
        },
        properties: {
          id: e.id,
          location: e.location,
          country: e.country,
          latitude: e.latitude,
          longitude: e.longitude,
          eventType: e.eventType,
          date: formatShortDate(e.eventDate),
          fatalities: e.fatalities || 0,
          severity: e.severity,
          isConflict: e.isConflict !== false,
          status: isRecent24h ? 'ACTIVE <24H' : 'RECENT',
          isRecent24h,
          markerIcon,
          source: e.source,
          sourceUrl: e.sourceUrl,
          notes: e.notes,
          mergedCount: e.mergedCount || 1,
          primaryCategory: e.primaryCategory || e.eventType,
        },
      };
    };

/**
 * Spatial Anti-Collision & Dispersal Engine:
 * Guarantees that NO TWO DOTS are placed exactly on top of each other.
 * If two or more events have overlapping coordinates, they are smoothly
 * dispersed along a golden-angle spiral around the centroid so every single
 * dot is individually visible and clickable.
 */
function decollideEventCoordinates(events: ConflictEvent[], minDistanceDeg = 0.16): ConflictEvent[] {
  const placed: Array<{ lat: number; lon: number }> = [];

  return events.map((e) => {
    let lat = e.latitude!;
    let lon = e.longitude!;

    const isColliding = (testLat: number, testLon: number) => {
      return placed.some((p) => {
        const dLat = p.lat - testLat;
        const dLon = (p.lon - testLon) * Math.cos((testLat * Math.PI) / 180);
        return Math.hypot(dLat, dLon) < minDistanceDeg;
      });
    };

    let attempts = 0;
    let angle = 0;

    while (isColliding(lat, lon) && attempts < 50) {
      attempts++;
      angle += 2.39996; // Golden angle (approx 137.5 deg)
      const radius = minDistanceDeg * (1 + 0.18 * Math.sqrt(attempts));
      lat = e.latitude! + radius * Math.cos(angle);
      const cosLat = Math.max(0.2, Math.cos((e.latitude! * Math.PI) / 180));
      lon = e.longitude! + (radius * Math.sin(angle)) / cosLat;
    }

    placed.push({ lat, lon });
    return {
      ...e,
      latitude: lat,
      longitude: lon,
    };
  });
}

    const validEvents = displayEvents.filter(
      (e) => typeof e.longitude === 'number' && !isNaN(e.longitude) && typeof e.latitude === 'number' && !isNaN(e.latitude)
    );
    const decollidedEvents = decollideEventCoordinates(validEvents, 0.16);

    const conflictEvents = decollidedEvents.filter((e) => e.isConflict !== false);
    const newsEvents = decollidedEvents.filter((e) => e.isConflict === false);

    const conflictFeatures = conflictEvents.map(toFeature);
    const newsFeatures = newsEvents.map(toFeature);

    const conflictSource: any = map.getSource('warroom-conflict-events');
    if (conflictSource?.setData) {
      conflictSource.setData({
        type: 'FeatureCollection',
        features: conflictFeatures,
      });
    }

    const newsSource: any = map.getSource('warroom-general-news');
    if (newsSource?.setData) {
      newsSource.setData({
        type: 'FeatureCollection',
        features: newsFeatures,
      });
    }

    // Conflicts Centroids Feature Collection
    const theaterFeatures = conflicts
      .filter((c) => typeof c.longitude === 'number' && typeof c.latitude === 'number')
      .map((c) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [c.longitude!, c.latitude!],
        },
        properties: {
          id: c.id,
          name: c.name,
          country: c.country,
          status: c.status,
          intensity: c.intensity,
          eventCount: c.eventCount7d,
          fatalities: c.fatalities7d,
          escalationIndex: c.escalationIndex,
        },
      }));

    const theaterSource: any = map.getSource('warroom-conflicts');
    if (theaterSource?.setData) {
      theaterSource.setData({
        type: 'FeatureCollection',
        features: theaterFeatures,
      });
    }
  }, [events, conflicts, mapLoaded, mapMode]);

  // Adjust layer visibility based on mapMode
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    const newsLayers = ['warroom-news-markers', 'news-dots-hit'];
    const conflictLayers = ['warroom-tactical-markers', 'conflict-dots-hit'];
    const theaterLayers = ['conflict-centroids', 'conflict-labels'];

    if (mapMode === 'HEATMAP') {
      setVisibility('events-heat', true);
      newsLayers.forEach((id) => setVisibility(id, true));
      conflictLayers.forEach((id) => setVisibility(id, false));
      theaterLayers.forEach((id) => setVisibility(id, false));
    } else if (mapMode === 'CONFLICTS') {
      setVisibility('events-heat', false);
      newsLayers.forEach((id) => setVisibility(id, false));
      conflictLayers.forEach((id) => setVisibility(id, false));
      theaterLayers.forEach((id) => setVisibility(id, true));
    } else {
      // EVENTS or ESCALATION
      setVisibility('events-heat', false);
      newsLayers.forEach((id) => setVisibility(id, true));
      conflictLayers.forEach((id) => setVisibility(id, true));
      theaterLayers.forEach((id) => setVisibility(id, false));
    }
  }, [mapMode, mapLoaded]);

  const prevSelectionRef = useRef<{ event: ConflictEvent | null; conflict: Conflict | null }>({
    event: null,
    conflict: null,
  });

  // Fly to selected conflict or event, set radiating beacon, or ease to world view when deselected
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedEvent && typeof selectedEvent.longitude === 'number' && typeof selectedEvent.latitude === 'number') {
      const isNewsItem = selectedEvent.isConflict === false;
      const accentColor = isNewsItem ? '#64748b' : (
        selectedEvent.severity === 'CRITICAL' ? '#dc2626' :
        selectedEvent.severity === 'HIGH' ? '#ea580c' :
        selectedEvent.severity === 'MODERATE' ? '#ca8a04' :
        selectedEvent.severity === 'LOW' ? '#4d7c0f' : '#dc2626'
      );
      setRadiatingBeacon(selectedEvent.longitude, selectedEvent.latitude, accentColor);

      map.flyTo({
        center: [selectedEvent.longitude, selectedEvent.latitude],
        zoom: Math.max(map.getZoom() < 7 ? 7 : map.getZoom(), 7),
        duration: 800,
      });
    } else if (selectedConflict && typeof selectedConflict.longitude === 'number' && typeof selectedConflict.latitude === 'number') {
      removeRadiatingBeacon();
      map.flyTo({
        center: [selectedConflict.longitude, selectedConflict.latitude],
        zoom: 5.5,
        duration: 800,
      });
    } else if (!selectedConflict && !selectedEvent) {
      removeRadiatingBeacon();
      if (prevSelectionRef.current.event || prevSelectionRef.current.conflict) {
        map.easeTo({ center: [25, 20], zoom: 2.2, duration: 800 });
      }
    }
    prevSelectionRef.current = { event: selectedEvent, conflict: selectedConflict };
  }, [selectedConflict, selectedEvent, mapLoaded, setRadiatingBeacon, removeRadiatingBeacon]);

  // Smoothly fly to target location (e.g. from terminal country selection)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !targetLocation) return;
    const map = mapInstanceRef.current;
    clickPopupRef.current?.remove();
    removeRadiatingBeacon();

    const currentZoom = map.getZoom();
    const targetZoom = targetLocation.noZoom
      ? Math.min(currentZoom, 2.5) // Prevent zooming in: keep current zoom or zoom out to wide overview (<= 2.5)
      : (targetLocation.zoom ?? currentZoom);

    map.flyTo({
      center: [targetLocation.lng, targetLocation.lat],
      zoom: targetZoom,
      duration: 1200,
    });
  }, [targetLocation, mapLoaded, removeRadiatingBeacon]);

  // Update relationship lines GeoJSON data
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const source = map.getSource('warroom-relationship-lines');
    if (!source) return;

    stopLineAnimationRef.current();

    if (relationNetwork && relationNetwork.geoJson) {
      source.setData(relationNetwork.geoJson);
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [relationNetwork, mapLoaded]);

  // Update NASA FIRMS GeoJSON data when loaded
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const source: any = map.getSource('warroom-firms-hotspots');
    if (source && firmsGeoJson) {
      source.setData(firmsGeoJson);
    }
  }, [firmsGeoJson, mapLoaded]);

  // Adjust FIRMS layer visibility based on showFirms toggle
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };
    const firmsLayers = ['firms-thermal-glow', 'firms-thermal-core', 'firms-thermal-hit'];
    firmsLayers.forEach((id) => setVisibility(id, showFirms ?? false));
  }, [showFirms, mapLoaded]);

  // Real-time infrared thermal breathing/pulse animation for FIRMS dots
  const firmsPulseAnimRef = useRef<number | null>(null);
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !showFirms) {
      if (firmsPulseAnimRef.current !== null) {
        cancelAnimationFrame(firmsPulseAnimRef.current);
        firmsPulseAnimRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;
    const animStart = performance.now();

    const frame = (now: number) => {
      const elapsed = now - animStart;
      // 1.8s smooth breathing cycle
      const cycle = (elapsed % 1800) / 1800;
      const wave = Math.sin(cycle * Math.PI * 2); // -1 to 1

      // Oscillate opacity between 0.45 and 0.88
      const opacity = 0.66 + wave * 0.22;
      // Oscillate blur between 0.40 and 0.80
      const blur = 0.60 + wave * 0.20;

      if (map.getLayer('firms-thermal-glow')) {
        map.setPaintProperty('firms-thermal-glow', 'circle-opacity', opacity);
        map.setPaintProperty('firms-thermal-glow', 'circle-blur', blur);
      }

      firmsPulseAnimRef.current = requestAnimationFrame(frame);
    };

    firmsPulseAnimRef.current = requestAnimationFrame(frame);

    return () => {
      if (firmsPulseAnimRef.current !== null) {
        cancelAnimationFrame(firmsPulseAnimRef.current);
        firmsPulseAnimRef.current = null;
      }
    };
  }, [showFirms, mapLoaded]);

  return (
    <div className="relative w-full h-full bg-[#07090b] select-none">
      {/* Map Container Element */}
      <div
        ref={mapContainerRef}
        className="w-full h-full warroom-map-crosshair"
      />

      {/* White Crosshair with Square Bleedmark Style Click-Animated Borders */}
      <TacticalBleedmarkCursor
        containerRef={mapContainerRef}
        isDotHovered={isDotHovered}
      />

      {/* Map Zoom Controls (+ and - only, Army Tactical Panel) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-[#090d12]/95 border border-zinc-800 p-1 font-mono shadow-md">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer rounded-[1px]"
          title="Zoom In (+)"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer rounded-[1px]"
          title="Zoom Out (-)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Map Mode Selector & NASA FIRMS Thermal Sensor */}
      <MapLegend
        mapMode={mapMode}
        onChangeMode={onChangeMapMode}
        showFirms={showFirms}
        onToggleFirms={onToggleFirms}
        firmsCount={firmsCount}
        isFirmsLoading={isFirmsLoading}
      />
    </div>
  );
};
