# VanMate 🚗

**Real-time Messenger-based Vehicle Sharing & Reservation Platform**

## 📋 Project Goals

- ✅ **Real-time Messenger**: Live chat functionality
- 🔄 **Distance Calculation & Fare Statistics**: Distance-based fare calculation and statistical analysis
- 📅 **Reservation System**: Vehicle booking and management system

## 🚀 Current Implementation Status

### ✅ Completed Features

- **Authentication System (iOS/Web)**
  - Email/Password login
  - Google OAuth login (iOS, Web)
  - JWT-based token authentication with enterprise-grade security

### 🔄 Planned Features

- Real-time messenger
- Distance calculation & fare statistics
- Reservation system

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## 🔐 Security Architecture

VanMate implements **enterprise-grade security architecture** to protect user data and authentication information.

### 1. JWT Token-Based Authentication

#### Access Token & Refresh Token Separation

- **Access Token**: Short-lived (15 minutes)
  - Stored in client memory/local storage
  - Automatically refreshed using Refresh Token

- **Refresh Token**: Long-lived (7 days)
  - Stored in **httpOnly cookie** → Not accessible via JavaScript (XSS prevention)
  - Managed in Redis for server-side control
  - Can be immediately invalidated if compromised

### 2. XSS Prevention

#### httpOnly Cookie Implementation

```typescript
reply.setCookie('refresh_token', result.refreshToken, {
    httpOnly: true,        // ✅ JavaScript access blocked
    secure: true,          // ✅ HTTPS only (production)
    sameSite: 'lax',      // ✅ CSRF mitigation
})
```

**Key Security Features:**
- httpOnly prevents JavaScript access → Prevents token theft via XSS
- secure flag ensures HTTPS-only transmission
- sameSite limits cross-site cookie transmission

### 3. CSRF Protection

#### CSRF Token System

- Unique CSRF token issued per user (stored in Redis with 6-hour TTL)
- Required for all state-changing requests (POST/PUT/DELETE)
- Automatic invalidation and reissuance on mismatch
- Security logging on token tampering detection

```typescript
// Token verification with automatic reissuance
app.addHook('onRequest', async(req, reply) => {
    const result = await app.verifyCsrfToken(user.userId, token);
    if (!result.ok) {
        // Immediate invalidation + new token issuance
    }
})
```

### 4. Redis-Based Token Management

#### Advanced Token Security

- **Token Theft Detection**: Automatic invalidation when token mismatch detected
- **Reuse Prevention**: One-time use tokens stored in Redis
- **Immediate Logout**: Server-side token deletion on logout
- **Google OAuth Token Tracking**: ID tokens stored to prevent replay attacks

```typescript
// Token verification with theft detection
if (stored !== token) {
    await this.redis.del(`refresh:${userId}`);  // Immediate invalidation
    return { ok: false, reason: 'False tampering' };
}
```

### 5. Google OAuth Security

#### PKCE (Web) & ID Token Verification (Mobile)

**Web (PKCE):**
- codeVerifier + codeChallenge prevents authorization code interception attacks
- SHA256 hashing for challenge generation

**Mobile (iOS/Android):**
- Google public key verification of ID tokens
- Redis-based token reuse prevention
- Automatic expiration management

### 6. Password Security

- **bcrypt hashing** with 10 salt rounds
- One-way encryption (cannot be decrypted)
- Automatic salt generation prevents rainbow table attacks

### 7. Request Authentication

- JWT middleware validates all protected endpoints
- Access token required in `Authorization: Bearer <token>` header
- Automatic user context injection (`req.user`)

## 🛡️ Security Layer Summary

| Security Threat | Defense Mechanism | Status |
|---------|------------|--------|
| **XSS** | httpOnly cookies | ✅ Implemented |
| **CSRF** | CSRF token verification | ✅ Implemented |
| **Token Theft** | Redis-based invalidation | ✅ Implemented |
| **Password Leak** | bcrypt hashing | ✅ Implemented |
| **OAuth Attack** | PKCE + ID Token verification | ✅ Implemented |
| **Token Reuse** | Redis duplicate prevention | ✅ Implemented |
| **Unauthorized Access** | JWT middleware | ✅ Implemented |

## 🏗️ Project Structure

```
Junction_2025_High5/
├── backend/          # Fastify backend
│   ├── controllers/ # Request handlers
│   ├── services/    # Business logic & security
│   ├── plugins/     # JWT, CSRF, Redis plugins
│   └── entities/   # Database entities
│
└── client/          # Expo/React Native
    ├── app/         # Expo Router pages
    └── src/         # Hooks, services, utils
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Email/Password login
- `POST /api/auth/google/login` - Google OAuth login
- `POST /api/auth/refresh` - Refresh Access Token
- `POST /api/auth/logout` - Logout

### Users
- `POST /api/users/register` - User registration

---

**VanMate** - Secure Vehicle Sharing Platform 🚗✨

