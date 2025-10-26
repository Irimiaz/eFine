import { ApiCustomRequest, ApiStandardRequest } from "../types/ApiRequest";

function isCustomRequest(req: ApiStandardRequest | ApiCustomRequest): boolean {
  return req.body.api === "customRequest" && "entity" in req.body.payload;
}

export default isCustomRequest;
