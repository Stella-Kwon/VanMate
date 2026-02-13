import {MikroORM} from '@mikro-orm/core';
import config from '@data/db.config';

export const initORM = async()=>{
    const orm = await MikroORM.init(config);
    return orm;
}