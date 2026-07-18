import { Router } from 'express';
import { db } from '../db.js';
import { idParamSchema } from '../schemas.js';
import { asyncRoute, notFound, params } from './helpers.js';

export const mediaRouter = Router();

mediaRouter.get(
  '/media/:id',
  asyncRoute(async (request, response) => {
    const { id } = params(idParamSchema, request);
    const media = await db.media.findUnique({ where: { id } });
    if (!media) return notFound(response);

    response.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: `"${media.hash}"`,
      'Content-Type': media.mime,
      'Content-Length': String(media.bytes.byteLength),
    });
    response.send(Buffer.from(media.bytes));
  }),
);
