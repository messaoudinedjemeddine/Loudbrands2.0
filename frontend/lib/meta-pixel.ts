declare global {
  interface Window {
    fbq: any;
  }
}

const getCategoryName = (category: any): string => {
  if (!category) return '';
  if (typeof category === 'object') {
    return category.name || '';
  }
  return String(category);
};

// Retry helper for Meta Pixel events
const fireWithRetry = (eventName: string, payload: any, maxRetries = 10, delay = 500) => {
  if (typeof window === 'undefined') return;

  let retries = 0;
  const tryTracking = (): boolean => {
    const win = window as any;
    if (win.fbq && typeof win.fbq === 'function' && win.fbq.loaded) {
      try {
        win.fbq('track', eventName, payload);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Meta Pixel: ${eventName} event tracked successfully`, payload);
        }
        return true;
      } catch (error) {
        console.error(`❌ Meta Pixel: Error tracking ${eventName} event`, error);
        return true; // Stop retrying on runtime error
      }
    }
    return false;
  };

  if (!tryTracking()) {
    const interval = setInterval(() => {
      retries++;
      if (tryTracking() || retries >= maxRetries) {
        clearInterval(interval);
        if (retries >= maxRetries && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Meta Pixel: ${eventName} could not be tracked (Pixel not loaded)`);
        }
      }
    }, delay);
  }
};

export const trackViewContent = (product: any) => {
  if (!product) return;
  const categoryName = getCategoryName(product.category);
  fireWithRetry('ViewContent', {
    content_ids: [String(product.id || '')],
    content_type: 'product',
    value: parseFloat(String(product.price || 0)),
    currency: 'DZD',
    contents: [{
      id: String(product.id || ''),
      quantity: 1,
      item_price: parseFloat(String(product.price || 0))
    }],
    content_name: product.name || '',
    content_category: categoryName
  });
};

export const trackAddToCart = (product: any, quantity: number = 1, size?: string | null) => {
  if (!product) return;
  const categoryName = getCategoryName(product.category);
  fireWithRetry('AddToCart', {
    content_ids: [String(product.id || '')],
    content_type: 'product',
    value: parseFloat(String(product.price || 0)) * quantity,
    currency: 'DZD',
    contents: [{
      id: String(product.id || ''),
      quantity: quantity,
      item_price: parseFloat(String(product.price || 0)),
      ...(size ? { item_variant: size } : {})
    }],
    content_name: product.name || '',
    content_category: categoryName
  });
};

export const trackInitiateCheckout = (product: any, quantity: number = 1, size?: string | null) => {
  if (!product) return;
  const categoryName = getCategoryName(product.category);
  fireWithRetry('InitiateCheckout', {
    content_ids: [String(product.id || '')],
    content_type: 'product',
    value: parseFloat(String(product.price || 0)) * quantity,
    currency: 'DZD',
    contents: [{
      id: String(product.id || ''),
      quantity: quantity,
      item_price: parseFloat(String(product.price || 0)),
      ...(size ? { item_variant: size } : {})
    }],
    num_items: quantity,
    content_name: product.name || '',
    content_category: categoryName
  });
};

export const trackPurchase = (orderNumber: string, total: number, items: any[]) => {
  if (!items || !Array.isArray(items)) return;
  const contentIds = items.map((item: any) => String(item.id || item.productId || ''));
  const contents = items.map((item: any) => ({
    id: String(item.id || item.productId || ''),
    quantity: parseInt(String(item.quantity || 1)),
    item_price: parseFloat(String(item.price || 0)),
    ...(item.size ? { item_variant: item.size } : {})
  }));
  
  const numItems = items.reduce((sum: number, item: any) => sum + parseInt(String(item.quantity || 1)), 0);

  fireWithRetry('Purchase', {
    content_ids: contentIds,
    content_type: 'product',
    value: parseFloat(String(total || 0)),
    currency: 'DZD',
    num_items: numItems,
    order_id: String(orderNumber),
    contents: contents
  });
};
