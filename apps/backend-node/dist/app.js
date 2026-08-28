"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const env_1 = require("./config/env");
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    app.get('/health', async () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
    }));
    app.get('/', async () => ({
        service: 'TaskMate AI backend',
        status: 'ok',
    }));
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
