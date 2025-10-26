import { ApiStandardRequest } from "../types/ApiRequest";
import { ApiResponse } from "../types/ApiResponse";
import { BaseCollection } from "../types/BaseCollection";
import { ApiError } from "../utils/errorHandler";

async function handleStandardRequest(
  req: ApiStandardRequest,
  res: ApiResponse
) {
  const { api, payload } = req.body;
  const { collection, params } = payload;
  const collectionInstance = new BaseCollection(collection);
  const query = params.query;
  const update = params.update || {};

  switch (api) {
    case "getDataFromCollection": {
      const result = await collectionInstance.find(query);
      return res.json({ status: "success", data: result });
    }

    case "setDataToCollection": {
      if (Object.keys(update).length > 0) {
        const existing = await collectionInstance.findOne(query);
        if (!existing) {
          throw new ApiError("No matching record found to update", 404);
        }
        const result = await collectionInstance.updateOne(query, update);
        return res.json({
          status: "success",
          message: "updated",
          data: result,
        });
      } else {
        const result = await collectionInstance.insertOne(query);
        return res.json({
          status: "success",
          message: "inserted",
          data: result,
        });
      }
    }

    case "deleteDataFromCollection": {
      const result = await collectionInstance.deleteOne(query);
      if (result.deletedCount === 0) {
        throw new ApiError("No matching record found to delete", 404);
      }
      return res.json({ status: "success", data: result });
    }

    default: {
      return res.status(400).json({
        status: "error",
        message: `Unknown API action: "${api}"`,
      });
    }
  }
}

export default handleStandardRequest;
