import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackEvent } from '@/utils/analytics';

export interface CartItem {
  id: string;
  inventory_id: string;
  display_name: string;
  price: number;
  quantity: number;
  maxQuantity?: number;
  image?: string;
  category: string;
  isFlashSale?: boolean;
  flashSaleExpiry?: string;
  selected_variation?: string | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  validatePrices: (supabase: any) => Promise<void>;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        // Track add to cart event
        trackEvent('add_to_cart', {
          product_id: item.id,
          product_name: item.display_name,
          price: item.price,
          quantity: item.quantity,
          category: item.category || 'unknown'
        });

        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          const itemMax = item.maxQuantity || existingItem.maxQuantity || 5;
          set({
            items: currentItems.map((i) =>
              i.id === item.id 
                ? { 
                    ...i, 
                    quantity: Math.min(itemMax, i.quantity + item.quantity), 
                    maxQuantity: itemMax,
                    isFlashSale: i.isFlashSale || item.isFlashSale,
                    flashSaleExpiry: i.flashSaleExpiry || item.flashSaleExpiry
                  } 
                : i
            ),
          });
        } else {
          const itemMax = item.maxQuantity || 5;
          const newItem = { ...item, quantity: Math.min(itemMax, item.quantity), maxQuantity: itemMax };
          set({ items: [...currentItems, newItem] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map((i) => {
              if (i.id === id) {
                const itemMax = i.maxQuantity || 5;
                return { ...i, quantity: Math.min(itemMax, quantity) };
              }
              return i;
            }),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      validatePrices: async (supabase: any) => {
        const currentItems = get().items;
        if (currentItems.length === 0) return;

        const productIds = currentItems.map(i => i.id);
        
        // Fetch all current products to get regular prices and variations
        const { data: products } = await supabase
          .from('ecommerce_products')
          .select('id, regular_price, special_price, variations, stock_quantity')
          .in('id', productIds);
          
        if (!products) return;

        // Fetch active flash sales for these products
        const now = new Date().toISOString();
        const { data: flashSales } = await supabase
          .from('store_flash_sales')
          .select('*')
          .in('product_id', productIds)
          .eq('is_active', true)
          .lt('start_time', now)
          .gt('end_time', now);

        const activeFlashSales = flashSales?.filter((fs: any) => fs.sold_qty < fs.total_stock) || [];

        const updatedItems = currentItems.map(item => {
          const product = products.find((p: any) => p.id === item.id);
          if (!product) return item; // product deleted? keep as is or remove. Let's keep for now.

          // Find if there is a variation matching the item
          // item.selected_variation is a string like "Color: Red"
          let basePrice = product.special_price || product.regular_price;
          let hasVariationPrice = false;
          
          if (product.variations && item.selected_variation) {
            const matchedVar = product.variations.find((v: any) => 
              `${v.name}: ${v.value}` === item.selected_variation
            );
            if (matchedVar) {
              basePrice = matchedVar.special_price || matchedVar.price;
              hasVariationPrice = true;
            }
          }

          const flashSale = activeFlashSales.find((fs: any) => 
            fs.product_id === item.id && 
            (!fs.variation_name || fs.variation_name === item.selected_variation)
          );
          
          let finalPrice = basePrice;
          let newMaxQuantity = Math.min(5, product.stock_quantity || 5);

          if (flashSale) {
             finalPrice = flashSale.flash_price;
             newMaxQuantity = Math.min(newMaxQuantity, flashSale.total_stock - flashSale.sold_qty);
          } else {
             // If it was a flash sale item but flash sale is no longer active, we should either revert price or remove.
             // The user requested to remove the product from cart if they cannot proceed.
             // So if it was marked as a flash sale but is no longer valid, we'll mark it for removal by setting price to -1 or similar.
             // Or better, we can filter them out below.
          }

          const clampedQuantity = Math.min(item.quantity, Math.max(1, newMaxQuantity));

          return { ...item, price: finalPrice, maxQuantity: newMaxQuantity, quantity: clampedQuantity };
        });

        // Filter out items that were flash sales but have expired
        const nowMs = Date.now();
        const validItems = updatedItems.filter(item => {
          if (item.isFlashSale && item.flashSaleExpiry) {
            const expiryTime = new Date(item.flashSaleExpiry).getTime();
            if (nowMs > expiryTime) {
              return false; // Remove expired flash sale item
            }
          }
          return true;
        });

        // Update state if prices or quantities changed, or items were removed
        const hasChanges = validItems.length !== currentItems.length || validItems.some((uItem, index) => 
          uItem.price !== currentItems[index].price || 
          uItem.quantity !== currentItems[index].quantity || 
          uItem.maxQuantity !== currentItems[index].maxQuantity
        );
        if (hasChanges) {
          set({ items: validItems });
        }
      },
    }),
    {
      name: 'ecommerce-cart',
    }
  )
);
