import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Options } from '@mikro-orm/core';
import { env } from '@schema/env';

const config: Options = {
    driver: PostgreSqlDriver,
    clientUrl: env.DB_URL,
    driverOptions: {
        connection: {
            ssl: env.NODE_ENV === 'production' 
                ? { rejectUnauthorized: true } // 프로덕션: SSL 인증서 검증
                : { rejectUnauthorized: false } // 개발: SSL 인증서 검증 생략
        }
    },
    entities: ['./dist/entities'],
    entitiesTs: ['./src/entities'],
    migrations: {
        path: './migrations',
        pathTs: './migrations',
    },
};

export default config;
