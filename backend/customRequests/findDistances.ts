import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

type Distance = {
  to: string; // place_id now!
  distance_text: string;
  distance_value: number;
  duration_text: string;
  duration_value: number;
};

export const getDistances = async (params: Record<string, any>) => {
  const { origins, destinations, mode } = params;

  const formattedOrigins = origins.map((id: string) =>
    id.startsWith("place_id:") ? id : `place_id:${id}`
  );
  const formattedDestinations = destinations.map((id: string) =>
    id.startsWith("place_id:") ? id : `place_id:${id}`
  );

  const baseURL = "https://maps.googleapis.com/maps/api/distancematrix/json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        origins: formattedOrigins.join("|"),
        destinations: formattedDestinations.join("|"),
        mode,
        key: GOOGLE_API_KEY,
      },
    });
    const rows = response.data.rows;

    // 👇 Use the original place_ids, not the addresses
    const groupedByOrigin = origins.map(
      (originPlaceId: string, originIndex: number) => {
        const destinationData = [] as Distance[];

        rows[originIndex].elements.forEach(
          (element: any, destinationIndex: number) => {
            // Skip self-distance
            if (originIndex === destinationIndex) return;

            destinationData.push({
              to: destinations[destinationIndex], // place_id instead of address
              distance_text: element.distance.text,
              distance_value: element.distance.value,
              duration_text: element.duration.text,
              duration_value: element.duration.value,
            });
          }
        );

        return {
          from: origins[originIndex], // place_id
          destinations: destinationData,
        };
      }
    );

    return {
      status: "success",
      data: groupedByOrigin,
    };
  } catch (error: any) {
    console.error(
      "Google Distance Matrix API Error:",
      error.response?.data || error.message
    );
    return {
      status: "error",
      data: { message: error.response?.data?.error_message || error.message },
    };
  }
};
