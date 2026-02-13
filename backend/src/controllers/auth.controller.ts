import {AuthService} from '@services/auth.service';
import {JwtTokenService} from '@services/JwtToken.service';
import {FastifyRequest, FastifyReply, FastifyInstance} from 'fastify';
import {env} from '@schema/env';
import {AuthError} from '@utils/errors';
import {UserService} from '@services/user.service';
import jwt from 'jsonwebtoken';


export class AuthController{
    private tokenService : JwtTokenService;

    constructor(private app: FastifyInstance){
        this.tokenService = new JwtTokenService(app.authRedis);
    }
    async login(req:FastifyRequest, reply:FastifyReply){
        try {
            req.log.info('Login request received');
            const authService = new AuthService(this.app.authRedis, req.em);
            const {email, password} = req.body as {email: string, password: string};
            
            if (!email || !password) {
                throw new AuthError('Put Email and Password correctly');
            }
            
            req.log.info('Verifying email and password...');
            const result = await authService.login({email, password});
            req.log.info('Login successful');
            
            reply.setCookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/auth/refresh',
                maxAge: env.REFRESH_EXPIRED,
            })
            reply.send({
                accessToken: result.accessToken, 
                user: result.user
            })
        } catch (err) {
            if (err instanceof AuthError)
                throw err;
            req.log.error({ err }, 'Login error');
            throw new AuthError('Login failed', err);
        }
        
    }

    /**
     * Google 로그인 엔드포인트
     * POST /api/auth/login
     * Body: { idToken: string }
     * 
     * 앱/웹에서 Google ID Token을 받아서:
     * 1. ID Token 검증
     * 2. 사용자 생성/조회
     * 3. Access Token 및 Refresh Token 발급
     * 
     * Refresh Token은 쿠키에 저장 (httpOnly로 XSS 방지)
     * Access Token은 응답 body로 반환 (클라이언트가 저장)
     */
    async googleLogin(req:FastifyRequest, reply:FastifyReply){
        try {
            req.log.info('Login request received');
            const authService = new AuthService(this.app.authRedis, req.em)
            const {code, codeVerifier} = req.body as {code: string, codeVerifier: string}
            
            if (!code || !codeVerifier) {
                throw new AuthError('Authorization code and code verifier are required');
            }
            
            // Redirect URI는 클라이언트에서 받거나 환경변수에서 가져올 수 있음
            // 일단 클라이언트에서 전송하도록 하거나, 기본값 사용
            const redirectUri = (req.body as any).redirectUri || 'client://';
            
            req.log.info('Exchanging authorization code for ID token...');
            const result = await authService.googleLogin(this.app.googleOAuth, code, codeVerifier, redirectUri)
            req.log.info('Login successful');
            
            // Refresh Token을 쿠키에 저장 (httpOnly로 XSS 공격 방지)
            reply.setCookie('refresh_token', result.refreshToken, {
                httpOnly: true, // JavaScript에서 접근 불가 (XSS 방지)
                secure: env.NODE_ENV === 'production', // NODE_ENV가 'production'이면 true (HTTPS만), 아니면 false (HTTP도 허용)
                sameSite: 'lax', // 앱/웹 모두 지원 (strict는 크로스 사이트 요청에서 쿠키 전송 안됨)
                path: '/api/auth/refresh',
                maxAge: env.REFRESH_EXPIRED,
            })
            
            // Access Token과 User 정보를 응답 body로 반환
            // - Access Token: 클라이언트가 Authorization 헤더에 사용
            // - User 정보: 로그인 직후 사용자 정보를 바로 표시하기 위해 (토큰 디코딩 불필요)
            //   (Access Token에 이미 user 정보가 포함되어 있지만, 편의를 위해 함께 반환)
            reply.send({
                accessToken: result.accessToken, 
                user: result.user
            })
        } catch (err) {
            if (err instanceof AuthError)
                throw err;
            req.log.error({ err }, 'Login error');
            throw new AuthError('Login has failed', err);
        }
    };
    /**
     * Access Token 갱신 엔드포인트
     * POST /api/auth/refresh
     * 
     * Refresh Token을 사용해서 새로운 Access Token 발급
     * - 쿠키에서 refresh_token 읽기
     * - Refresh Token 검증 (토큰에서 userId 추출)
     * - 사용자 조회
     * - 새로운 Access Token 발급
     * 
     * 주의: 이 엔드포인트는 인증이 필요 없음 (jwt.ts에서 /api/auth 경로는 제외됨)
     * 하지만 Refresh Token 자체가 인증 수단이므로 안전함
     */
    async refresh(req:FastifyRequest, reply:FastifyReply){
        const userService = new UserService(req.em);
        const token = req.cookies['refresh_token'];
        
        if (!token) {
            throw new AuthError('Missing refresh token in cookies');
        }
        try
        {
            const result = await this.tokenService.verifyRefresh(token);
            if (result.newToken || result.ok) 
            {
                if (result.newToken)
                {
                    req.log.warn(result.reason);
                    reply.setCookie('refresh_token', result.newToken, {
                        httpOnly: true,
                        secure: env.NODE_ENV === 'production',
                        path: '/api/auth/refresh',
                        maxAge: env.REFRESH_EXPIRED,
                    })
                }
                 // 검증 성공 - userId로 사용자 조회 => auth에는 체크안해서 
                if (!result.userId) {
                    throw new AuthError("Invalid refresh token");
                }
                const user = await userService.getOneById(result.userId);
                if (!user) {
                    throw new AuthError("User not found");
                }
                const newAccessToken = this.tokenService.generateAccess(user);
                return reply.send({accessToken: newAccessToken});
            }    
            req.log.warn(result.reason);
            throw new AuthError("You need to login again");
        }catch (err) {
            if (err instanceof AuthError) {
                throw err;
            }
            req.log.error({ err }, 'Refresh verification failed');
            throw new AuthError('Failed in verifying refresh token');
        }
    }

    /**
     * 로그아웃 엔드포인트
     * POST /api/auth/logout
     * 
     * 현재 사용자의 Refresh Token을 삭제하여 로그아웃 처리
     * Access Token은 클라이언트에서 삭제해야 함
     * 
     * 주의: 이 엔드포인트는 인증이 필요 없음 (jwt.ts에서 /api/auth 경로는 제외됨)
     * Refresh Token에서 userId를 추출하여 로그아웃 처리
     */
    async logout(req: FastifyRequest, reply: FastifyReply) {
        const token = req.cookies['refresh_token'];
        
        if (!token) {
            // 토큰이 없으면 쿠키 삭제만 하고 성공 (이상한 상황이지만 사용자 경험상 성공 처리)
            reply.clearCookie('refresh_token', {
                path: '/api/auth/refresh',
            });
            return reply.send({ message: 'Logged out successfully' });
        }

        try {
            // 만료된 토큰이어도 삭제해야 하므로 verify 대신 decode 사용
            // req.user는 없으므로 (jwt 플러그인에서 /api/auth 제외) 토큰에서 직접 userId 추출
            const decoded = jwt.decode(token) as { userId: string } | null;
            
            if (decoded?.userId) {
                try {
                    const authService = new AuthService(this.app.authRedis, req.em);
                    await authService.logout(decoded.userId);
                } catch (redisErr) {
                    // Redis 삭제 실패는 로깅하지만 사용자에게는 성공으로 응답
                    // 쿠키는 삭제되므로 클라이언트는 토큰을 사용할 수 없음
                    req.log.error({ err: redisErr, userId: decoded.userId }, 'Failed to delete refresh token from Redis');
                }
            }
            
            // 쿠키에서 Refresh Token 삭제 (항상 성공)
            reply.clearCookie('refresh_token', {
                path: '/api/auth/refresh',
            });
            
            reply.send({ message: 'Logged out successfully' });
        } catch (err) {
            // 예상치 못한 에러 (jwt.decode 실패 등)
            req.log.error({ err }, 'Unexpected error during logout');
            // 에러가 나도 쿠키는 삭제 (사용자 경험)
            reply.clearCookie('refresh_token', {
                path: '/api/auth/refresh',
            });
            reply.send({ message: 'Logged out successfully' });
        }
    }
}   