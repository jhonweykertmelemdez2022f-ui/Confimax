import { create } from 'zustand';
import { salesAPI } from '../services/api';
import { useAuthStore } from './authStore';

export const useCartStore = create((set, get) => ({
  items: [],
  isCheckingOut: false,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const id = product._id || product.id;
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + quantity } : i
          )
        };
      }
      return {
        items: [...state.items, {
          id: id,
          name: product.name || 'Producto',
          price: Number(product.price || product.unitPrice || product.unit_price) || 0,
          quantity,
          image: product.image_url,
          category: product.category_id || product.category || 'General',
        }]
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    }));
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },

  checkout: async () => {
    const { items } = get();
    if (items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    set({ isCheckingOut: true });
    try {
      const user = useAuthStore.getState().user;
      
      const saleData = {
        customer_id: user?.id,
        items: items.map((item) => ({
          product_id: item.id,
          sku: item.id.substring(0, 8).toUpperCase(),
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price
        })),
        status: 'pending',
        notes: ''
      };

      if (user?.role === 'cliente' || user?.role === 'customer') {
        await salesAPI.createCustomerSale(saleData);
      } else {
        await salesAPI.createSale(saleData);
      }
      
      get().clearCart();
      return true;
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      throw error;
    } finally {
      set({ isCheckingOut: false });
    }
  },

  getTotalItems: () => get().items.reduce((sum, item) => sum + (item.quantity || 0), 0),
  getTotalPrice: () => get().items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0), 0),
}));
