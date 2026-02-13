import {FastifyInstance} from 'fastify';
import {AuthController} from '@controllers/auth.controller';

export default function authRoutes(app: FastifyInstance){
    const controller = new AuthController(app);
    app.post('/google/login', async (req, reply) => {
        await controller.googleLogin(req, reply);
    });
    app.post('/login', async (req, reply) => {
        await controller.login(req, reply);
    });
    app.post('/refresh', async (req, reply) => {
        await controller.refresh(req, reply);
    });
    app.post('/logout', async (req, reply) => {
        await controller.logout(req, reply);
    });
}