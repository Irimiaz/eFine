import { ApiCustomRequest, ApiStandardRequest } from "../types/ApiRequest";
import { ApiResponse } from "../types/ApiResponse";
import {
  handleError,
  validateCustomRequest,
  validateStandardRequest,
} from "../utils/errorHandler";
import isCustomRequest from "../utils/isCustomRequest";
import handleCustomRequest from "./handleCustomRequest";
import handleStandardRequest from "./handleStandardRequest";

const requestHandler = async (
  req: ApiStandardRequest | ApiCustomRequest,
  res: ApiResponse
) => {
  try {
    if (isCustomRequest(req)) {
      await validateCustomRequest(req as ApiCustomRequest);
      return await handleCustomRequest(req as ApiCustomRequest, res);
    } else {
      await validateStandardRequest(req as ApiStandardRequest);
      return await handleStandardRequest(req as ApiStandardRequest, res);
    }
  } catch (err) {
    handleError(err, res);
  }
};

export default requestHandler;
