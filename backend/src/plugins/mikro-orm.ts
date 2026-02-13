import fp from 'fastify-plugin';
import { MikroORM } from '@mikro-orm/core';
import type { SqlEntityManager } from '@mikro-orm/postgresql';
import config from '@data/db.config';
import {env} from '@schema/env';

export default fp(async (app) => {
    const orm = await MikroORM.init(config);

    if (env.NODE_ENV === 'develop') {
      // 🔹 개발 모드: 엔티티 코드와 DB 스키마 자동 동기화
        app.log.info('NODE_ENV is develop → updating schema...');
        const generator = orm.getSchemaGenerator();
        await generator.updateSchema();
        app.log.info('Database schema updated successfully');
    } else {
      // 🔹 운영(production) 모드: migration만 실행
        app.log.info('NODE_ENV is production → running migrations...');
        const migrator = orm.getMigrator();
        await migrator.up();
        app.log.info('All pending migrations executed successfully');
    }
    // register globally
    app.decorate('orm', orm);

    // fork entity manager for each request
    app.addHook('onRequest', async (req) => {
        req.em = orm.em.fork() as SqlEntityManager;
    });

    // close before server ends
    app.addHook('onClose', async () => {
        await orm.close(true);
    });
});
