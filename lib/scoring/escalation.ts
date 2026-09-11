import { ConflictEvent } from '@/types/conflict';

export interface EscalationResult {
  index: number; // 0 - 100
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendSymbol: '↑' | '↓' | '→';
  explanation: string;
  velocityLast24h: number;
  dailyAveragePrior: number;
  percentageChange: number | null;
}

/**
 * Calculates measurable Escalation Index (0-100) and Trend for a group of events.
 *
 * Method:
 * 1. Counts events in the most recent 24-hour window (T_24h).
 * 2. Counts events in the preceding baseline period (T_prior).
 * 3. Calculates normalized daily baseline rate = T_prior / days_prior.
 * 4. Compares T_24h to the daily baseline.
 * 5. Multiplies by fatality and high-severity intensity weighting.
 *
 * Strictly non-predictive. Evaluates only observed historic and recent velocity.
 */
export function calculateEscalationIndex(events: ConflictEvent[], windowDays = 7): EscalationResult {
  if (!events || events.length === 0) {
    return {
      index: 0,
      trend: 'STABLE',
      trendSymbol: '→',
      explanation: 'No incidents observed within the selected time window.',
      velocityLast24h: 0,
      dailyAveragePrior: 0,
      percentageChange: null,
    };
  }

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const cutoff24h = now - oneDayMs;

  let count24h = 0;
  let countPrior = 0;
  let fatalities24h = 0;
  let criticalCount = 0;

  for (const ev of events) {
    const time = new Date(ev.timestamp || ev.eventDate).getTime();
    if (isNaN(time)) continue;

    if (time >= cutoff24h) {
      count24h++;
      fatalities24h += ev.fatalities || 0;
      if (ev.severity === 'CRITICAL' || ev.severity === 'HIGH') {
        criticalCount++;
      }
    } else {
      countPrior++;
    }
  }

  const priorDays = Math.max(1, windowDays - 1);
  const dailyAveragePrior = countPrior / priorDays;

  // Percentage change in rate
  let percentageChange: number | null = null;
  let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  let trendSymbol: '↑' | '↓' | '→' = '→';

  if (dailyAveragePrior > 0) {
    percentageChange = Math.round(((count24h - dailyAveragePrior) / dailyAveragePrior) * 100);
    if (percentageChange >= 25) {
      trend = 'UP';
      trendSymbol = '↑';
    } else if (percentageChange <= -25) {
      trend = 'DOWN';
      trendSymbol = '↓';
    } else {
      trend = 'STABLE';
      trendSymbol = '→';
    }
  } else if (count24h > 0) {
    percentageChange = 100;
    trend = 'UP';
    trendSymbol = '↑';
  }

  // Base score from volume and ratio
  let rawScore = 0;
  if (dailyAveragePrior === 0 && count24h === 0) {
    rawScore = 5;
  } else if (dailyAveragePrior === 0) {
    rawScore = Math.min(75, count24h * 15);
  } else {
    const ratio = count24h / dailyAveragePrior;
    rawScore = Math.min(80, ratio * 35);
  }

  // Intensity modifier from fatalities and critical events in 24h
  const fatalityBonus = Math.min(15, fatalities24h * 2);
  const criticalBonus = Math.min(10, criticalCount * 2.5);

  const escalationIndex = Math.min(100, Math.max(0, Math.round(rawScore + fatalityBonus + criticalBonus)));

  let explanation = '';
  if (trend === 'UP') {
    explanation = percentageChange !== null
      ? `Incident frequency increased by ${percentageChange}% during the current 24-hour period (${count24h} events) relative to the preceding daily baseline (${dailyAveragePrior.toFixed(1)}/day).`
      : `Elevated activity observed in the last 24 hours (${count24h} events).`;
  } else if (trend === 'DOWN') {
    explanation = percentageChange !== null
      ? `Incident frequency decreased by ${Math.abs(percentageChange)}% in the current 24-hour period (${count24h} events) relative to earlier days (${dailyAveragePrior.toFixed(1)}/day).`
      : `Incident frequency is lower in the most recent 24-hour interval.`;
  } else {
    explanation = `Incident frequency has remained stable over the current 24-hour period (${count24h} events vs ${dailyAveragePrior.toFixed(1)}/day baseline).`;
  }

  return {
    index: escalationIndex,
    trend,
    trendSymbol,
    explanation,
    velocityLast24h: count24h,
    dailyAveragePrior: Number(dailyAveragePrior.toFixed(1)),
    percentageChange,
  };
}
