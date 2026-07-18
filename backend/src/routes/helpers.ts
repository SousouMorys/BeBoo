import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

export function body<T>(schema: z.ZodType<T>, request: Request): T {
  return schema.parse(request.body);
}

export function params<T>(schema: z.ZodType<T>, request: Request): T {
  return schema.parse(request.params);
}

export function query<T>(schema: z.ZodType<T>, request: Request): T {
  return schema.parse(request.query);
}

export function notFound(response: Response): void {
  response.status(404).json({ error: 'Not found.' });
}

export function asyncRoute(
  handler: (request: Request, response: Response) => Promise<void>,
) {
  return (request: Request, response: Response, next: NextFunction): void => {
    void handler(request, response).catch(next);
  };
}
