import { FastifyInstance } from 'fastify';
import { failure, getUserId } from '../lib/http';
import { getGamificationProfile } from '../services/gamification.service';

export default async function gamificationRoutes(app: FastifyInstance) {
  app.get('/api/gamification/profile', { preHandler: app.authenticate }, async (request, reply) => {
    const profile = await getGamificationProfile(getUserId(request));

    if (!profile) return failure(reply, 404, 'Usuario no encontrado');

    return profile;
  });
}
