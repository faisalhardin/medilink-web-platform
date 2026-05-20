
export interface Product {
  id: number;
  name: string;
  price: number;
  is_item: boolean;
  is_treatment: boolean;
  quantity: number;
  unit_type: string;
}

export interface InsertProductRequest {
  name: string;
  price: number;
  is_item: boolean;
  is_treatment: boolean;
  quantity: number;
  unit_type: string;
}

export interface ListProductParams {
  ids?: number[];
  name?: string;
  idMstProduct?: number[];
  idMstProducts?: number[];
  idMstInstitution?: number;
  isItem?: boolean;
  isTreatment?: boolean;
  limit?: number;
  offset?: number;
  page?: number;
  fromTime?: string; // ISO date string format
  toTime?: string; // ISO date string format
}

// Add this new interface
export interface AssignedProductRequest {
  products: CheckoutProduct[];
}

// for snapshot product purchased
export interface CheckoutProduct {
  id: number;
  quantity: number;
  name: string
  unit_type: string;
  price: number;
  total_price: number;
  discount_rate?: number;
  discount_price?: number;
  adjusted_price?: number;
  is_item?: boolean;
  is_treatment?: boolean;
  marked_for_removal?: boolean;
}

export interface TrxVisitProduct {
  id: number;
  id_trx_institution_product: number;
  id_trx_patient_visit: number;
  id_dtl_patient_visit: number;
  name: string;
  quantity: number;
  unit_type: string;
  price: number;
  discount_rate: number;
  discount_price: number;
  total_price: number;
  adjusted_price: number;
  is_item: boolean;
  is_treatment: boolean;
}

export interface ProductPanelProps {
  product_id: number;
  name: string;
  orderedProduct?: TrxVisitProduct;
  cartProduct?: CheckoutProduct;
}

/** Panel row may omit `orderedProduct` (cart-only build); still match visit ordered lines by institution product id. */
export function resolveOrderedLine(
  product: ProductPanelProps,
  orderedProducts: TrxVisitProduct[]
): TrxVisitProduct | undefined {
  if (product.orderedProduct) {
    return product.orderedProduct;
  }
  const pid = Number(product.product_id);
  return orderedProducts.find((o) => Number(o.id_trx_institution_product) === pid);
}

/** Ordered line explicitly marked for removal in the cart UI. */
export function isMarkedForRemoval(
  cart: CheckoutProduct | undefined,
  orderedQty: number
): boolean {
  return orderedQty > 0 && Boolean(cart?.marked_for_removal);
}

/** Whether the cart differs from purchased qty (excludes sync-only qty-0 placeholders). */
export function hasCartPendingChange(
  cart: CheckoutProduct | undefined,
  orderedQty: number
): boolean {
  const cartQty = cart?.quantity ?? 0;
  if (orderedQty === 0) {
    return cartQty > 0;
  }
  if (isMarkedForRemoval(cart, orderedQty)) {
    return true;
  }
  // Merge adds ordered lines at qty 0 — not a user change until qty is edited above 0.
  if (cartQty === 0) {
    return false;
  }
  return cartQty !== orderedQty;
}

/** Strip client-only cart fields before API payloads. */
export function stripClientCartFields(product: CheckoutProduct): CheckoutProduct {
  const { marked_for_removal: _removed, ...rest } = product;
  return rest;
}

/** Snapshot ordered line as checkout shape (for PATCH carry-over). */
export function trxVisitProductToCheckoutLine(o: TrxVisitProduct): CheckoutProduct {
  return {
    id: Number(o.id_trx_institution_product),
    name: o.name,
    unit_type: o.unit_type,
    price: o.price,
    quantity: o.quantity,
    total_price: o.total_price,
    adjusted_price: o.adjusted_price,
    discount_rate: o.discount_rate,
    discount_price: o.discount_price,
    is_item: o.is_item,
    is_treatment: o.is_treatment,
  };
}

/**
 * PATCH /v1/visit/:id — `product_cart` must retain existing purchased lines.
 * Positive, non-removal cart lines win; any ordered line with qty > 0 not covered
 * (e.g. merge placeholder qty 0) is re-included from the visit snapshot so the backend does not drop it.
 */
export function cartProductsForVisitUpdate(
  cartProducts: CheckoutProduct[],
  orderedProducts: TrxVisitProduct[] = []
): CheckoutProduct[] {
  const byId = new Map<number, CheckoutProduct>();

  for (const p of cartProducts) {
    if (p.quantity > 0 && !p.marked_for_removal) {
      byId.set(Number(p.id), stripClientCartFields(p));
    }
  }

  for (const o of orderedProducts) {
    if (o.quantity <= 0) continue;
    const id = Number(o.id_trx_institution_product);
    if (byId.has(id)) continue;

    const cart = cartProducts.find((c) => Number(c.id) === id);
    if (cart?.marked_for_removal) continue;

    byId.set(id, stripClientCartFields(trxVisitProductToCheckoutLine(o)));
  }

  return Array.from(byId.values());
}

/** Build one order line from a panel row, or null if there is no pending change. */
export function panelToOrderLine(
  panel: ProductPanelProps,
  orderedProducts: TrxVisitProduct[] = []
): CheckoutProduct | null {
  const orderedLine = resolveOrderedLine(panel, orderedProducts);
  const orderedQty = orderedLine?.quantity ?? 0;
  const cart = panel.cartProduct;

  if (!hasCartPendingChange(cart, orderedQty)) {
    return null;
  }

  const price = cart?.price ?? orderedLine?.price ?? 0;
  const name = cart?.name ?? orderedLine?.name ?? panel.name ?? '';
  const unitType = cart?.unit_type ?? orderedLine?.unit_type ?? '';

  if (isMarkedForRemoval(cart, orderedQty)) {
    return stripClientCartFields({
      id: panel.product_id,
      name,
      unit_type: unitType,
      price,
      quantity: 0,
      total_price: 0,
      adjusted_price: 0,
      is_item: cart?.is_item ?? orderedLine?.is_item,
      is_treatment: cart?.is_treatment ?? orderedLine?.is_treatment,
      discount_rate: cart?.discount_rate ?? orderedLine?.discount_rate,
      discount_price: cart?.discount_price ?? orderedLine?.discount_price,
    });
  }

  if (!cart || cart.quantity <= 0) {
    return null;
  }

  return stripClientCartFields({
    ...cart,
    id: panel.product_id,
    name,
    unit_type: unitType,
    price,
    quantity: cart.quantity,
    adjusted_price: cart.adjusted_price ?? cart.quantity * price,
    total_price: cart.total_price ?? cart.quantity * price,
  });
}

/** POST /v1/visit/product — lines with real pending changes (not sync-only qty-0 placeholders). */
export function pendingProductsForOrder(
  panels: ProductPanelProps[],
  orderedProducts: TrxVisitProduct[] = []
): CheckoutProduct[] {
  return panels
    .map((p) => panelToOrderLine(p, orderedProducts))
    .filter((line): line is CheckoutProduct => line !== null);
}

/**
 * POST /v1/visit/product — same pending lines as {@link pendingProductsForOrder}, plus any
 * purchased line (`orderedProducts` qty > 0) not already present so the backend keeps
 * existing items when applying the order (mirrors {@link cartProductsForVisitUpdate}).
 * A pending line with `quantity === 0` for an existing purchase is treated as removal and is not overwritten.
 */
export function visitProductOrderPostPayload(
  panels: ProductPanelProps[],
  orderedProducts: TrxVisitProduct[] = []
): CheckoutProduct[] {
  const pending = pendingProductsForOrder(panels, orderedProducts);
  const byId = new Map<number, CheckoutProduct>();

  for (const line of pending) {
    byId.set(Number(line.id), line);
  }

  for (const o of orderedProducts) {
    if (o.quantity <= 0) continue;
    const id = Number(o.id_trx_institution_product);
    if (byId.has(id)) {
      const existing = byId.get(id)!;
      if (existing.quantity === 0) {
        // Pending removal for this purchased line — keep zero line.
        continue;
      }
      continue;
    }
    byId.set(id, stripClientCartFields(trxVisitProductToCheckoutLine(o)));
  }

  return Array.from(byId.values());
}

/** POST /v1/visit/product from a raw cart array (fallback when panel list is unavailable). */
export function cartProductsForOrder(products: CheckoutProduct[]): CheckoutProduct[] {
  return products
    .filter(
      (p) => p.quantity > 0 || (Boolean(p.marked_for_removal) && p.quantity === 0)
    )
    .map((p) => {
      const line = stripClientCartFields(p);
      if (p.quantity !== 0) {
        return line;
      }
      return {
        ...line,
        quantity: 0,
        adjusted_price: 0,
        total_price: 0,
      };
    });
}

export interface ProductOrderConfirmationProps {
  products: CheckoutProduct[];
  /** Used in checkout rows to show diffs vs purchased qty (e.g. removals). */
  orderedProducts?: TrxVisitProduct[];
  visitID: number;
  subTotal: number;
  onClose: () => void;
  updateSelectedProducts: (products: CheckoutProduct[]) => void;
  onMakeOrder: () => void;
  incrementQuantity: (id: number) => void;
  decrementQuantity: (id: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  setAdjustedPrice: (id: number, price: number) => void;
  deleteProduct: (id: number) => void;
}

// src/components/Checkout/types.ts
export interface CheckoutProductX {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export interface CartItem extends CheckoutProductX {
  quantity: number;
}

export interface ResupplyProductItem {
  product_id: number;
  quantity: number;
}

export interface ResupplyProductRequest {
  products: ResupplyProductItem[];
}