import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const schema = z.object({
    NODE_ENV : z.string().default('develop'),
    PORT: z.string().default('3000'),
    HOST: z.string().regex(
    /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[a-fA-F0-9:]+))$/,
    "Has tobe IPv4 or IPv6 Format"),
    DB_URL: z.string().min(10, 'DB_URL is required'),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 chars'),
    ACCESS_SECRET: z.string().min(10, 'ACCESS_SECRET must be at least 10 chars'),
    REFRESH_SECRET:z.string().min(10,'REFRESH_SECRET must be at least 10 chars'),
    REDIS_URL: z.string().url().refine(
    (val) => val.startsWith("redis://") || val.startsWith("rediss://"),
    "REDIS_URL must start with 'redis://' or 'rediss://'"
    ),
    GOOGLE_WEB_CLIENT_ID: z.string().min(1, "GOOGLE_WEB_CLIENT_ID is required"),
    ACCESS_EXPIRED: z.coerce.number().positive(),
    REFRESH_EXPIRED: z.coerce.number().positive(),
    CORS_ORIGIN: z.string().optional().transform((val)=>{
        if(!val) return undefined;
        const urls = val.split(',').map(u=>u.trim());
        // 각 URL이 유효한지 확인
        const invalidUrls = urls.filter(url => {
            try {
                new URL(url);
                return false; // 유효한 URL이면 false (필터에서 제외)
            } catch {
                return true; // 유효하지 않은 URL이면 true (필터에 포함)
            }
        });
        if (invalidUrls.length > 0){
            throw new Error(`CORS_ORIGIN contains invalid URLs: ${invalidUrls.join(', ')}`);
        }
        return urls; // transform은 변환된 값을 반환
    }),
});

//runtime validate, return fail/success object
const parsed = schema.safeParse(process.env);

if (!parsed.success){
    console.error('Invalid env variables : \n', parsed.error.flatten().fieldErrors)
    process.exit(1);
}

export const env = parsed.data as Readonly<typeof parsed.data>;
export const getEnv = () => env;