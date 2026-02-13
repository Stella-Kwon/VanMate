// import fp from 'fastify-plugin';
// // import Redis from 'ioredis'; => changes when you need higher version
// import {env} from '@schema/env';
// import { createClient,  type RedisClientType} from 'redis'


// export default fp(async (app) => {
//     const authRedis:RedisClientType = createClient({ url: env.REDIS_URL });
//     await authRedis.connect();

//     app.decorate('authRedis', authRedis);

//     app.addHook('onClose', async () => {
//         await authRedis.quit();
//     })
// })

import fp from 'fastify-plugin';
import {env} from '@schema/env';
import { createClient, type RedisClientType} from 'redis'

export default fp(async (app) => {
    const authRedis:RedisClientType = createClient({ 
        url: env.REDIS_URL,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    app.log.error('Redis reconnection failed after 10 retries');
                    return new Error('Redis connection failed');
                }
                return Math.min(retries * 50, 500); // 재연결 간격: 50ms, 100ms, ..., 최대 500ms
            }
        }
    });

    // 에러 핸들링
    authRedis.on('error', (err) => {
        app.log.error({ err }, 'Redis client error');
    });

    authRedis.on('connect', () => {
        app.log.info('Redis connected');
    });

    authRedis.on('reconnecting', () => {
        app.log.warn('Redis reconnecting...');
    });

    try {
        await authRedis.connect();
        app.log.info('Redis connection established');
    } catch (err) {
        app.log.error({ err }, 'Failed to connect to Redis');
        throw err;
    }

    app.decorate('authRedis', authRedis);

    app.addHook('onClose', async () => {
        await authRedis.quit();
    })
})
