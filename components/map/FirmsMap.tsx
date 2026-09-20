'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapLegend } from './MapLegend';

interface FirmsMapProps {
  firmsGeoJson: any;
  firmsCount?: number;
  isFirmsLoading?: boolean;
  targetLocation?: [number, number] | null;
  onSelectHotspot?: (hotspot: any) => void;
}

export const FirmsMap: React.FC<FirmsMapProps> = ({
  firmsGeoJson,
  firmsCount = 0,
  isFirmsLoading = false,
  targetLocation,
  onSelectHotspot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const maplibreModuleRef = useRef<any>(null);
  const clickPopupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Radiating beacon reference
  const beaconMarkerRef = useRef<any>(null);
  const beaconElementRef = useRef<HTMLDivElement | null>(null);

  const setRadiatingBeacon = useCallback((lng: number, lat: number, color = '#f59e0b') => {
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

  // Close popup on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (clickPopupRef.current?.isOpen()) {
          clickPopupRef.current.remove();
        }
        removeRadiatingBeacon();
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
          center: [35, 33], // Centered on Eastern Europe / Middle East conflict theater
          zoom: 3.2,
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
          removeRadiatingBeacon();
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapInstanceRef.current = map;
          setMapLoaded(true);

          // Add FIRMS GeoJSON source
          map.addSource('warroom-firms-hotspots', {
            type: 'geojson',
            data: firmsGeoJson || { type: 'FeatureCollection', features: [] },
          });

          // 1. Radiant Thermal Glow
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
          });

          // 2. Precision Thermal Core
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
          });

          // 3. Invisible Hit target
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
          });

          // Click on thermal hotspot
          map.on('click', 'firms-thermal-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            const props = e.features[0].properties || {};
            const coords = e.features[0].geometry.coordinates.slice();

            map.flyTo({
              center: [coords[0], coords[1]],
              zoom: Math.max(map.getZoom() < 6 ? 6 : map.getZoom(), 6),
              duration: 700,
            });

            setRadiatingBeacon(coords[0], coords[1], '#f59e0b');

            const frpNum = Number(props.frp || 0);
            const frpBadgeColor =
              frpNum > 80 ? '#ef4444' : frpNum > 30 ? '#f97316' : '#f59e0b';
            const intensityLabel =
              frpNum > 100
                ? 'EXPLOSIVE / DETONATION BLAST'
                : frpNum > 40
                ? 'INTENSE COMBAT STRIKE'
                : 'THERMAL ANOMALY';

            const firmsPopupHtml = `
              <div style="font-family: monospace; font-size: 11px; line-height: 1.45; color: #e6edf3; min-width: 250px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(245,158,11,0.4); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="color: #f59e0b; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span>
                    // NASA FIRMS THERMAL SENSOR
                  </span>
                  <span style="font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 2px; border: 1px solid ${frpBadgeColor}; color: ${frpBadgeColor}; background: rgba(245,158,11,0.1);">
                    ${intensityLabel}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #ffffff; margin-bottom: 2px;">
                  ${props.theater || 'Active Operational Theater'}
                </div>
                <div style="display: grid; gap: 3px; font-size: 10px; margin-bottom: 6px;">
                  <div><span style="color: #8b949e;">RADIATIVE POWER::</span> <strong style="color: ${frpBadgeColor};">${props.frp} MW</strong></div>
                  <div><span style="color: #8b949e;">BRIGHTNESS TEMP::</span> <strong style="color: #f8fafc;">${props.brightness} K</strong></div>
                  <div><span style="color: #8b949e;">SATELLITE & PASS::</span> <span style="color: #e2e8f0;">${props.satellite || 'VIIRS'} [${props.daynight === 'D' ? 'DAY SCAN' : 'NIGHT SCAN'}]</span></div>
                  <div><span style="color: #8b949e;">ACQUISITION UTC::</span> <span style="color: #38bdf8;">${props.acqDate} ${props.acqTime} UTC</span></div>
                  <div><span style="color: #8b949e;">CONFIDENCE LEVEL::</span> <span style="color: #4ade80;">${props.confidence?.toUpperCase()} CONFIDENCE</span></div>
                  <div><span style="color: #8b949e;">COORDINATES     ::</span> <span style="color: #64748b;">${Number(props.latitude).toFixed(4)}°, ${Number(props.longitude).toFixed(4)}°</span></div>
                </div>
                <div style="font-size: 9px; color: #71717a; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                  * Sensed by NASA LANCE VIIRS 375m sensor aboard NOAA-20 / Suomi-NPP satellites within the last 24h.
                </div>
              </div>
            `;

            clickPopupRef.current
              .setLngLat(coords)
              .setHTML(firmsPopupHtml)
              .addTo(map);

            onSelectHotspot?.(props);
          });

          map.on('mouseenter', 'firms-thermal-hit', () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', 'firms-thermal-hit', () => {
            map.getCanvas().style.cursor = '';
          });
        });
      } catch (e) {
        console.error('Failed to initialize FirmsMap:', e);
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
  }, [setRadiatingBeacon, removeRadiatingBeacon, onSelectHotspot]);

  // Update GeoJSON source when data changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const source = mapInstanceRef.current.getSource('warroom-firms-hotspots');
    if (source && firmsGeoJson) {
      source.setData(firmsGeoJson);
    }
  }, [firmsGeoJson, mapLoaded]);

  // Fly to targetLocation if provided
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !targetLocation) return;
    const [lat, lng] = targetLocation;
    mapInstanceRef.current.flyTo({
      center: [lng, lat],
      zoom: Math.max(mapInstanceRef.current.getZoom(), 6),
      duration: 800,
    });
    setRadiatingBeacon(lng, lat, '#f59e0b');
  }, [targetLocation, mapLoaded, setRadiatingBeacon]);

  // Infrared Breathing Shimmer Animation (1.8s sine wave cycle)
  const shimmerAnimRef = useRef<number | null>(null);
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const animStart = performance.now();

    const frame = (now: number) => {
      const elapsed = now - animStart;
      const cycle = (elapsed % 1800) / 1800;
      const wave = Math.sin(cycle * Math.PI * 2);
      const opacity = 0.65 + wave * 0.22; // 0.43 to 0.87
      const blur = 0.60 + wave * 0.20;    // 0.40 to 0.80

      if (map.getLayer('firms-thermal-glow')) {
        map.setPaintProperty('firms-thermal-glow', 'circle-opacity', opacity);
        map.setPaintProperty('firms-thermal-glow', 'circle-blur', blur);
      }

      shimmerAnimRef.current = requestAnimationFrame(frame);
    };

    shimmerAnimRef.current = requestAnimationFrame(frame);

    return () => {
      if (shimmerAnimRef.current !== null) {
        cancelAnimationFrame(shimmerAnimRef.current);
        shimmerAnimRef.current = null;
      }
    };
  }, [mapLoaded]);

  return (
    <div className="relative w-full h-full bg-[#07090b] select-none">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Crosshair Overlay Guidelines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />
      </div>

      {/* Bottom Tactical Map Legend HUD */}
      <MapLegend
        activePage="FIRMS"
        firmsCount={firmsCount}
        isFirmsLoading={isFirmsLoading}
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
