import jwt from 'jsonwebtoken'
import {env} from '@schema/env'
import {User} from '@entities/User'
import type { RedisClientType } from 'redis'

const accessSecret = env.ACCESS_SECRET!;
const refreshSecret = env.REFRESH_SECRET!;
const ExpiredAccess = env.ACCESS_EXPIRED!;
const ExpiredRefresh = env.REFRESH_EXPIRED!;

export class JwtTokenService {
    constructor(private redis: RedisClientType) {};
    
    generateAccess(user: User){
        return jwt.sign(
            {
                userId:user.id,
                email:user.email,
                name:`${user.given_name} ${user.family_name}`,
            }, 
            accessSecret, 
            { expiresIn: ExpiredAccess })
    };

    async generateRefresh(user: User){
        const token = jwt.sign(
            {
                userId:user.id, 
            }, 
            refreshSecret, 
            {expiresIn: ExpiredRefresh});
        await this.redis.set(`refresh:${user.id}`, token, {EX: ExpiredRefresh});
        return token;
    };

    async verifyRefresh(token: string): Promise<{
        ok: boolean;
        reason?: string;
        newToken?: string;
        userId?: string;
    }> {
        try {
            // 1. JWT 디코딩하여 userId 추출
            const decoded = jwt.verify(token, refreshSecret) as { userId: string };
            const userId = decoded.userId;
            
            // 2. Redis에서 저장된 토큰 확인
            const stored = await this.redis.get(`refresh:${userId}`);
            if (!stored) {
                return { ok: false, reason: 'loggedOut' };
            }
            
            // 3. 토큰 일치 확인
            if (stored !== token) {
                // 토큰이 다르면 탈취 가능성 → 기존 토큰 삭제
                await this.redis.del(`refresh:${userId}`);
                // 새로운 토큰 생성 (보안 강화)
                const newToken = await this.generateRefresh({ id: userId } as User);
                return { ok: false, reason: 'False tampering', newToken, userId };
            }
            
            // 4. 모든 검증 통과
            return { ok: true, userId };
        } catch (err) {
            // JWT 검증 실패 (만료 또는 변조)
            // 만료된 토큰에서도 userId 추출하여 Redis에서 삭제
            const decoded = jwt.decode(token) as { userId: string } | null;
            if (decoded?.userId) {
                await this.redis.del(`refresh:${decoded.userId}`);
            }
            return { ok: false, reason: 'expired' };
        }
    };

    // async verifyRefresh(user: User, token:string){
    //     const stored = await this.redis.get(`refresh:${user.id}`)
    //     if (!stored)
    //     {
    //         return {ok: false, reason:`loggedOut`};
    //     }
    //     if (stored != token)
    //     {
    //         await this.redis.del(`refresh:${user.id}`)
    //         const newToken = await this.generateRefresh(user);
    //         if (!newToken)
    //             return {ok:false, reason:'Failed generating refresh token'};
    //         return {ok:false, reason: 'False tampering', newToken};
    //     }
    //     try{
    //         await jwt.verify(token, refreshSecret);
    //         return {ok:true}
    //     }catch{
    //         await this.redis.del(`refresh:${user.id}`)
    //         return {ok:false, reason:'expired'}; 
    //     }
    // };

    async delRefresh(userId:string){
        return this.redis.del(`refresh:${userId}`);
    };
}
