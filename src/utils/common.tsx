import { CheckoutProduct, Product } from "@models/product";

/**
 * Generically merges two arrays of objects based on a common ID field
 * @param array1 First array of objects
 * @param array2 Second array of objects
 * @param idField The field to use as unique identifier
 * @param mergeFields Object mapping field names to merge functions
 * @returns A new array with merged objects
 */
export function mergeArrays<T extends Record<string, any>, K extends keyof T>(
    array1: T[],
    array2: T[],
    idField: K,
    mergeFields: Partial<Record<keyof T, (value1: any, value2: any) => any>> = {}
  ): T[] {
    // Create a map to store objects by id for faster lookup
    const objectMap = new Map<T[K], T>();
    
    // Process the first array
    array1.forEach(item => {
      objectMap.set(item[idField], { ...item });
    });
    
    // Process the second array
    array2.forEach(item => {
      const id = item[idField];
      
      if (objectMap.has(id)) {
        // If object with same id exists, merge specified fields
        const existingItem = objectMap.get(id)!;
        
        // Create a new object with merged fields
        const mergedItem = { ...existingItem };
        
        // Apply custom merge functions for specified fields
        Object.keys(item).forEach(key => {
          const fieldKey = key as keyof T;
          if (mergeFields[fieldKey]) {
            // Use custom merge function if provided
            mergedItem[fieldKey] = mergeFields[fieldKey]!(existingItem[fieldKey], item[fieldKey]);
          } else if (fieldKey !== idField) {
            // Default behavior: take value from second array
            mergedItem[fieldKey] = item[fieldKey];
          }
        });
        
        objectMap.set(id, mergedItem);
      } else {
        // If object doesn't exist in the map, add it
        objectMap.set(id, { ...item });
      }
    });
    
    // Convert the map values back to an array
    return Array.from(objectMap.values());
  }

export const convertProductToCheckoutProduct = (p: Product): CheckoutProduct => {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
    total_price: p.price * (p.quantity>=0 ? p.quantity:0),
    discount_rate: 0,
    discount_price: 0,
    adjusted_price: p.price * p.quantity,
    unit_type: p.unit_type,
    is_item: p.is_item,
    is_treatment: p.is_treatment,
  }
}
export const convertProductsToCheckoutProducts = (product: Product[]): CheckoutProduct[] => {
  return product.map(p => (convertProductToCheckoutProduct(p)));
}

export const formatPrice = (num: number, currency: string = "IDR"): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(num);
  };

export const formatDateTime = (date: Date): string => {
  // Use UTC format to avoid URL encoding issues with + symbol
  // This will produce: 2025-06-20T00:00:00.000Z
  return date.toISOString();
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
  });
}

// Helper function to format date
export const formatDateTimeHHmm = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
  });
};

// Alternative: If you still want timezone info but in a different format
export const formatDateTimeWithOffset = (date: Date): string => {
  // Format as: 2025-06-20T00:00:00.000+07:00
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in minutes and convert to HH:MM format
  const offset = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset <= 0 ? '+' : '-';
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
}

export const formatDateForAPI = (dateStr: string) => {
  if (!dateStr) return '';
  
  // If it's already in ISO format with timezone, return as is
  if (dateStr.includes('T') && (dateStr.includes('+') || dateStr.includes('Z'))) {
    return dateStr;
  }
  
  // If it's in YYYY-MM-DD format, convert to start of day with timezone offset
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    // Get timezone offset in minutes and convert to hours
    const timezoneOffset = -localDate.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    
    // Format as YYYY-MM-DDTHH:MM:SS+HH:MM
    const yearStr = localDate.getFullYear();
    const monthStr = String(localDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(localDate.getDate()).padStart(2, '0');
    const hoursStr = String(localDate.getHours()).padStart(2, '0');
    const minutesStr = String(localDate.getMinutes()).padStart(2, '0');
    const secondsStr = String(localDate.getSeconds()).padStart(2, '0');
    
    return `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:${secondsStr}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  };
  return dateStr;
};