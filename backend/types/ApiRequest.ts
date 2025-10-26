import { Request } from "express";

export interface CollectionParams {
  query: Record<string, any>;
  update?: Record<string, any>;
}

export interface ApiStandardRequest extends Request {
  body: {
    api:
      | "getDataFromCollection"
      | "setDataToCollection"
      | "deleteDataFromCollection";
    lang?: string;
    payload: {
      collection: string;
      params: CollectionParams;
    };
  };
}

export interface ApiCustomRequest extends Request {
  body: {
    api: string;
    lang?: string;
    payload: {
      entity: string;
      params: Record<string, any>;
    };
  };
}
