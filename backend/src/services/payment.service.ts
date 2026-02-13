export async function handlePayment(userId: string, data: any) {
  // 실제 결제 처리 (PG사 API 호출 등)
  // 이 부분은 예시로 대체
  return {
    success: true,
    message: 'Payment confirmed',
    userId,
    orderId: data.orderId,
  }
}
