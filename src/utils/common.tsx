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