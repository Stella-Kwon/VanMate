import fp from 'fastify-plugin';
import crypto from 'crypto';
import { ForbiddenError } from '@utils/errors';

export default fp(async (app)=>{
    app.decorate('issueCsrfToken', async(userId:string)=>{
        const token = crypto.randomBytes(32).toString('hex')
        await app.authRedis.set(`csrf:${userId}`, token, {EX: 60 * 60 * 6})
        return token
    });
    app.decorate('verifyCsrfToken', async(userId:string, token?:string)=>{
        if (!token) return{ok:false, reason: 'missing'};
        const stored = await app.authRedis.get(`csrf:${userId}`);
        if (!stored)
        {
            //there was no issue yet or expired
            app.log.info({userId}, 'CSRF token expired or not issued — reissuing new one');
            const newToken = await app.issueCsrfToken(userId);
            return {ok:false, reason: 'expired', newToken};
        }
        if (stored === token)
            return ({ok: true})
        // there is a wrong csrfToken = account it as an attack
        await app.authRedis.del(`csrf:${userId}`);
        const newToken = await app.issueCsrfToken(userId);
        app.log.warn({userId},'Invalid CSRF token detected — possible tampering')
        return {ok:false, reason:'invalid', newToken};
    })

    app.addHook('onRequest', async(req, reply)=>{
        //excluding login or register for verifying action
        if(req.method === 'GET' || req.url.startsWith('/api/auth')) return
        const user =req.user
        const token = req.headers['x-csrf-token'] as string
        if (!user?.userId)
            return reply.code(401).send({message:'Unathorized'});
        const result = await app.verifyCsrfToken(user.userId, token);
        if (!result.ok) {
            const message =
                result.reason === 'expired'
                ? 'Expired CSRF token — new one issued'
                : result.reason === 'missing'
                ? 'Missing CSRF token'
                : 'Invalid CSRF token detected'
            throw new ForbiddenError(message, { csrfToken: result.newToken });
        }
    })
})