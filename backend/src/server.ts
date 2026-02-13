import { getEnv } from '@schema/env.js';
import { buildApp } from '@src/app';

async function start(){
    const app = await buildApp();
    const env = getEnv();
    try{
        await app.listen({port : Number(env.PORT), host : env.HOST})
        console.log(`Server listening on port ${env.PORT}`);
    }catch(err){
        app.log.error(err);
        process.exit(1);
    }
}

start();