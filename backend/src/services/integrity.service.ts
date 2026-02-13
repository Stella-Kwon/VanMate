//android
import jwt from 'jsonwebtoken';
import {authRedis} from '@plugins/redis'

export class IntegrityService{
    private cache: Record<string, string> | null = null;
    private lastFetch = 0;

    private async getGooglekeys() {
        const now = Date.now();
        if (this.cache && now - this.lastFetch < 1000 * 60 * 60) 
            return this.cache;
        const res = await fetch('https://www.googleapis.com/playintegrity/v1/publicKeys');
        const data = await res.json();
        this.cache = data.keys;
        this.lastFetch = now;
        return this.cache!;
    }

    async verify(integrityToken:string){
        const keys = await
    }
}   