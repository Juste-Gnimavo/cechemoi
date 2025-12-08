/**
 * Helper function to calculate discount amount based on coupon
 */
export function calculateCouponDiscount(
  coupon: {
    discountType: string
    discountValue: number
    minimumOrderAmount?: number | null
    maximumDiscount?: number | null
  },
  subtotal: number
): { discountAmount: number; error?: string } {
  // Check minimum order amount
  if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
    return {
      discountAmount: 0,
      error: `Montant minimum de commande: ${coupon.minimumOrderAmount} CFA`,
    }
  }

  let discountAmount = 0

  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * coupon.discountValue) / 100

    // Apply maximum discount cap if set
    if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
      discountAmount = coupon.maximumDiscount
    }
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, subtotal)
  }

  return { discountAmount: Math.round(discountAmount * 100) / 100 }
}
