"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const env_1 = require("./config/env");
const prisma_1 = __importDefault(require("./lib/prisma"));
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(jwt_1.default, { secret: env_1.env.JWT_SECRET });
    app.decorate('authenticate', async (request) => {
        await request.jwtVerify();
    });
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    }));
    app.get('/', async () => ({
        service: 'TaskMate AI backend',
        status: 'ok',
    }));
    app.get('/health/db', async (request, reply) => {
        try {
            // simple lightweight check
            await prisma_1.default.$queryRaw `SELECT 1`;
            return { db: 'ok' };
        }
        catch (err) {
            reply.status(500);
            return { db: 'error', error: String(err) };
        }
    });
    // register routes
    app.register(auth_1.default);
    app.register(categories_1.default);
    return app;
}
const server = buildApp();
void server.then((app) => {
    app.listen({ port: env_1.env.PORT, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        app.log.info(`Server listening on ${address}`);
    });
});
