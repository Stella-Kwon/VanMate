import 'fastify';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { MikroORM } from '@mikro-orm/core';
import type { RedisClientType } from 'redis'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { userId: string; email?: string; name?: string };
    }
}

//let fastify interprete orm and em
declare module 'fastify'{
    interface FastifyRequest{
        em: SqlEntityManager;
        user?: { userId: string; email: string; name?: string; [key: string]: any };
        redis: ReturnType<typeof createClient>
    }
    interface FastifyInstance {
        orm: MikroORM;
        authRedis:RedisClientType;
        googleOAuth: import('google-auth-library').OAuth2Client
        issueCsrfToken(userId: string): Promise<string>;
        verifyCsrfToken(userId: string, token?: string):Promise<{ok:boolean; reason?:string, newToken?:string}>
        verifyAccessToken(req: FastifyRequest, reply: FastifyReply): Promise<void>;
    }
}
export {};