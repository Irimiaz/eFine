import { ApiResponse } from "../types/ApiResponse";
import { ApiStandardRequest } from "../types/ApiRequest";
import { ApiCustomRequest } from "../types/ApiRequest";
import { getAvailableCollections } from "../db";

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = "ApiError";
  }
}

export const validateStandardRequest = async (
  req: ApiStandardRequest
): Promise<void> => {
  // Check if body exists
  if (!req.body) {
    throw new ApiError("Request body is missing", 400);
  }

  const { api, payload } = req.body;

  // Check if api field exists and is valid
  if (!api) {
    throw new ApiError("API action is required", 400);
  }

  // Check if api field is valid
  if (
    api !== "getDataFromCollection" &&
    api !== "setDataToCollection" &&
    api !== "deleteDataFromCollection"
  ) {
    throw new ApiError(`Invalid API action: "${api}"`, 400);
  }

  // Check if payload exists
  if (!payload) {
    throw new ApiError("Payload is required", 400);
  }

  const { collection, params } = payload;

  // Check if collection exists
  if (!collection) {
    throw new ApiError("Collection name is required", 400);
  }

  // Validate collection name against available collections
  try {
    const availableCollections = await getAvailableCollections();
    if (!availableCollections.includes(collection)) {
      throw new ApiError(`Invalid collection name: "${collection}"`, 400);
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Error validating collection name",
      500,
      error instanceof Error ? error.message : String(error)
    );
  }

  // Check if params exists
  if (!params) {
    throw new ApiError("Params are required", 400);
  }

  // Check if query exists in params
  if (!params.query) {
    throw new ApiError("Query parameters are required", 400);
  }

  // For setDataToCollection, validate update params
  if (api === "setDataToCollection" && params.update) {
    if (typeof params.update !== "object" || Array.isArray(params.update)) {
      throw new ApiError("Update parameters must be an object", 400);
    }
  }
};

export const validateCustomRequest = async (
  req: ApiCustomRequest
): Promise<void> => {
  // Check if body exists
  if (!req.body) {
    throw new ApiError("Request body is missing", 400);
  }

  const { api, payload } = req.body;

  // Check if api field exists
  if (!api) {
    throw new ApiError("API action is required", 400);
  }

  // Check if payload exists
  if (!payload) {
    throw new ApiError("Payload is required", 400);
  }

  const { entity, params } = payload;

  // Check if entity exists
  if (!entity) {
    throw new ApiError("Entity name is required", 400);
  }

  // Check if params exists
  if (!params) {
    throw new ApiError("Params are required", 400);
  }
};

export const handleError = (err: any, res: ApiResponse): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  } else if (err.name === "MongoError") {
    // Handle MongoDB specific errors
    if (err.code === 11000) {
      res.status(409).json({
        status: "error",
        message: "Duplicate key error",
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Database error",
      });
    }
  } else {
    // Handle unexpected errors
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
