import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  slug: string
}

export interface AppliedCoupon {
  id: string
  code: string
  description: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumOrderAmount: number | null
  maximumDiscount: number | null
}

interface CartState {
  items: CartItem[]
  coupon: AppliedCoupon | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  applyCoupon: (coupon: AppliedCoupon) => void
  removeCoupon: () => void
  getDiscount: () => number
  getFinalTotal: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.productId === item.productId)

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }

          return { items: [...state.items, item] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => {
        set({ items: [], coupon: null })
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },

      applyCoupon: (coupon) => {
        set({ coupon })
      },

      removeCoupon: () => {
        set({ coupon: null })
      },

      getDiscount: () => {
        const { coupon, items } = get()
        if (!coupon) return 0

        const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

        // Check minimum order amount
        if (coupon.minimumOrderAmount && subtotal < coupon.minimumOrderAmount) {
          return 0
        }

        let discount = 0
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100
        } else {
          discount = coupon.discountValue
        }

        // Apply maximum discount cap if set
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount
        }

        // Discount cannot exceed subtotal
        return Math.min(discount, subtotal)
      },

      getFinalTotal: () => {
        const subtotal = get().getTotal()
        const discount = get().getDiscount()
        return subtotal - discount
      },
    }),
    {
      name: 'cave-express-cart',
    }
  )
)
