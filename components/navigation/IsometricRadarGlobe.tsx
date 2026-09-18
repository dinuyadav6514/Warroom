'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { ConflictEvent } from '@/types/conflict';

interface IsometricRadarGlobeProps {
  isRefreshing?: boolean;
  lastSyncAt?: string | null;
  eventsCount?: number;
  events?: ConflictEvent[];
}

interface ActiveDot {
  id: string;
  lat: number;
  lon: number;
  addedAt: number;
  severity: string;
  isConflict: boolean;
}

const ONE_MINUTE_MS = 60 * 1000; // Keep dots marked for exactly 1 minute

// Stable content fingerprint that survives dynamic IDs, query strings, and timestamp re-fetches
function getEventFingerprint(ev: ConflictEvent): string {
  if (ev.sourceUrl && ev.sourceUrl.startsWith('http')) {
    try {
      const u = new URL(ev.sourceUrl);
      const cleanPath = u.pathname.replace(/\/+$/, '');
      if (cleanPath.length > 3) {
        return `${u.hostname}${cleanPath}`.toLowerCase();
      }
    } catch {
      // ignore URL parse errors
    }
  }

  const rawText = ev.notes || ev.location || '';
  const cleanText = rawText
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 60);

  const baseId = ev.id ? ev.id.replace(/-\d{10,14}$/, '').toLowerCase() : '';
  return `${ev.source || ''}:${baseId}:${ev.country || ''}:${cleanText}:${ev.eventDate || ''}`;
}

export const IsometricRadarGlobe: React.FC<IsometricRadarGlobeProps> = ({
  isRefreshing = false,
  lastSyncAt,
  events = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [justFetched, setJustFetched] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const prevSyncRef = useRef<string | null>(lastSyncAt || null);
  const isFirstFetchCompletedRef = useRef<boolean>(false);
  const knownFingerprintsRef = useRef<Set<string>>(new Set());
  const activeDotsRef = useRef<Map<string, ActiveDot>>(new Map());

  // Track newly injected events and mark ONLY new entries after first fetch
  useEffect(() => {
    if (!events || events.length === 0) return;

    const now = Date.now();
    const newItems: ActiveDot[] = [];

    const hasValidCoords = (ev: ConflictEvent) =>
      ev.latitude != null &&
      ev.longitude != null &&
      !isNaN(ev.latitude) &&
      !isNaN(ev.longitude) &&
      (ev.latitude !== 0 || ev.longitude !== 0);

    // Initial load / First fetch: Record all existing baseline events as already known.
    // They are older data, so ZERO dots are displayed.
    if (!isFirstFetchCompletedRef.current) {
      isFirstFetchCompletedRef.current = true;
      for (const ev of events) {
        const fp = getEventFingerprint(ev);
        knownFingerprintsRef.current.add(fp);
      }
      return;
    }

    // Subsequent fetches (1-minute auto-refresh or manual refresh):
    // Detect ONLY genuine new entries that were not present in previous fetches
    for (const ev of events) {
      const fp = getEventFingerprint(ev);
      if (!knownFingerprintsRef.current.has(fp)) {
        knownFingerprintsRef.current.add(fp);
        if (hasValidCoords(ev)) {
          const dot: ActiveDot = {
            id: fp,
            lat: ev.latitude!,
            lon: ev.longitude!,
            addedAt: now,
            severity: ev.severity,
            isConflict: !!ev.isConflict,
          };
          activeDotsRef.current.set(fp, dot);
          newItems.push(dot);
        }
      }
    }

    if (lastSyncAt) {
      prevSyncRef.current = lastSyncAt;
    }

    if (newItems.length > 0) {
      setNewCount(newItems.length);
      setJustFetched(true);
      const timer = setTimeout(() => {
        setJustFetched(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [events, lastSyncAt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotationAngle = 0;
    const pulseRings: Array<{ radius: number; maxRadius: number; opacity: number; color: string }> = [];

    const width = 240;
    const height = 200;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const R = 66; // Increased sphere radius from 46 to 66 (+43.5% radius, +106% area)
    const pitch = 24 * (Math.PI / 180); // 24-degree isometric forward tilt
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    // Helper: 3D sphere coordinate to 2D isometric projection
    const project = (latDeg: number, lonDeg: number, rot: number) => {
      const latRad = (latDeg * Math.PI) / 180;
      const lonRad = ((lonDeg + rot) * Math.PI) / 180;

      // 3D coordinates on unit sphere
      const x3 = Math.cos(latRad) * Math.sin(lonRad);
      const y3 = Math.sin(latRad);
      const z3 = Math.cos(latRad) * Math.cos(lonRad);

      // Tilt forward along X axis
      const yTilted = y3 * cosPitch - z3 * sinPitch;
      const zTilted = y3 * sinPitch + z3 * cosPitch;

      return {
        x: cx + x3 * R,
        y: cy - yTilted * R,
        z: zTilted,
        isFront: zTilted > 0,
      };
    };

    let lastRingSpawn = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Rotation speeds: smooth, majestic slow rotation (~30s per 360 deg revolution)
      const rotSpeed = isRefreshing ? 0.007 : 0.0035;
      rotationAngle = (rotationAngle + rotSpeed * 57.3) % 360;

      // Spawn periodic expanding radar pulse rings
      const ringInterval = isRefreshing ? 400 : 1200;
      if (time - lastRingSpawn > ringInterval) {
        pulseRings.push({
          radius: 12,
          maxRadius: R * 1.45,
          opacity: 0.85,
          color: isRefreshing ? '#f59e0b' : justFetched ? '#10b981' : '#00f0ff',
        });
        lastRingSpawn = time;
      }

      // 1. Draw outer tactical compass ring
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Compass tick marks
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        const innerR = a % 90 === 0 ? R * 1.23 : R * 1.26;
        const outerR = R * 1.30;
        const x1 = cx + Math.cos(rad) * innerR;
        const y1 = cy + Math.sin(rad) * innerR;
        const x2 = cx + Math.cos(rad) * outerR;
        const y2 = cy + Math.sin(rad) * outerR;

        ctx.strokeStyle = a % 90 === 0 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 240, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Compass cardinal labels
      ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.font = '8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', cx, cy - R * 1.38);
      ctx.fillText('S', cx, cy + R * 1.38);
      ctx.fillText('E', cx + R * 1.38, cy);
      ctx.fillText('W', cx - R * 1.38, cy);

      // 2. Render expanding radar pulse rings
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const ring = pulseRings[i];
        ring.radius += isRefreshing ? 1.6 : 0.8;
        ring.opacity = Math.max(0, 1 - ring.radius / ring.maxRadius);

        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.opacity * 0.4;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (ring.radius >= ring.maxRadius) {
          pulseRings.splice(i, 1);
        }
      }

      // 3. Draw globe horizon boundary ellipse (transparent background)
      ctx.strokeStyle = isRefreshing ? 'rgba(245, 158, 11, 0.6)' : 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Draw wireframe parallels (latitudes)
      const latBands = [-60, -30, 0, 30, 60];
      latBands.forEach((lat) => {
        ctx.beginPath();
        let started = false;
        for (let lon = 0; lon <= 360; lon += 8) {
          const pt = project(lat, lon, rotationAngle);
          if (pt.isFront) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = lat === 0 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 240, 255, 0.22)';
        ctx.lineWidth = lat === 0 ? 1.2 : 0.8;
        ctx.stroke();
      });

      // 5. Draw wireframe meridians (longitudes)
      for (let lon = 0; lon < 360; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 6) {
          const pt = project(lat, lon, rotationAngle);
          if (pt.isFront) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = lon % 90 === 0 ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = lon % 90 === 0 ? 1 : 0.7;
        ctx.stroke();
      }

      // 6. Purge expired dots older than 1 minute (60s) & render ONLY newly injected dots
      const now = Date.now();
      for (const [id, dot] of activeDotsRef.current.entries()) {
        if (now - dot.addedAt >= ONE_MINUTE_MS) {
          activeDotsRef.current.delete(id);
        }
      }

      // Render the active newly injected dots marked on the globe
      for (const dot of activeDotsRef.current.values()) {
        const age = now - dot.addedAt;
        if (age >= ONE_MINUTE_MS) continue;

        const pt = project(dot.lat, dot.lon, rotationAngle);
        if (!pt.isFront) continue; // 3D front-hemisphere occlusion

        const depthAlpha = Math.min(1, pt.z * 1.5);
        // Smoothly fade out during the final 5 seconds of the 1-minute window
        const lifespanAlpha = age > 55000 ? Math.max(0, (ONE_MINUTE_MS - age) / 5000) : 1;
        const totalAlpha = depthAlpha * lifespanAlpha;

        const isCombat = dot.isConflict || dot.severity === 'CRITICAL';
        const color = isCombat ? '#ef4444' : dot.severity === 'HIGH' ? '#f59e0b' : '#00f0ff';

        ctx.save();

        // High-visibility beacon ring upon initial injection (first 4 seconds)
        if (age < 4000) {
          const burstProg = (age % 1200) / 1200;
          ctx.strokeStyle = color;
          ctx.globalAlpha = (1 - burstProg) * totalAlpha * 0.9;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 + burstProg * 11, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Subtle rhythmic radar ping ring while active
        const ping = Math.sin((time + dot.lat * 80) * 0.005) * 0.5 + 0.5;
        ctx.strokeStyle = color;
        ctx.globalAlpha = ping * 0.45 * totalAlpha;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5 + ping * 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Solid dot core
        ctx.fillStyle = color;
        ctx.globalAlpha = totalAlpha * 0.95;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.6, 0, Math.PI * 2);
        ctx.fill();

        // White bright center specular point
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = totalAlpha * 0.9;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 7. Central Crosshair Reticle
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRefreshing, justFetched]);

  return (
    <div className="w-full flex items-center justify-center relative select-none font-mono py-1">
      <canvas
        ref={canvasRef}
        style={{ width: '240px', height: '200px' }}
        className="cursor-crosshair block bg-transparent"
      />

      {/* Live News Flash Beacon Badge Overlay */}
      {justFetched && (
        <div className="absolute top-2 px-2 py-0.5 bg-emerald-950/85 border border-emerald-500/80 text-emerald-300 text-[9px] font-bold tracking-wider rounded-[2px] shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
          <Radio className="w-3 h-3 text-emerald-400 animate-spin" />
          <span>{newCount > 0 ? `+${newCount} INJECTED` : 'DISPATCH RECEIVED'}</span>
        </div>
      )}

      {isRefreshing && (
        <div className="absolute top-2 px-2 py-0.5 bg-amber-950/85 border border-amber-500/80 text-amber-300 text-[9px] font-bold tracking-wider rounded-[2px] shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
          <span>SWEEPING PIPELINES...</span>
        </div>
      )}
    </div>
  );
};