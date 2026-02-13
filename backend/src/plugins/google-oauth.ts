import fp from 'fastify-plugin'
import {OAuth2Client} from 'google-auth-library'
import {env} from '@schema/env';

export default fp (async (app) => {
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID)
    app.decorate('googleOAuth', client)
})