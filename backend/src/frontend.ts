import axios from 'axios'

// ✅ Axios 기본 설정
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 쿠키 기반 인증일 경우
})

// 현재 저장된 CSRF 토큰
let csrfToken: string | null = null

// 요청 인터셉터 → 항상 최신 토큰을 헤더에 포함
api.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken
  }
  return config
})

// 응답 인터셉터 → 403 + 새 토큰 시 자동 갱신 후 재시도
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const res = error.response
    if (res?.status === 403 && res.data?.csrfToken) {
      // 서버가 새 토큰 줌 → 저장 후 재시도
      csrfToken = res.data.csrfToken
      const retryConfig = error.config
      retryConfig.headers['x-csrf-token'] = csrfToken
      return api.request(retryConfig)
    }
    throw error
  }
)

// 로그인 직후 수동 발급
export async function fetchCsrfToken() {
  const res = await api.get('/csrf')
  csrfToken = res.data.csrfToken
}

export default api




// 결제 직전 1회용 nonce 발급
const { nonce } = await fetch('/api/payment/nonce', {
  headers: { Authorization: `Bearer ${jwt}`, 'x-csrf-token': csrf },
}).then(r => r.json())

// 결제 요청
await fetch('/api/payment/confirm', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${jwt}`,
    'x-csrf-token': csrf,          // 전역 세션용
    'x-payment-nonce': nonce,      // 결제 전용 1회용
  },
  body: JSON.stringify({ orderId }),
})
