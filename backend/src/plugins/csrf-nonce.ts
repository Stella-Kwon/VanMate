
//이부분 나중 결제할떄 다시 아무래도 프론트엔드랑 다같이
// import fp from 'fastify-plugin'
// import crypto from 'crypto'
// import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
// import type Redis from 'ioredis'

// interface CsrfNonceOptions {
//   ttl?: number       // 초 단위, 기본 60초
//   maxPrefetch?: number // 한번에 발급 가능한 최대 nonce 개수
// }

// export default fp(async (app: FastifyInstance, opts: CsrfNonceOptions = {}) => {
//   const TTL = opts.ttl ?? 60
//   const MAX_PREFETCH = opts.maxPrefetch ?? 5

//   const key = (userId: number | string, nonce: string) => `csrf:nonce:${userId}:${nonce}`

//   // 1️⃣ 단일 nonce 발급
//   app.decorate('issuePaymentNonce', async (userId: number) => {
//     const redis: Redis = app.redis
//     const nonce = crypto.randomBytes(24).toString('hex')
//     await redis.set(key(userId, nonce), '1', 'EX', TTL)
//     return { nonce, ttl: TTL }
//   })

//   // 2️⃣ 여러 nonce 미리 발급
//   app.decorate('issueMultiplePaymentNonces', async (userId: number, count = 3) => {
//     const redis: Redis = app.redis
//     const result: { nonce: string; ttl: number }[] = []
//     const limit = Math.min(count, MAX_PREFETCH)
//     for (let i = 0; i < limit; i++) {
//       const nonce = crypto.randomBytes(24).toString('hex')
//       await redis.set(key(userId, nonce), '1', 'EX', TTL)
//       result.push({ nonce, ttl: TTL })
//     }
//     return result
//   })

//   // 3️⃣ nonce 검증 및 소모
//   app.de
