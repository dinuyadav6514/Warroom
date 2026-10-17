/**
 * MODULE D: Bilateral Vector Network Centrality & Cascade Engine
 * Models country relationships as a directed weighted graph G=(V,E).
 * Computes degree centrality, betweenness centrality, and cascade
 * contagion risk scores for conflict spillover analysis.
 */

import { CountryRelation } from '@/lib/data/country-relationships';

export interface NodeCentrality {
  country: string;
  inDegree: number;
  outDegree: number;
  totalDegree: number;
  betweenness: number;          // Normalised 0.0 – 1.0
  cascadeRisk: number;          // 0.0 – 1.0 contagion probability
  isChokepoint: boolean;        // High betweenness strategic node
  dominantThreatDirection: 'INCOMING' | 'OUTGOING' | 'BALANCED';
}

export interface NetworkAnalysis {
  nodes: NodeCentrality[];
  chokepoints: NodeCentrality[];
  highestCascadeRisk: NodeCentrality[];
  globalDensity: number;        // |E| / (|V| * (|V|-1))
  mostConnectedCountry: string;
}

/** Adjacency list representation */
type Graph = Map<string, Set<string>>;

/**
 * Build directed adjacency graph from CountryRelation edges.
 */
function buildGraph(relations: CountryRelation[]): {
  outGraph: Graph;
  inGraph: Graph;
  nodes: Set<string>;
  edgeWeights: Map<string, number>;
} {
  const outGraph: Graph = new Map();
  const inGraph: Graph = new Map();
  const nodes = new Set<string>();
  const edgeWeights = new Map<string, number>();

  const ensureNode = (c: string) => {
    if (!outGraph.has(c)) outGraph.set(c, new Set());
    if (!inGraph.has(c)) inGraph.set(c, new Set());
    nodes.add(c);
  };

  for (const rel of relations) {
    const from = rel.fromCountry.trim();
    const to   = rel.toCountry.trim();
    if (!from || !to || from === to) continue;

    ensureNode(from);
    ensureNode(to);

    if (rel.direction === 'OUTGOING') {
      outGraph.get(from)!.add(to);
      inGraph.get(to)!.add(from);
    } else {
      outGraph.get(to)!.add(from);
      inGraph.get(from)!.add(to);
    }

    const key = `${from}→${to}`;
    edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + (rel.eventCount || 1));
  }

  return { outGraph, inGraph, nodes, edgeWeights };
}

/**
 * BFS shortest path count from source to all reachable nodes.
 * Returns a map of { node → distance } and a stack in BFS order.
 */
function bfs(
  source: string,
  graph: Graph,
  nodes: Set<string>
): { dist: Map<string, number>; sigma: Map<string, number>; predecessors: Map<string, string[]>; stack: string[] } {
  const dist = new Map<string, number>();
  const sigma = new Map<string, number>(); // shortest path counts
  const predecessors = new Map<string, string[]>();
  const stack: string[] = [];
  const queue: string[] = [];

  for (const n of nodes) {
    dist.set(n, -1);
    sigma.set(n, 0);
    predecessors.set(n, []);
  }
  dist.set(source, 0);
  sigma.set(source, 1);
  queue.push(source);

  while (queue.length > 0) {
    const v = queue.shift()!;
    stack.push(v);
    const neighbours = graph.get(v) ?? new Set<string>();
    for (const w of neighbours) {
      if (dist.get(w) === -1) {
        dist.set(w, dist.get(v)! + 1);
        queue.push(w);
      }
      if (dist.get(w) === dist.get(v)! + 1) {
        sigma.set(w, sigma.get(w)! + sigma.get(v)!);
        predecessors.get(w)!.push(v);
      }
    }
  }

  return { dist, sigma, predecessors, stack };
}

/**
 * Brandes algorithm for betweenness centrality (unnormalised).
 * Uses the underlying undirected version of the graph for global chokepoint identification.
 */
function computeBetweenness(
  undirectedGraph: Graph,
  nodes: Set<string>
): Map<string, number> {
  const cb = new Map<string, number>();
  for (const n of nodes) cb.set(n, 0);

  for (const s of nodes) {
    const { sigma, predecessors, stack } = bfs(s, undirectedGraph, nodes);
    const delta = new Map<string, number>();
    for (const n of nodes) delta.set(n, 0);

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w)!) {
        const coeff = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + coeff);
      }
      if (w !== s) {
        cb.set(w, cb.get(w)! + delta.get(w)!);
      }
    }
  }

  return cb;
}

/**
 * Build undirected version of a directed graph for betweenness calculation.
 */
function toUndirected(outGraph: Graph, inGraph: Graph, nodes: Set<string>): Graph {
  const undirected: Graph = new Map();
  for (const n of nodes) undirected.set(n, new Set());
  for (const [from, tos] of outGraph) {
    for (const to of tos) {
      undirected.get(from)!.add(to);
      undirected.get(to)!.add(from);
    }
  }
  return undirected;
}

/**
 * Run full network centrality analysis on a set of bilateral relations.
 */
export function runNetworkCentrality(relations: CountryRelation[]): NetworkAnalysis {
  if (relations.length === 0) {
    return {
      nodes: [],
      chokepoints: [],
      highestCascadeRisk: [],
      globalDensity: 0,
      mostConnectedCountry: 'N/A',
    };
  }

  const { outGraph, inGraph, nodes, edgeWeights } = buildGraph(relations);
  const undirected = toUndirected(outGraph, inGraph, nodes);

  // Betweenness (unnormalised)
  const rawBetweenness = computeBetweenness(undirected, nodes);

  // Normalisation factor for directed graph: (n-1)*(n-2)
  const n = nodes.size;
  const normFactor = n > 2 ? (n - 1) * (n - 2) : 1;

  // Max betweenness for relative normalisation
  let maxBetweenness = 0;
  for (const v of rawBetweenness.values()) {
    if (v > maxBetweenness) maxBetweenness = v;
  }

  const nodeResults: NodeCentrality[] = [];

  for (const country of nodes) {
    const inDeg  = (inGraph.get(country)?.size ?? 0);
    const outDeg = (outGraph.get(country)?.size ?? 0);
    const totalDeg = inDeg + outDeg;

    const rawBet = rawBetweenness.get(country) ?? 0;
    const betweenness = maxBetweenness > 0
      ? parseFloat((rawBet / maxBetweenness).toFixed(4))
      : 0;

    // Cascade Risk Score: combines in-degree (threat reception) and betweenness (propagation)
    // Formula: P_cascade(X) = 0.5 * (inDegree/totalNodes) + 0.5 * betweenness
    const cascadeRisk = parseFloat(
      Math.min(1, 0.5 * (inDeg / Math.max(1, n)) + 0.5 * betweenness).toFixed(4)
    );

    // Chokepoint: betweenness in top 20% AND totalDegree >= 3
    const isChokepoint = betweenness >= 0.5 && totalDeg >= 3;

    const dominantThreatDirection: 'INCOMING' | 'OUTGOING' | 'BALANCED' =
      inDeg > outDeg * 1.5 ? 'INCOMING' :
      outDeg > inDeg * 1.5 ? 'OUTGOING' :
      'BALANCED';

    nodeResults.push({
      country,
      inDegree: inDeg,
      outDegree: outDeg,
      totalDegree: totalDeg,
      betweenness,
      cascadeRisk,
      isChokepoint,
      dominantThreatDirection,
    });
  }

  // Sort by totalDegree descending
  nodeResults.sort((a, b) => b.totalDegree - a.totalDegree);

  const chokepoints = nodeResults.filter((n) => n.isChokepoint).sort((a, b) => b.betweenness - a.betweenness);
  const highestCascadeRisk = [...nodeResults].sort((a, b) => b.cascadeRisk - a.cascadeRisk).slice(0, 5);

  // Edge count for density
  let edgeCount = 0;
  for (const s of outGraph.values()) edgeCount += s.size;
  const globalDensity = n > 1 ? parseFloat((edgeCount / (n * (n - 1))).toFixed(4)) : 0;

  return {
    nodes: nodeResults,
    chokepoints,
    highestCascadeRisk,
    globalDensity,
    mostConnectedCountry: nodeResults[0]?.country ?? 'N/A',
  };
}
