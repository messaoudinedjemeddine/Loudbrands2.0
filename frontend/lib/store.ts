import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  size?: string
  sizeId?: string
}

export interface WishlistItem {
  id: string
  name: string
  nameAr?: string
  price: number
  oldPrice?: number
  image: string
  rating?: number
  isOnSale?: boolean
  stock: number
  slug: string
  addedDate: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (id: string, sizeId?: string) => void
  updateQuantity: (id: string, quantity: number, sizeId?: string) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

interface WishlistStore {
  items: WishlistItem[]
  addToWishlist: (item: Omit<WishlistItem, 'addedDate'>) => void
  removeFromWishlist: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
  getWishlistCount: () => number
}

interface AuthStore {
  user: any | null
  token: string | null
  hasHydrated: boolean
  setAuth: (user: any, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          (i) => i.id === item.id && i.sizeId === item.sizeId
        )

        if (existingItemIndex >= 0) {
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += item.quantity || 1
          set({ items: updatedItems })
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] })
        }
      },
      removeItem: (id, sizeId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.sizeId === sizeId)
          )
        }))
      },
      updateQuantity: (id, quantity, sizeId) => {
        if (quantity <= 0) {
          get().removeItem(id, sizeId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.sizeId === sizeId
              ? { ...item, quantity }
              : item
          )
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      }
    }),
    {
      name: 'cart-storage'
    }
  )
)

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (item) => {
        const { items } = get()
        const existingItem = items.find(i => i.id === item.id)

        if (!existingItem) {
          const newItem: WishlistItem = {
            ...item,
            addedDate: new Date().toISOString()
          }
          set({ items: [...items, newItem] })
        }
      },
      removeFromWishlist: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }))
      },
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (id) => {
        return get().items.some(item => item.id === id)
      },
      getWishlistCount: () => {
        return get().items.length
      }
    }),
    {
      name: 'wishlist-storage'
    }
  )
)

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => {
        const { token } = get()
        return !!token
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

interface UIStore {
  isCartOpen: boolean
  setCartOpen: (isOpen: boolean) => void
  toggleCart: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
}))