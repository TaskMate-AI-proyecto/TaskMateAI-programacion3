import { FastifyReply, FastifyRequest } from 'fastify';

type JwtUser = {
  id: string;
  email: string;
};

export function getUserId(request: FastifyRequest) {
  return (request.user as JwtUser).id;
}

export function failure(reply: FastifyReply, statusCode: number, message: string) {
  reply.status(statusCode);
  return { success: false, message };
}
