import { compare } from 'bcryptjs';
import { Router } from 'express';
import { db } from '../db.js';
import { pinVerifySchema } from '../schemas.js';
import { asyncRoute, body } from './helpers.js';

export const pinRouter = Router();

pinRouter.post(
  '/pin/verify',
  asyncRoute(async (request, response) => {
    const input = body(pinVerifySchema, request);
    const config = await db.appConfig.findUnique({ where: { id: 1 } });
    const verified = Boolean(config && (await compare(input.pin, config.pinHash)));

    response.json({ verified });
  }),
);
