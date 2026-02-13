import type { SqlEntityManager } from '@mikro-orm/postgresql';
import {User} from '@entities/User';
import {RegisterUserInput, CreateUserInput } from '@schema/user.schema';
import { AuthError } from '@utils/errors';
import bcrypt from 'bcrypt';

export class UserService{
    constructor(private em: SqlEntityManager) {}

    async findOrCreateUser(data: CreateUserInput){
        let user = await this.em.findOne(User, {email : data.email});
        if(!user)
        {
            console.log('User not found, creating new user...');
            user = this.em.create(User, data);
            await this.em.persistAndFlush(user);
            console.log('User created:', user.id);
        } else {
            console.log('User found:', user.id);
        }
        return user;
    }

    async registerUser(data: RegisterUserInput){
        const existingUser = await this.em.findOne(User, {email: data.email});
        if (existingUser)
            throw new AuthError('Already existing user.');
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.em.create(User, {
            email: data.email,
            family_name:data.family_name,
            given_name:data.given_name,
            password:hashedPassword,
        });
        await this.em.persistAndFlush(user);
        return user;
    }

    async verifyPassword(user:User, password:string): Promise<boolean>{
        if(!user.password){
            return false;
        }
        return await bcrypt.compare(password, user.password);
    }

    async getOneByEmail(email: string) {
        const user = await this.em.findOne(User, { email: email });
        return user;
    }

    async getOneById(id: string) {
        const user = await this.em.findOne(User, { id });
        return user;
    }

    async getAllUsers(){
        return this.em.find(User,{})
    }
}