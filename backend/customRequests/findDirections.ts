import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

export const findDirections = async (params: Record<string, any>) => {
  const {
    origin,
    destination,
    mode = "driving",
    alternatives = false,
    departure_time = "now",
  } = params;

  const baseURL = "https://maps.googleapis.com/maps/api/directions/json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        origin: `place_id:${origin}`,
        destination: `place_id:${destination}`,
        mode,
        alternatives,
        departure_time,
        key: GOOGLE_API_KEY,
      },
    });

    const route = response.data.routes?.[0];
    if (!route) {
      return { status: "success", data: { steps: [] } };
    }

    const steps: any[] = [];
    route.legs.forEach((leg: any) => {
      leg.steps.forEach((step: any) => {
        const item: any = {
          mode: step.travel_mode,
          instruction: step.html_instructions?.replace(/<[^>]+>/g, "") || "",
          distance: step.distance.text,
          duration: step.duration.text,
        };

        if (step.travel_mode === "TRANSIT" && step.transit_details) {
          const t = step.transit_details;
          item.transit = {
            vehicle: t.line.vehicle?.type,
            line: t.line.short_name || t.line.name,
            from: t.departure_stop.name,
            to: t.arrival_stop.name,
            departure_time: t.departure_time.text,
            arrival_time: t.arrival_time.text,
            num_stops: t.num_stops,
          };
        }

        steps.push(item);
      });
    });

    return {
      status: "success",
      data: { steps },
    };
  } catch (error: any) {
    console.error("Google Directions API Error:", error.message);
    return { status: "error", data: { message: error } };
  }
};
