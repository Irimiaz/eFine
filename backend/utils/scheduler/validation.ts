import { addMinutes } from "date-fns";
import {
  ItineraryLogicRequestType,
  ItineraryPlan,
  VisitPlan,
  Requirements,
} from "../../types/ItineraryLogic";

export function simulateRoute(
  route: string[],
  req: ItineraryLogicRequestType,
  distances: Record<string, Record<string, { distance: number }>>
): ItineraryPlan | null {
  // --- Helpers for time parsing/formatting ---
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
  function parseDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`);
  }
  function formatDateTime(d: Date): string {
    return (
      [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join("-") +
      " " +
      [pad(d.getHours()), pad(d.getMinutes())].join(":")
    );
  }
  function addMinutes(d: Date, mins: number): Date {
    return new Date(d.getTime() + mins * 60000);
  }

  // --- Build lookup tables ---
  const placeById = new Map<string, (typeof req.places)[0]>();
  for (const p of req.places) {
    placeById.set(p.place_id, p);
  }
  const fixedDay = new Map<string, string>();
  for (const pv of req.requirements.placesVisitDays || []) {
    fixedDay.set(pv.place_id, pv.day);
  }
  const intervals = [...req.requirements.days].sort((a, b) =>
    a.day.localeCompare(b.day)
  );
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const visits: VisitPlan[] = [];
  const suggestions: string[] = [];

  if (route.length === 0) return null;

  // initialize these so TS knows they're always defined
  let currentPlaceId: string = route[0];
  let currentTime: Date = new Date();
  let currentDayIndex: number = 0;

  // --- 1) INITIAL placement for route[0], scanning all days ---
  {
    const firstId = route[0];
    const firstPlace = placeById.get(firstId);
    if (!firstPlace) return null;

    const reqDay = fixedDay.get(firstId);
    // if a specific day is required, only try that one; otherwise try all
    const candidateDays = reqDay
      ? intervals.map((_, i) => i).filter((i) => intervals[i].day === reqDay)
      : intervals.map((_, i) => i);

    let placed = false;
    for (const di of candidateDays) {
      const iv = intervals[di];
      const arrival = parseDateTime(iv.day, iv.startTime);

      // check opening hours
      const dow = dayNames[new Date(`${iv.day}T00:00:00`).getDay()];
      const oh = (firstPlace.opening_hours || []).find((x) => x.day === dow);
      if (!oh?.open || !oh?.close) continue;
      const openAt = parseDateTime(iv.day, oh.open);
      const closeAt = parseDateTime(iv.day, oh.close);
      const intervalEnd = parseDateTime(iv.day, iv.endTime);

      const startVisit = arrival < openAt ? openAt : arrival;
      const endVisit = addMinutes(startVisit, firstPlace.average_visit_time);

      // must finish before both closing and interval end
      if (endVisit > closeAt || endVisit > intervalEnd) continue;

      // commit the visit
      visits.push({
        placeId: firstId,
        placeName: firstPlace.name,
        arrivalTime: formatDateTime(arrival),
        startVisitTime: formatDateTime(startVisit),
        endVisitTime: formatDateTime(endVisit),
        timeTravelled: 0,
      });
      currentPlaceId = firstId;
      currentTime = endVisit;
      currentDayIndex = di;
      placed = true;
      break;
    }

    if (!placed) {
      suggestions.push(
        `${firstPlace.name} cannot be scheduled on any of the available days.`
      );
      return null;
    }
  }

  // --- 2) Helper to try scheduling a subsequent place in interval di ---
  function tryInterval(
    placeId: string,
    place: (typeof req.places)[0],
    di: number
  ): boolean {
    const iv = intervals[di];
    const isNewDay = di > currentDayIndex;
    const travel = isNewDay ? 0 : distances[currentPlaceId][placeId].distance;
    const arrival = isNewDay
      ? parseDateTime(iv.day, iv.startTime)
      : addMinutes(currentTime, travel);

    const isEndpoint =
      placeId === req.requirements.startLocation ||
      placeId === req.requirements.endLocation;

    let startVisit: Date, endVisit: Date;
    if (isEndpoint) {
      startVisit = arrival;
      endVisit = addMinutes(startVisit, place.average_visit_time);
    } else {
      const dow = dayNames[new Date(`${iv.day}T00:00:00`).getDay()];
      const oh = (place.opening_hours || []).find((x) => x.day === dow);
      if (!oh?.open || !oh?.close) return false;
      const openAt = parseDateTime(iv.day, oh.open);
      const closeAt = parseDateTime(iv.day, oh.close);
      const intervalEnd = parseDateTime(iv.day, iv.endTime);

      startVisit = arrival < openAt ? openAt : arrival;
      endVisit = addMinutes(startVisit, place.average_visit_time);

      if (endVisit > closeAt || endVisit > intervalEnd) {
        return false;
      }
    }

    visits.push({
      placeId,
      placeName: place.name,
      arrivalTime: formatDateTime(arrival),
      startVisitTime: formatDateTime(startVisit),
      endVisitTime: formatDateTime(endVisit),
      timeTravelled: isNewDay ? 0 : distances[currentPlaceId][placeId].distance,
    });
    currentPlaceId = placeId;
    currentTime = endVisit;
    currentDayIndex = di;
    return true;
  }

  // --- 3) Schedule the rest of the route ---
  for (let i = 1; i < route.length; i++) {
    const placeId = route[i];
    const place = placeById.get(placeId);
    if (!place) {
      suggestions.push(`Unknown place ID ${placeId}.`);
      continue;
    }

    const reqDay = fixedDay.get(placeId);
    let placed = false;

    if (reqDay) {
      // only try the exact required day
      const di = intervals.findIndex((iv) => iv.day === reqDay);
      if (di >= currentDayIndex && tryInterval(placeId, place, di)) {
        placed = true;
      } else {
        suggestions.push(
          `${place.name} cannot fit into required day ${reqDay}.`
        );
      }
    } else {
      // scan forward for any fitting interval
      for (let di = currentDayIndex; di < intervals.length; di++) {
        if (tryInterval(placeId, place, di)) {
          placed = true;
          break;
        }
      }
      if (!placed) {
        suggestions.push(`Could not fit ${place.name} into any available day.`);
      }
    }
  }

  if (visits.length === 0) return null;
  const totalTravelMinutes = visits.reduce(
    (sum, v) => sum + v.timeTravelled,
    0
  );

  const plan: ItineraryPlan = { visits, totalTravelMinutes };
  if (suggestions.length) plan.suggestions = suggestions;
  return plan;
}

export function checkOptionalRequirements(
  plan: ItineraryPlan,
  reqs: Requirements
): ItineraryPlan {
  // Start with any existing suggestions
  const suggestions = plan.suggestions ? [...plan.suggestions] : [];

  // Check that each explicitly requested place is actually in the plan
  if (reqs.placesToVisit) {
    for (const { place_id } of reqs.placesToVisit) {
      const found = plan.visits.some((v) => v.placeId === place_id);
      if (!found) {
        suggestions.push(
          `Place with ID "${place_id}" was required but is not included in the itinerary.`
        );
      }
    }
  }

  // Return a new plan object, including suggestions only if any were added
  return {
    ...plan,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}
