import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthError } from '@utils/errors';
import jwt from 'jsonwebtoken'
import {env} from '@schema/env'

//only accesstoken authentication will be handle as plugin
export default fp(async (app)=>{
    app.decorateRequest('user', null);
    app.decorate('verifyAccessToken', async (req:FastifyRequest, reply:FastifyReply)=>{
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            throw new AuthError("Missing access token in the headers");
        try{
            const decoded = jwt.verify(token, env.ACCESS_SECRET) as { userId: string; email: string; name?: string };
            req.user = { userId: decoded.userId, email: decoded.email, name: decoded.name };
        }catch{
            throw new AuthError("Invalid or expired access token");
        }
    });

    app.addHook('onRequest', async (req, reply)=>{
        if (req.url.startsWith('/api/auth')) return;
        if (req.url === '/api/users/register') return;
        await app.verifyAccessToken(req, reply);
    });
})