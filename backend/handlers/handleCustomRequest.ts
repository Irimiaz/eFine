import { findAverageTime } from "../customRequests/findAverageTime";
import { findDirections } from "../customRequests/findDirections";
import { getDistances } from "../customRequests/findDistances";
import { findNearbyPlaces } from "../customRequests/findNearbyPlaces";
import { findPlaceDetails } from "../customRequests/findPlaceDetails";
import { findPlacesByText } from "../customRequests/findPlacesByText";
import { openAI } from "../customRequests/openAI";
import { findRoutes } from "../customRequests/findRoutes";
import { ApiCustomRequest } from "../types/ApiRequest";
import { ApiResponse } from "../types/ApiResponse";
import { scrapeWebsite } from "../customRequests/webCrawl";

async function handleCustomRequest(req: ApiCustomRequest, res: ApiResponse) {
  const { entity, params } = req.body.payload;

  let status: string;
  let data: any = null;

  switch (entity) {
    case "FIND_ROUTES":
      ({ status, data } = await findRoutes(params));
      break;

    case "FIND_NEARBY_PLACES":
      ({ status, data } = await findNearbyPlaces(params));
      break;

    case "FIND_PLACE_BY_TEXT":
      ({ status, data } = await findPlacesByText(params));
      break;

    case "PLACE_DETAILS":
      ({ status, data } = await findPlaceDetails(params));
      break;

    case "FIND_DISTANCES":
      ({ status, data } = await getDistances(params));
      break;

    case "FIND_DIRECTIONS":
      ({ status, data } = await findDirections(params));
      break;
    case "FIND_AVERAGE_TIME":
      ({ status, data } = await findAverageTime(params));
      break;
    case "OPENAI":
      ({ status, data } = await openAI(params));
      break;
    case "SCRAPE_WEBSITE":
      ({ status, data } = await scrapeWebsite(params));
      break;

    default:
      return res.status(400).json({
        status: "error",
        message: `Unknown custom request entity: "${entity}"`,
      });
  }

  return res.json({ status: status as "success" | "error", data });
}

export default handleCustomRequest;
