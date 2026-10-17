'use client';

/**
 * useIntelligenceAI — Reactive React hook that orchestrates all five AI engine modules.
 * Computes or memoizes all metrics without freezing the main thread by batching
 * heavy computations via useMemo with stable dependency arrays.
 *
 * Inputs: live telemetry arrays from the WarRoom data pipeline
 * Outputs: fully computed intelligence reports available synchronously
 */

import { useMemo } from 'react';
import { ConflictEvent, Conflict, FirmsThermalPoint, MilitaryAircraft } from '@/types/conflict';
import { CountryRelation } from '@/lib/data/country-relationships';

import {
  runSensorFusion,
  getSensorFusionSummary,
  VerifiedIncident,
  SensorFusionSummary,
} from '@/lib/intelligence/sensor-fusion';

import {
  runGlobalEscalationForecast,
  GlobalEscalationReport,
} from '@/lib/intelligence/escalation-forecaster';

import {
  runSpatialClustering,
  BattlefrontCluster,
} from '@/lib/intelligence/spatial-clustering';

import {
  runNetworkCentrality,
  NetworkAnalysis,
} from '@/lib/intelligence/network-centrality';

import {
  parseIntelCommand,
  isIntelCommand,
  ParsedCommand,
} from '@/lib/intelligence/command-parser';

export interface IntelligenceAIResult {
  // Module A outputs
  verifiedIncidents: VerifiedIncident[];
  sensorFusionSummary: SensorFusionSummary;

  // Module B outputs
  escalationReport: GlobalEscalationReport;

  // Module C outputs
  battlefrontClusters: BattlefrontCluster[];

  // Module D outputs
  networkAnalysis: NetworkAnalysis;

  // Utility: command parser (stateless, exposed for terminal use)
  parseCommand: (raw: string, knownCountries?: string[]) => ParsedCommand;
  isAICommand: (raw: string) => boolean;

  // Computed convenience values
  globalThreatIndex: number;      // 0-100
  topFlashpoint: string;          // Name of highest-threat country
  activeBattlefronts: number;     // Count of detected clusters
  sensorCorroborationRate: number; // 0.0-1.0
}

/**
 * Convert FirmsGeoJson features to FirmsThermalPoint array.
 * Accepts the raw geojson response object or undefined.
 */
function extractFirmsPoints(firmsGeoJson: any): FirmsThermalPoint[] {
  if (!firmsGeoJson?.features) return [];
  return (firmsGeoJson.features as any[])
    .filter((f: any) => f.geometry?.coordinates && f.properties)
    .map((f: any) => {
      const p = f.properties;
      return {
        id: p.id || `firms-${p.latitude}-${p.longitude}`,
        latitude: p.latitude ?? f.geometry.coordinates[1],
        longitude: p.longitude ?? f.geometry.coordinates[0],
        brightTi4: p.brightTi4 ?? 310,
        acqDate: p.acqDate ?? new Date().toISOString().split('T')[0],
        acqTime: String(p.acqTime ?? '0000'),
        satellite: p.satellite ?? 'VIIRS',
        confidence: p.confidence ?? 'NOMINAL',
        frp: p.frp ?? 1.0,
        daynight: (p.daynight === 'N' ? 'N' : 'D') as 'D' | 'N',
        theater: p.theater,
      } as FirmsThermalPoint;
    });
}

/**
 * Convert AviationGeoJson features to MilitaryAircraft array.
 */
function extractAviationPoints(aviationGeoJson: any): MilitaryAircraft[] {
  if (!aviationGeoJson?.features) return [];
  return (aviationGeoJson.features as any[])
    .filter((f: any) => f.geometry?.coordinates && f.properties)
    .map((f: any) => {
      const p = f.properties;
      return {
        id: p.id || `avi-${p.hex}`,
        hex: p.hex ?? '',
        callsign: p.callsign ?? 'MIL',
        registration: p.registration,
        typeCode: p.typeCode ?? '',
        modelDescription: p.modelDescription ?? 'Military Aircraft',
        category: p.category ?? 'UNKNOWN',
        latitude: p.latitude ?? f.geometry.coordinates[1],
        longitude: p.longitude ?? f.geometry.coordinates[0],
        altitudeFt: p.altitudeFt ?? 0,
        altitudeLabel: p.altitudeLabel ?? 'GND',
        speedKnots: p.speedKnots ?? 0,
        trackDeg: p.trackDeg ?? 0,
        squawk: p.squawk,
        iconName: p.iconName ?? 'aircraft-default',
        seenSeconds: p.seenSeconds,
      } as MilitaryAircraft;
    });
}

/**
 * Flatten CountryRelation arrays from a relation network into a flat array.
 * Accepts either a RelationshipNetwork object or a raw CountryRelation[].
 */
function extractRelations(relationNetwork: any): CountryRelation[] {
  if (!relationNetwork) return [];
  if (Array.isArray(relationNetwork)) return relationNetwork as CountryRelation[];
  if (relationNetwork.relations && Array.isArray(relationNetwork.relations)) {
    return relationNetwork.relations as CountryRelation[];
  }
  return [];
}

export function useIntelligenceAI(
  events: ConflictEvent[],
  conflicts: Conflict[],
  firmsGeoJson: any,
  aviationGeoJson: any,
  relationNetwork: any
): IntelligenceAIResult {
  // ── Stable data extraction (memoized to avoid redundant array construction) ──
  const firmsPoints  = useMemo(() => extractFirmsPoints(firmsGeoJson),   [firmsGeoJson]);
  const aviationPoints = useMemo(() => extractAviationPoints(aviationGeoJson), [aviationGeoJson]);
  const relations    = useMemo(() => extractRelations(relationNetwork),   [relationNetwork]);

  // ── Module A: Sensor Fusion ────────────────────────────────────────────────
  const verifiedIncidents = useMemo(
    () => runSensorFusion(events, firmsPoints, aviationPoints),
    [events, firmsPoints, aviationPoints]
  );

  const sensorFusionSummary = useMemo(
    () => getSensorFusionSummary(verifiedIncidents),
    [verifiedIncidents]
  );

  // ── Module B: Escalation Forecaster ───────────────────────────────────────
  const escalationReport = useMemo(
    () => runGlobalEscalationForecast(events, conflicts, 10),
    [events, conflicts]
  );

  // ── Module C: Spatial Clustering ──────────────────────────────────────────
  const battlefrontClusters = useMemo(
    () => runSpatialClustering(events, firmsPoints, 35, 3),
    [events, firmsPoints]
  );

  // ── Module D: Network Centrality ──────────────────────────────────────────
  const networkAnalysis = useMemo(
    () => runNetworkCentrality(relations),
    [relations]
  );

  // ── Convenience aggregates ─────────────────────────────────────────────────
  const globalThreatIndex = escalationReport.globalThreatIndex;
  const topFlashpoint = escalationReport.topFlashpoints[0]?.country ?? 'N/A';
  const activeBattlefronts = battlefrontClusters.length;
  const sensorCorroborationRate = sensorFusionSummary.corroborationRate;

  return {
    verifiedIncidents,
    sensorFusionSummary,
    escalationReport,
    battlefrontClusters,
    networkAnalysis,
    parseCommand: parseIntelCommand,
    isAICommand: isIntelCommand,
    globalThreatIndex,
    topFlashpoint,
    activeBattlefronts,
    sensorCorroborationRate,
  };
}
