import { Graph, alg } from "@dagrejs/graphlib";
import { ItineraryLogicRequestType } from "../../types/ItineraryLogic";

export const createDistanceGraph = (req: ItineraryLogicRequestType): Graph => {
  const g = new Graph({ directed: true });
  for (const p of req.places) {
    g.setNode(p.place_id, p);
  }
  for (const { from, destinations } of req.distances) {
    for (const { to, duration } of destinations) {
      g.setEdge(from, to, duration);
    }
  }
  return g;
};

export const computeAllPairShortestPaths = (
  graph: Graph
): Record<string, Record<string, { distance: number }>> => {
  const out: Record<string, Record<string, { distance: number }>> = {};
  for (const s of graph.nodes()) {
    const dRes = alg.dijkstra(
      graph,
      s,
      (e) => graph.edge(e) as number,
      (v) => graph.outEdges(v) || []
    );
    out[s] = {};
    for (const [t, info] of Object.entries(dRes)) {
      out[s][t] = { distance: info.distance };
    }
  }
  return out;
};

export const generateNearestNeighborRoutes = (
  nodes: string[],
  distances: Record<string, Record<string, { distance: number }>>,
  startNode: string,
  tolerance: number
): string[][] => {
  const allRoutes: string[][] = [];
  function branch(curRoute: string[], toVisit: Set<string>) {
    if (toVisit.size === 0) {
      allRoutes.push([...curRoute]);
      return;
    }
    const last = curRoute[curRoute.length - 1];
    let best = Infinity;
    for (const nxt of toVisit) {
      const d = distances[last]?.[nxt]?.distance;
      if (d !== undefined && d < best) best = d;
    }
    if (best === Infinity) {
      allRoutes.push([...curRoute]);
      return;
    }
    const maxAllowed = best * (1 + tolerance);
    for (const nxt of toVisit) {
      const d = distances[last]?.[nxt]?.distance;
      if (d !== undefined && d <= maxAllowed) {
        const nr = [...curRoute, nxt];
        const nv = new Set(toVisit);
        nv.delete(nxt);
        branch(nr, nv);
      }
    }
  }
  branch([startNode], new Set(nodes.filter((n) => n !== startNode)));
  return allRoutes;
};
