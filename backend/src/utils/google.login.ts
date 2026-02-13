import type { OAuth2Client } from 'google-auth-library'
import { env } from '@schema/env'

export const GoogleLoginUtils = {
    async verifyIdToken(client: OAuth2Client, idToken: string) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    return payload
    },

}