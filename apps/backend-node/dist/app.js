"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const env_1 = require("./config/env");
const prisma_1 = __importDefault(require("./lib/prisma"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const categories_1 = __importDefault(require("./routes/categories"));
const tasks_1 = __importDefault(require("./routes/tasks"));
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    await app.register(cors_1.default, { origin: [env_1.env.FRONTEND_URL] });
    await app.register(swagger_1.default, {
        openapi: {
            info: { title: 'TaskMate AI API', version: '1.0.0' },
            components: {
                securitySchemes: {
                    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                },
            },
        },
    });
    await app.register(jwt_1.default, { secret: env_1.env.JWT_SECRET });
    app.decorate('authenticate', async (request) => {
        await request.jwtVerify();
    });
    app.get('/health', async (request, reply) => {
        try {
            await prisma_1.default.$queryRaw `SELECT 1`;
            return { status: 'ok', timestamp: new Date().toISOString(), database: 'connected' };
        }
        catch (err) {
            app.log.error({ err }, 'Healthcheck database connection failed');
            reply.status(503);
            return { status: 'error', timestamp: new Date().toISOString(), database: 'unavailable' };
        }
    });
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
    app.register(ai_1.default);
    app.register(categories_1.default);
    app.register(tasks_1.default);
    await app.register(swagger_ui_1.default, { routePrefix: '/docs' });
    return app;
}
async function start() {
    const server = await buildApp();
    await server.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
}
if (require.main === module) {
    void start().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
