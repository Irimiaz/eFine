import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

export const findPlacesByText = async (params: Record<string, any>) => {
  const { textQuery } = params;
  const baseURL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        query: textQuery,
        key: GOOGLE_API_KEY,
      },
    });

    const results = response.data.results.map((place: any) => ({
      location: place.geometry.location,
      name: place.name,
      opening_hours: place.opening_hours,
      photos_reference: place.photos.map((photo: any) => photo.photo_reference),
      place_id: place.place_id,
      rating: place.rating,
      address: place.formatted_address,
    }));
    const nextPageToken = response.data.next_page_token;

    return {
      status: "success",
      data: { results, nextPageToken },
    };
  } catch (error: any) {
    console.error("Google Places Text Search API Error:", error.message);
    return {
      status: "error",
      data: { message: error.message },
    };
  }
};
