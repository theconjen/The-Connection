import type { Request, Response } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development';

export function buildErrorResponse(message: string, error: unknown) {
  if (!isDevelopment) {
    return { message };
  }

  if (error instanceof Error) {
    return {
      message,
      details: {
        message: error.message,
        stack: error.stack,
      },
    };
  }

  return {
    message,
    details: {
      message: typeof error === 'string' ? error : JSON.stringify(error),
    },
  };
}

export function sendError(res: Response, status: number, message: string, error: unknown) {
  return res.status(status).json(buildErrorResponse(message, error));
}
