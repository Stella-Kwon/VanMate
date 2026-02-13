import {FastifyInstance} from 'fastify';
import { UserController } from '@controllers/user.controller';

export async function userRoutes(app: FastifyInstance){
    const controller = new UserController();
    app.post('/register', (req, reply) => { controller.registerUserHandler(req, reply)});
}
