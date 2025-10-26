import { ItineraryLogicRequestType } from "../types/ItineraryLogic";
import { scheduleItinerary } from "../utils/scheduler/scheduleItinerary";

export const findRoutes = async (params: Record<string, any>) => {
  // console.log("params", JSON.stringify(params, null, 2));
  const res = scheduleItinerary(
    params as ItineraryLogicRequestType,
    10,
    Infinity
  );
  return { status: "success", data: res };
};
