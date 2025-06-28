import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
    hasNext?: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: SuccessResponse['meta']
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: {
    statusCode?: number;
    code: string;
    message: string;
    details?: any;
  }
): Response => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
  
  return res.status(error.statusCode || 500).json(response);
};