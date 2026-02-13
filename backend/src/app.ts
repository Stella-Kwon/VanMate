import Fastify from 'fastify';
import { AppError } from '@utils/errors';
import jwtPlugin from '@plugins/jwt';
import redisPlugin from '@plugins/redis';
import googleOAuth from '@plugins/google-oauth'
import csrfToken from '@plugins/csrf';
import mikroOrmPlugin from '@plugins/mikro-orm';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import {userRoutes} from '@routes/user.route';
import authRoutes from '@routes/auth.route';
import { env } from '@schema/env';

export async function buildApp(){
    const app = Fastify({logger:true});
    app.register(fastifyCors, {
        origin: env.NODE_ENV === 'develop' 
            ? true // 개발: 모든 origin 허용
            : (env.CORS_ORIGIN || []), // 프로덕션: zod에서 이미 배열로 변환됨
        credentials: true, // 쿠키 전송 허용
    });
    app.register(jwtPlugin);
    app.register(redisPlugin);
    app.register(mikroOrmPlugin);
    app.register(csrfToken);
    app.register(googleOAuth);
    app.register(fastifyCookie);
    app.register(authRoutes, {prefix:'/api/auth'});
    app.register(userRoutes,{prefix:'/api/users'});

    app.setErrorHandler((error, req, reply) => {
        if(error instanceof AppError){
            return reply.status(error.statusCode).send({
                message:error.message,
                details:error.details,
            })
        }
        // 상세 로그 출력
        req.log.error({ err: error, stack: error.stack }, 'Unhandled error');
        
        // 개발 환경에서는 항상 에러 정보 포함
        const isDev = env.NODE_ENV === 'develop' || env.NODE_ENV === 'development';
        reply.status(500).send({
            message: "Internal Server Error",
            ...(isDev && { 
                error: error.message,
                stack: error.stack,
                name: error.name
            })
        })
    })
    return app;
}
