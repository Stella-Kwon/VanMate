import { JwtTokenService } from '@services/JwtToken.service';
import { GoogleLoginUtils } from '@utils/google.login';
import { UserService } from '@services/user.service';
import type { RedisClientType } from 'redis';
import type { SqlEntityManager } from '@mikro-orm/postgresql';
import type { OAuth2Client } from 'google-auth-library'
import { AuthError, AppError } from '@utils/errors';
import { LoginUserInput } from '@schema/user.schema';

export class AuthService{
    private tokenService: JwtTokenService
    private userService: UserService

    constructor(
        private readonly authRedis: RedisClientType,
        private readonly em: SqlEntityManager
    ) {
        this.tokenService = new JwtTokenService(authRedis)
        this.userService = new UserService(em)
    }
    async login(data: LoginUserInput){
        try {
            const user = await this.userService.getOneByEmail(data.email);
            if(!user) {
                throw new AuthError('Given email is wrong');
            }
            const isPasswordValid = await this.userService.verifyPassword(user, data.password);
            if(!isPasswordValid) {
                throw new AuthError('This account was created with Google login. Please use Google login to sign in.');
            }
            console.log('Generating tokens...');
            const accessToken = this.tokenService.generateAccess(user)
            const refreshToken = await this.tokenService.generateRefresh(user)
            
            console.log('Login completed successfully');
            return {
                accessToken, 
                refreshToken, 
                user:{
                    userId: user.id,
                    email: user.email,
                    name: `${user.given_name} ${user.family_name}`
                }
            }
        } catch (err) {
            if (err instanceof AuthError)
                throw err;
            throw new AppError('Login failed', 500);
        }
    }

    async googleLogin(client: OAuth2Client, idToken: string){
        try {
            console.log('Starting Google ID Token verification...');
            const payload = await GoogleLoginUtils.verifyIdToken(client, idToken);
            console.log('Google ID Token verified');
            
            if (!payload || !payload.email)
                throw new AuthError('Invalid Google ID token')
            
            const tokenId = (payload as any).jti || idToken;
            console.log('Checking Redis for used token...');
            
            const used = await this.authRedis.get(`idtoken:${tokenId}`);
            
            if (used) {
                throw new AuthError('ID Token already used. Please login again.');
            }
            
            const exp = payload.exp;
            const now = Math.floor(Date.now() / 1000);
            const ttl = exp ? Math.max(exp - now, 0) : 3600;
            
            console.log('Saving ID Token to Redis...');
            await this.authRedis.set(`idtoken:${tokenId}`, '1', { EX: ttl });
            
            console.log('Finding or creating user...');
            console.log(payload);
            const user = await this.userService.findOrCreateUser({
                email:payload.email!,
                family_name:payload.family_name ?? '',
                given_name:payload.given_name ?? '',
                googleId:payload.sub,
            });

            if(!user)
                throw new AuthError('Failed to create or find user');
            
            console.log('Generating tokens...');
            const accessToken = this.tokenService.generateAccess(user)
            const refreshToken = await this.tokenService.generateRefresh(user)
            
            console.log('Login completed successfully');
            return {
                accessToken, 
                refreshToken, 
                user:{
                    userId: user.id,
                    email: user.email,
                    name: `${user.given_name} ${user.family_name}`
                }
            }
        } catch (err) {
            if (err instanceof AuthError)
                throw err;
            throw new AppError('Token generation failed', 500);
        }
    };

    async logout(userId: string) {
        await this.tokenService.delRefresh(userId);    
    }
}