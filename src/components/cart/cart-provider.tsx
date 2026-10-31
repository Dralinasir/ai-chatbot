
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  size: string;
  cartKey: string;
};

type CartProduct = Omit<CartItem, "quantity" | "cartKey" | "size"> & {
  size?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: CartProduct) => void;
  updateQuantity: (cartKey: string, change: number) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "fashionai-cart-v1";

function createCartKey(id: number, size: string) {
  return `${id}:${size}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);

      if (savedCart) {
        const parsed: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          const migratedItems: CartItem[] = parsed.map((item) => {
            const size =
              typeof item.size === "string" && item.size.trim()
                ? item.size
                : "One Size";

            return {
              ...item,
              size,
              cartKey: createCartKey(Number(item.id), size),
            };
          });

          setItems(migratedItems);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addToCart = useCallback((product: CartProduct) => {
    const size = product.size?.trim() || "One Size";
    const cartKey = createCartKey(product.id, size);

    setItems((currentItems) => {
      const existing = currentItems.find(
        (item) => item.cartKey === cartKey
      );

      if (existing) {
        return currentItems.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          size,
          cartKey,
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback(
    (cartKey: string, change: number) => {
      setItems((currentItems) =>
        currentItems
          .map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + change }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
    },
    []
  );

  const removeItem = useCallback((cartKey: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.cartKey !== cartKey)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      cartCount,
      subtotal,
    }),
    [
      items,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      cartCount,
      subtotal,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
