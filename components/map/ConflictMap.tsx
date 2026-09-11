'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ConflictEvent, Conflict, MapMode, Severity } from '@/types/conflict';
import { MapLegend } from './MapLegend';
import { formatShortDate } from '@/lib/data/date-utils';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react';

interface ConflictMapProps {
  events: ConflictEvent[];
  conflicts: Conflict[];
  selectedConflict: Conflict | null;
  selectedEvent: ConflictEvent | null;
  onSelectConflict: (conflict: Conflict) => void;
  onSelectEvent: (event: ConflictEvent) => void;
  onOpenEventModal?: (event: ConflictEvent) => void;
  mapMode: MapMode;
  onChangeMapMode: (mode: MapMode) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ConflictMap: React.FC<ConflictMapProps> = ({
  events,
  conflicts,
  selectedConflict,
  selectedEvent,
  onSelectConflict,
  onSelectEvent,
  onOpenEventModal,
  mapMode,
  onChangeMapMode,
  onRefresh,
  isRefreshing = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const hoverPopupRef = useRef<any>(null);
  const clickPopupRef = useRef<any>(null);

  // References to always access the freshest state in closures
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const conflictsRef = useRef(conflicts);
  conflictsRef.current = conflicts;

  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;

  const onOpenEventModalRef = useRef(onOpenEventModal);
  onOpenEventModalRef.current = onOpenEventModal;

  const onSelectConflictRef = useRef(onSelectConflict);
  onSelectConflictRef.current = onSelectConflict;

  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        hoverPopupRef.current?.remove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        const maplibre = await import('maplibre-gl');

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

        hoverPopupRef.current = new maplibre.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 12,
          className: 'warroom-hover-tooltip',
        });

        clickPopupRef.current = new maplibre.Popup({
          closeButton: true,
          closeOnClick: true,
          offset: 14,
          className: 'warroom-click-popup',
          maxWidth: '350px',
        });

        map.on('load', () => {
          if (!isMounted) return;
          mapInstanceRef.current = map;
          setMapLoaded(true);

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
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 240, 255, 0)',
                0.2, '#00f0ff',
                0.4, '#eab308',
                0.7, '#f97316',
                1, '#ef4444',
              ],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 4, 9, 25],
              'heatmap-opacity': 0.8,
            },
            layout: { visibility: 'none' },
          });

          // 2. General News Dots — small dark blue circles, always individual, never clustered
          map.addLayer({
            id: 'news-dots',
            type: 'circle',
            source: 'warroom-general-news',
            paint: {
              'circle-color': '#1e3a5f',
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 3,
                5, 4.5,
                10, 6,
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#2563eb',
              'circle-opacity': 0.85,
            },
          });

          // 3. Conflict Dots — colour-coded by severity, larger than news dots
          map.addLayer({
            id: 'conflict-dots',
            type: 'circle',
            source: 'warroom-conflict-events',
            paint: {
              'circle-color': [
                'match',
                ['get', 'severity'],
                'CRITICAL', '#ef4444',
                'HIGH', '#f97316',
                'MODERATE', '#eab308',
                'LOW', '#38bdf8',
                '#64748b',
              ],
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                1, 5,
                5, 7,
                10, 11,
              ],
              'circle-stroke-width': [
                'case',
                ['boolean', ['get', 'isRecent24h'], false],
                2.5,
                1,
              ],
              'circle-stroke-color': [
                'case',
                ['boolean', ['get', 'isRecent24h'], false],
                '#00ff66',
                '#080b0e',
              ],
              'circle-opacity': 0.95,
            },
          });

          // 3b. Invisible hit-target layer for conflict dots (prevents missed clicks on small dots)
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

          // 3c. Invisible hit-target layer for news dots
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

          // 4. Conflict Centroid Theaters Layer
          map.addLayer({
            id: 'conflict-centroids',
            type: 'circle',
            source: 'warroom-conflicts',
            paint: {
              'circle-color': [
                'match',
                ['get', 'status'],
                'ESCALATING', 'rgba(239, 68, 68, 0.45)',
                'DEESCALATING', 'rgba(56, 189, 248, 0.3)',
                'rgba(249, 115, 22, 0.35)',
              ],
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'intensity'],
                0, 16,
                50, 28,
                100, 42,
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': [
                'match',
                ['get', 'status'],
                'ESCALATING', '#ef4444',
                'DEESCALATING', '#38bdf8',
                '#f97316',
              ],
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
              'text-color': '#00f0ff',
              'text-halo-color': '#000000',
              'text-halo-width': 1.5,
            },
          });

          // Function to open popup for an event dot (works for both conflict and news dots)
          const openEventPopup = (feature: any, coords: any) => {
            if (!feature) return;
            hoverPopupRef.current?.remove();

            const props = feature.properties;
            const foundEvent = eventsRef.current.find((ev) => ev.id === props.id);

            // Notify parent components of selection
            if (foundEvent) {
              onSelectEventRef.current(foundEvent);
              const relatedConflict = conflictsRef.current.find(
                (c) => c.country?.toLowerCase() === foundEvent.country?.toLowerCase()
              );
              if (relatedConflict) onSelectConflictRef.current(relatedConflict);
            }

            const isNewsItem = props.isConflict === false || props.isConflict === 'false';
            const accentColor = isNewsItem ? '#2563eb' : (
              props.severity === 'CRITICAL' ? '#ef4444' :
              props.severity === 'HIGH' ? '#f97316' :
              props.severity === 'MODERATE' ? '#eab308' : '#00f0ff'
            );

            const fatalitiesColor = props.fatalities > 0 ? '#ef4444' : '#8b949e';
            const notesText = foundEvent?.notes || props.notes || '';
            const sourceText = foundEvent?.source || props.source || 'VERIFIED DISPATCH';
            const sourceUrl = foundEvent?.sourceUrl || props.sourceUrl || '';

            const headerLabel = isNewsItem ? '// NEWS DISPATCH ::' : '// INCIDENT ::';
            const typeLabel = isNewsItem ? 'CATEGORY' : 'TYPE';

            const popupHtml = `
              <div style="font-family: monospace; font-size: 11px; line-height: 1.45; color: #e6edf3; min-width: 260px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${accentColor}55; padding-bottom: 5px; margin-bottom: 6px; padding-right: 22px;">
                  <span style="color: ${accentColor}; font-weight: bold; letter-spacing: 0.05em;">${headerLabel} ${props.id}</span>
                  <span style="font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 2px; border: 1px solid ${accentColor}; color: ${accentColor};">
                    ${isNewsItem ? 'NEWS' : props.severity}
                  </span>
                </div>
                <div style="display: grid; gap: 3px; margin-bottom: 6px; font-size: 11px;">
                  <div><span style="color: #8b949e;">${typeLabel} ::</span> <strong style="color: #ffffff;">${props.eventType}</strong></div>
                  <div><span style="color: #8b949e;">LOC  ::</span> <span style="color: #ffffff;">${props.location}, ${props.country}</span></div>
                  <div><span style="color: #8b949e;">DATE ::</span> <span style="color: #ffffff;">${props.date}</span></div>
                  ${!isNewsItem ? `<div><span style="color: #8b949e;">CASUALTIES ::</span> <strong style="color: ${fatalitiesColor};">${props.fatalities > 0 ? props.fatalities + ' reported' : 'None reported'}</strong></div>` : ''}
                </div>
                ${
                  notesText
                    ? `<div style="padding: 6px 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; margin-bottom: 8px; font-size: 10.5px; color: #cbd5e1; max-height: 75px; overflow-y: auto; line-height: 1.35;">
                        ${notesText}
                      </div>`
                    : ''
                }
                <div style="font-size: 9px; color: #8b949e; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">SOURCE: <span style="color: #cbd5e1;">${sourceText}</span></span>
                  ${
                    sourceUrl
                      ? `<a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: ${accentColor}; text-decoration: underline; flex-shrink: 0; font-weight: bold;">
                          POST &nearr;
                        </a>`
                      : ''
                  }
                </div>
                <div style="display: flex; gap: 6px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                  <button id="warroom-btn-modal-${props.id}" style="padding: 3px 8px; font-size: 10px; font-family: monospace; font-weight: bold; background: ${accentColor}22; border: 1px solid ${accentColor}; color: ${accentColor}; cursor: pointer; border-radius: 2px;">
                    INSPECT FULL INTEL &rarr;
                  </button>
                  <button id="warroom-btn-close-${props.id}" style="padding: 3px 8px; font-size: 10px; font-family: monospace; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.25); color: #cbd5e1; cursor: pointer; border-radius: 2px;">
                    CLOSE
                  </button>
                </div>
              </div>
            `;

            clickPopupRef.current
              .setLngLat(coords)
              .setHTML(popupHtml)
              .addTo(map);

            setTimeout(() => {
              const modalBtn = document.getElementById(`warroom-btn-modal-${props.id}`);
              if (modalBtn) {
                modalBtn.onclick = (btnE) => {
                  btnE.stopPropagation();
                  clickPopupRef.current?.remove();
                  if (foundEvent && onOpenEventModalRef.current) {
                    onOpenEventModalRef.current(foundEvent);
                  }
                };
              }

              const closeBtn = document.getElementById(`warroom-btn-close-${props.id}`);
              if (closeBtn) {
                closeBtn.onclick = (btnE) => {
                  btnE.stopPropagation();
                  clickPopupRef.current?.remove();
                };
              }
            }, 25);
          };

          // Hover tooltip helper
          const showHoverTooltip = (e: any, accentColor: string, isNews: boolean) => {
            if (!e.features || !e.features[0]) return;
            map.getCanvas().style.cursor = 'pointer';
            if (clickPopupRef.current?.isOpen()) return;

            const props = e.features[0].properties;
            const coords = e.features[0].geometry.coordinates.slice();

            const hoverHtml = `
              <div style="font-family: monospace; font-size: 10px; line-height: 1.35; color: #e6edf3;">
                <div style="color: ${accentColor}; font-weight: bold; margin-bottom: 2px;">${props.location}, ${props.country}</div>
                <div style="color: #8b949e;">${props.eventType}${!isNews && props.fatalities > 0 ? ` &bull; <span style="color: #ef4444; font-weight: bold;">${props.fatalities} fatalities</span>` : ''}</div>
                <div style="color: #00ff66; font-size: 9px; margin-top: 3px;">CLICK TO INSPECT RECORD</div>
              </div>
            `;

            hoverPopupRef.current.setLngLat(coords).setHTML(hoverHtml).addTo(map);
          };

          // Conflict dot interactions
          map.on('click', 'conflict-dots', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('click', 'conflict-dots-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('mousemove', 'conflict-dots', (e: any) => showHoverTooltip(e, '#ef4444', false));
          map.on('mouseleave', 'conflict-dots', () => { map.getCanvas().style.cursor = ''; hoverPopupRef.current?.remove(); });
          map.on('mouseenter', 'conflict-dots-hit', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'conflict-dots-hit', () => { map.getCanvas().style.cursor = ''; });

          // News dot interactions
          map.on('click', 'news-dots', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('click', 'news-dots-hit', (e: any) => {
            if (!e.features || !e.features[0]) return;
            openEventPopup(e.features[0], e.features[0].geometry.coordinates.slice());
          });
          map.on('mousemove', 'news-dots', (e: any) => showHoverTooltip(e, '#2563eb', true));
          map.on('mouseleave', 'news-dots', () => { map.getCanvas().style.cursor = ''; hoverPopupRef.current?.remove(); });
          map.on('mouseenter', 'news-dots-hit', () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'news-dots-hit', () => { map.getCanvas().style.cursor = ''; });

          // Interaction: Conflict Centroid Click
          map.on('click', 'conflict-centroids', (e: any) => {
            if (!e.features || !e.features[0]) return;
            hoverPopupRef.current?.remove();

            const props = e.features[0].properties;
            const coords = e.features[0].geometry.coordinates.slice();
            const found = conflictsRef.current.find((c) => c.id === props.id);

            if (found) {
              onSelectConflictRef.current(found);
              if (found.latitude && found.longitude) {
                map.flyTo({ center: [found.longitude, found.latitude], zoom: 5.5, duration: 800 });
              }
            }

            const statusColor =
              props.status === 'ESCALATING'
                ? '#ef4444'
                : props.status === 'DEESCALATING'
                ? '#38bdf8'
                : '#f97316';

            const conflictPopupHtml = `
              <div style="font-family: monospace; font-size: 11px; line-height: 1.45; color: #e6edf3; min-width: 250px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0,240,255,0.3); padding-bottom: 5px; margin-bottom: 6px; padding-right: 22px;">
                  <span style="color: #00f0ff; font-weight: bold;">// THEATER</span>
                  <span style="font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 2px; border: 1px solid ${statusColor}; color: ${statusColor};">
                    ${props.status}
                  </span>
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #ffffff; margin-bottom: 6px;">
                  ${props.name}
                </div>
                <div style="display: grid; gap: 3px; margin-bottom: 8px; font-size: 10.5px;">
                  <div><span style="color: #8b949e;">7D EVENTS    ::</span> <strong style="color: #ffffff;">${props.eventCount} incidents</strong></div>
                  <div><span style="color: #8b949e;">7D CASUALTIES ::</span> <strong style="color: #ef4444;">${props.fatalities} reported</strong></div>
                  <div><span style="color: #8b949e;">INTENSITY     ::</span> <span style="color: #00ff66;">${props.intensity}/100</span></div>
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
                };
              }
            }, 25);
          });
        });
      } catch (err) {
        console.error('MapLibre GL initialization failed:', err);
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
          eventType: e.eventType,
          date: formatShortDate(e.eventDate),
          fatalities: e.fatalities || 0,
          severity: e.severity,
          isConflict: e.isConflict !== false,
          status: isRecent24h ? 'ACTIVE <24H' : 'RECENT',
          isRecent24h,
          source: e.source,
          sourceUrl: e.sourceUrl,
          notes: e.notes,
        },
      };
    };

    const validEvents = displayEvents.filter((e) => typeof e.longitude === 'number' && typeof e.latitude === 'number');
    const conflictEvents = validEvents.filter((e) => e.isConflict !== false);
    const newsEvents = validEvents.filter((e) => e.isConflict === false);

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

    if (mapMode === 'HEATMAP') {
      setVisibility('events-heat', true);
      setVisibility('news-dots', true);
      setVisibility('news-dots-hit', true);
      setVisibility('conflict-dots', false);
      setVisibility('conflict-dots-hit', false);
      setVisibility('conflict-centroids', false);
      setVisibility('conflict-labels', false);
    } else if (mapMode === 'CONFLICTS') {
      setVisibility('events-heat', false);
      setVisibility('news-dots', false);
      setVisibility('news-dots-hit', false);
      setVisibility('conflict-dots', false);
      setVisibility('conflict-dots-hit', false);
      setVisibility('conflict-centroids', true);
      setVisibility('conflict-labels', true);
    } else {
      // EVENTS or ESCALATION
      setVisibility('events-heat', false);
      setVisibility('news-dots', true);
      setVisibility('news-dots-hit', true);
      setVisibility('conflict-dots', true);
      setVisibility('conflict-dots-hit', true);
      setVisibility('conflict-centroids', false);
      setVisibility('conflict-labels', false);
    }
  }, [mapMode, mapLoaded]);

  const prevConflictRef = useRef<Conflict | null>(null);

  // Fly to selected conflict or event, or ease to world view when deselected
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (selectedEvent && typeof selectedEvent.longitude === 'number' && typeof selectedEvent.latitude === 'number') {
      map.flyTo({
        center: [selectedEvent.longitude, selectedEvent.latitude],
        zoom: 7,
        duration: 800,
      });
    } else if (selectedConflict && typeof selectedConflict.longitude === 'number' && typeof selectedConflict.latitude === 'number') {
      map.flyTo({
        center: [selectedConflict.longitude, selectedConflict.latitude],
        zoom: 5.5,
        duration: 800,
      });
    } else if (!selectedConflict && !selectedEvent && prevConflictRef.current) {
      map.easeTo({ center: [25, 20], zoom: 2.2, duration: 800 });
    }
    prevConflictRef.current = selectedConflict;
  }, [selectedConflict, selectedEvent, mapLoaded]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.easeTo({ center: [25, 20], zoom: 2.2, duration: 600 });
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#07090b] select-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Overlays & Coordinates Header */}
      <div className="absolute top-2 left-2 z-20 bg-panel/90 border border-border px-2 py-1 text-[10px] font-mono flex items-center gap-2 backdrop-blur-sm">
        <span className="text-accent-cyan font-bold">// STRATEGIC MAP</span>
        <span className="text-text-muted">MODE: [{mapMode}]</span>
      </div>

      {/* Map Quick Controls */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-panel/90 border border-border p-1 backdrop-blur-sm font-mono">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-1 text-text-secondary hover:text-accent-cyan hover:bg-panel-hover transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-1 text-text-secondary hover:text-accent-cyan hover:bg-panel-hover transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1 text-text-secondary hover:text-accent-cyan hover:bg-panel-hover transition-colors disabled:opacity-50 cursor-pointer"
            title="Query Gemini API for live global conflict news"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent-cyan' : ''}`} />
          </button>
        )}
        <button
          onClick={handleResetView}
          className="p-1 text-text-secondary hover:text-accent-cyan hover:bg-panel-hover transition-colors"
          title="Reset Global View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 text-text-secondary hover:text-accent-cyan hover:bg-panel-hover transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Map Legend & Mode Bar */}
      <MapLegend
        mapMode={mapMode}
        onChangeMode={onChangeMapMode}
        eventCount={events.length}
      />
    </div>
  );
};
