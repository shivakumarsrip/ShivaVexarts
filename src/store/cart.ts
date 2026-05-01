import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  artworkId: number;
  title: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (artworkId: number, size: string) => void;
  updateQuantity: (artworkId: number, size: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const sizeMultipliers: Record<string, number> = {
  "A4 Print": 1.0,
  "A3 Print": 1.5,
  "A2 Print": 2.5,
  "Digital Download": 0.6,
};

export function calculatePrice(basePrice: number, size: string): number {
  const multiplier = sizeMultipliers[size] || 1.0;
  return Math.round(basePrice * multiplier);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.artworkId === item.artworkId && i.size === item.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.artworkId === item.artworkId && i.size === item.size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }] };
        }),

      removeItem: (artworkId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.artworkId === artworkId && i.size === size)
          ),
        })),

      updateQuantity: (artworkId, size, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.artworkId === artworkId && i.size === size)
                )
              : state.items.map((i) =>
                  i.artworkId === artworkId && i.size === size
                    ? { ...i, quantity }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getTotalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "vexarts-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
