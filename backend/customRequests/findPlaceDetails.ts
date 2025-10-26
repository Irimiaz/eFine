import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;

export const findPlaceDetails = async (params: Record<string, any>) => {
  const { place_id } = params;
  const baseURL = "https://maps.googleapis.com/maps/api/place/details/json";

  try {
    const response = await axios.get(baseURL, {
      params: {
        place_id,
        key: GOOGLE_API_KEY,
      },
    });

    const place = response.data.result; // or response.data.result / response.result depending on structure
    const result = {
      description: place.editorial_summary?.overview,
      current_opening_hours: place.current_opening_hours,
      address: place.vicinity,
      formatted_phone_number: place.formatted_phone_number,
      location: place.geometry.location,
      name: place.name,
      photos_reference:
        place.photos?.map((photo: any) => photo.photo_reference) || [],
      place_id: place.place_id,
      rating: place.rating,
      reviews:
        place.reviews?.map((review: any) => ({
          author_name: review.author_name,
          rating: review.rating,
          relative_time_description: review.relative_time_description,
          text: review.text,
        })) || [],
      website: place.website,
    };
    return {
      status: "success",
      data: result,
    };
  } catch (error: any) {
    console.error("Google Place Details API Error:", error.message);
    return {
      status: "error",
      data: { message: error.message },
    };
  }
};
