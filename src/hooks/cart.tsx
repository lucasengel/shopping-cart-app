import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts([...JSON.parse(storedProducts)]);
      } else {
        setProducts([]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const existingProd = products.find(({ id }) => id === product.id);

      if (existingProd) return increment(product.id);

      const newProdList = [...products, { ...product, quantity: 1 }];

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProdList),
      );

      return setProducts(newProdList);
    },
    [increment, products],
  );

  const increment = useCallback(
    async id => {
      const newProdList = products.map(prod => {
        if (prod.id === id) {
          const newQuantity = prod.quantity + 1;
          return { ...prod, quantity: newQuantity };
        }

        return prod;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProdList),
      );

      setProducts(newProdList);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProdList = products.reduce((acc: Product[], prod) => {
        if (prod.id === id && prod.quantity > 1) {
          const newQuantity = prod.quantity - 1;
          return [...acc, { ...prod, quantity: newQuantity }];
        }

        if (prod.id === id && prod.quantity === 1) {
          return acc;
        }

        return [...acc, prod];
      }, []);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProdList),
      );

      setProducts(newProdList);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
