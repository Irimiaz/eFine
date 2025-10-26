import { Response } from "express";

export interface ApiResponse extends Response {
  json: (body: {
    status: "success" | "error";
    data?: any;
    message?: string;
    details?: string;
  }) => any;
}
