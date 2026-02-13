import {Entity, PrimaryKey, Property} from '@mikro-orm/core';
import {v4 as uuid} from 'uuid';

@Entity()
export class User{
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();
    
    @Property({ type: 'string' })
    email!: string;

    @Property({ type: 'string' })
    family_name!: string;

    @Property({ type: 'string' })
    given_name!: string;
    
    @Property({ type: 'string', nullable: true })
    googleId?: string;

    @Property({type: 'string', nullable: true})
    password?:string;

    @Property({ type: 'date', onCreate: () => new Date() })
    createAt?: Date;
}