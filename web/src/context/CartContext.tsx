"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  checkout: (customerId: string | undefined, paymentMethod: string) => Promise<void>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { user } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("confimax_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem("confimax_cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("confimax_cart");
  };

  const checkout = async (customerId?: string, paymentData?: { method: string; reference: string }) => {
    if (items.length === 0) {
      throw new Error("El carrito está vacío");
    }

    setIsCheckingOut(true);
    try {
      const saleData = {
        customerId,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: paymentData?.method || "cash",
        notes: paymentData && paymentData.method !== "cash" ? `Pago mediante: ${paymentData.method}. Ref: ${paymentData.reference}` : ""
      };

      let orderResponse;
      if (user?.role === "cliente") {
        orderResponse = await api.createCustomerSale(saleData);
      } else {
        orderResponse = await api.createSale(saleData);
      }
      
      const order = orderResponse; // Dependiendo de api.js, podría ser orderResponse.data o directamente el objeto

      // Si tenemos datos de pago y un ID de orden, registramos el pago
      if (paymentData && order && order.id) {
        try {
          await api.createPayment({
            order_id: order.id,
            payment_method: paymentData.method,
            amount: order.total || items.reduce((sum, item) => sum + item.price * item.quantity, 0),
            transaction_id: paymentData.reference,
            status: "pending"
          });
        } catch (paymentErr) {
          console.error("Error al registrar pago, pero la orden se creó:", paymentErr);
        }
      }

      clearCart();
      return order;
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isOpen,
        setIsOpen,
        checkout,
        isCheckingOut,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
