import {
  ItineraryLogicRequestType,
  ItineraryPlan,
} from "../../types/ItineraryLogic";
import {
  createDistanceGraph,
  computeAllPairShortestPaths,
} from "./graphHelper";
import { generatePlans, getBestPartialPlans, matchesStartEnd } from "./helper";
import { checkOptionalRequirements, simulateRoute } from "./validation";

/**
 * Main entrypoint: Generates the best matching itineraries based on user input.
 */
export const scheduleItinerary = (
  req: ItineraryLogicRequestType,
  maxResults: number,
  tolerance: number
): ItineraryPlan[] | null => {
  /* ---------- generate all raw routes ---------- */
  const graph = createDistanceGraph(req);
  const shortestPaths = computeAllPairShortestPaths(graph);
  const placeIds = req.places.map((p) => p.place_id);

  const allPlans = generatePlans(req, placeIds, shortestPaths, tolerance);

  /* ---------- 1️⃣ hard‑reject wrong start/end ---------- */
  const goodEnds = allPlans.filter((p) => matchesStartEnd(p, req.requirements));
  if (!goodEnds.length) {
    return [
      {
        visits: [],
        totalTravelMinutes: 0,
        suggestions: [
          "No route satisfies the required startLocation and/or endLocation.",
        ],
      },
    ];
  }
  // Create the times for routes
  let simulatedRoutes = [];
  for (const route of goodEnds) {
    const res = simulateRoute(route, req, shortestPaths);
    if (res !== null) {
      simulatedRoutes.push(res);
    }
  }
  // Check the rest of constrainsts
  let allConstraintsRoutes = [];
  for (const route of simulatedRoutes) {
    allConstraintsRoutes.push(
      checkOptionalRequirements(route, req.requirements)
    );
  }
  const fullMatches = allConstraintsRoutes
    .filter((plan) => plan.visits.length === placeIds.length)
    .sort((a, b) => a.totalTravelMinutes - b.totalTravelMinutes)
    .slice(0, maxResults);
  if (fullMatches.length) return fullMatches;

  // /* ---------- 4️⃣ else best partials (longest tour, may break time rules) */
  const partial = getBestPartialPlans(allConstraintsRoutes, maxResults);
  if (partial.length) return partial;

  return null;
};
