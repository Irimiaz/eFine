import {
  ItineraryLogicRequestType,
  ItineraryPlan,
  Place,
  Requirements,
} from "../../types/ItineraryLogic";
import { generateNearestNeighborRoutes } from "./graphHelper";

export function generatePlans(
  req: ItineraryLogicRequestType,
  placeIds: string[],
  shortestPaths: Record<string, Record<string, { distance: number }>>,
  tolerance: number
): string[][] {
  // const plans: ItineraryPlan[] = [];
  let allRoutes = [];
  for (const start of placeIds) {
    const routes = generateNearestNeighborRoutes(
      placeIds,
      shortestPaths,
      start,
      tolerance
    );
    for (const route of routes) {
      // plans.push(simulateRoute(route, req, shortestPaths));
      allRoutes.push(route);
    }
  }

  return allRoutes;
}

export function getBestPartialPlans(
  plans: ItineraryPlan[],
  limit: number
): ItineraryPlan[] {
  if (limit <= 0) {
    return [];
  }

  // Group plans by number of visits
  const groups = plans.reduce((map, plan) => {
    const count = plan.visits.length;
    const bucket = map.get(count) || [];
    bucket.push(plan);
    map.set(count, bucket);
    return map;
  }, new Map<number, ItineraryPlan[]>());

  // Sort the visit‐counts descending
  const countsDesc = Array.from(groups.keys()).sort((a, b) => b - a);

  const result: ItineraryPlan[] = [];
  for (const count of countsDesc) {
    const bucket = groups.get(count)!;
    // Add all plans with this visit‐count
    result.push(...bucket);
    // If we've reached or exceeded the limit, we're done
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

export function matchesStartEnd(plan: string[], req: Requirements): boolean {
  if (req.startLocation && plan[0] !== req.startLocation) return false;
  if (req.endLocation && plan.at(-1) !== req.endLocation) return false;
  return true;
}
