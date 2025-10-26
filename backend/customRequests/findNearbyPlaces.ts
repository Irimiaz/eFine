import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

export const findNearbyPlaces = async (params: Record<string, any>) => {
  const { lat, lng, radius, type } = params;
  const baseURL =
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        location: `${lat},${lng}`,
        radius,
        type,
        key: GOOGLE_API_KEY,
      },
    });
    const results = response.data.results.map((place: any) => ({
      location: place.geometry.location,
      name: place.name,
      opening_hours: place.opening_hours,
      photos_reference: place.photos,
      place_id: place.place_id,
      rating: place.rating,
      address: place.vicinity,
    }));
    const nextPageToken = response.data.next_page_token;

    return {
      status: "success",
      data: { results: results, nextPageToken: nextPageToken },
    };
  } catch (error: any) {
    console.error("Google Places API Error:", error.message);
    return { status: "error", data: { message: error.message } };
  }
};
