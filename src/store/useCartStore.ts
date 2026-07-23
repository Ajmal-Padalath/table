'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartExtra {
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique ID representing this unique combination of foodItem + variant + extras
  foodItemId: string;
  name: string;
  image: string | null;
  basePrice: number; // original price of item
  price: number; // total price of this single item including size & extras
  quantity: number;
  size?: string; // variant name
  spiceLevel?: string;
  extras: CartExtra[];
  notes?: string;
}

interface CartState {
  cartItems: CartItem[];
  tableNumber: string | null;
  customerName: string;
  customerPhone: string;
  sessionToken: string | null;
  
  // Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setTable: (tableNumber: string) => void;
  setCustomerInfo: (name: string, phone?: string) => void;
  initializeSession: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      tableNumber: null,
      customerName: '',
      customerPhone: '',
      sessionToken: null,

      addToCart: (newItem) => {
        const cartItems = get().cartItems;
        // Generate a composite key for uniqueness based on item ID, size, spice, and sorted extras
        const sortedExtras = [...newItem.extras].sort((a, b) => a.name.localeCompare(b.name));
        const extrasKey = sortedExtras.map((e) => e.name).join(',');
        const compositeId = `${newItem.foodItemId}-${newItem.size || ''}-${newItem.spiceLevel || ''}-${extrasKey}-${newItem.notes || ''}`;

        const existingIndex = cartItems.findIndex((item) => item.id === compositeId);

        if (existingIndex > -1) {
          const updatedItems = [...cartItems];
          updatedItems[existingIndex].quantity += newItem.quantity;
          set({ cartItems: updatedItems });
        } else {
          set({
            cartItems: [...cartItems, { ...newItem, id: compositeId }],
          });
        }
      },

      removeFromCart: (id) => {
        set({
          cartItems: get().cartItems.filter((item) => item.id !== id),
        });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }
        set({
          cartItems: get().cartItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ cartItems: [] });
      },

      setTable: (tableNumber) => {
        set({ tableNumber });
      },

      setCustomerInfo: (name, phone = '') => {
        set({ customerName: name, customerPhone: phone });
      },

      initializeSession: () => {
        let token = get().sessionToken;
        if (!token) {
          token = 'cust_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          set({ sessionToken: token });
        }
        return token;
      },
    }),
    {
      name: 'restaurant-cart-storage',
      // skip hydration issues by handling client-side state
    }
  )
);
