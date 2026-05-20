// Modified ProductAssignmentPanel.tsx with improved search panel functionality
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { PatientVisit } from '@models/patient';
import { ListProducts } from '@requests/products';
import { Product, CheckoutProduct, TrxVisitProduct, ProductPanelProps, ProductOrderConfirmationProps } from '@models/product';
import { debounce } from 'lodash';
import { UpdatePatientVisit } from '@requests/patient';
import { convertProductToCheckoutProduct, formatPrice } from '@utils/common'
import { useDrawer } from 'hooks/useDrawer';
import { Drawer } from '@components/Drawer';
import CloseIcon from 'assets/icons/CloseIcon';
import { t } from 'i18next';
import { FolderLabels } from '@components/FolderLabels';

interface ProductAssignmentPanelProps {
  patientVisit: PatientVisit;
  journeyPointId: string;
  cartProducts: CheckoutProduct[];
  orderedProducts: TrxVisitProduct[];
  updateSelectedProducts: (products: CheckoutProduct[]) => void;
  onAssignProduct: (product: CheckoutProduct[], visitID: number) => void;
  updatedOrderedProduct: (product: TrxVisitProduct[]) => void;
}

type ProductPanelVariant = 'current' | 'pending' | 'checkout';

interface ProductQuantityPanelProps {
  name: string | undefined;
  unitType: string;
  cartQuantity: number;
  orderedQuantity: number;
  price: number;
  adjustedPrice: number;
  variant: ProductPanelVariant;
  embedded?: boolean;
  decrementQuantity: () => void;
  incrementQuantity: () => void;
  setQuantity: (quantity: number) => void;
  setAdjustedPrice: (adjustedPrice: number) => void;
  onRemove: () => void;
}

interface ProductSummaryCardsProps {
  currentTotalQty: number;
  currentTotalValue: number;
  netQtyChange: number;
  netValueChange: number;
}

const ProductSummaryCards = ({
  currentTotalQty,
  currentTotalValue,
  netQtyChange,
  netValueChange,
}: ProductSummaryCardsProps) => {
  const qtyChangeLabel =
    netQtyChange > 0 ? `+${netQtyChange}` : netQtyChange < 0 ? `${netQtyChange}` : '0';
  const valueChangeLabel =
    netValueChange > 0
      ? `+${formatPrice(netValueChange)}`
      : netValueChange < 0
        ? `-${formatPrice(Math.abs(netValueChange))}`
        : formatPrice(0);

  return (
    <div className="flex flex-wrap gap-1.5 text-[10px]">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md bg-gray-50 px-2 py-1">
        <span className="shrink-0 text-gray-500">{t('product.currentOrdersTotal')}</span>
        <span className="font-semibold text-gray-900">{formatPrice(currentTotalValue)}</span>
        <span className="text-gray-400">· {currentTotalQty}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md bg-blue-50 px-2 py-1">
        <span className="shrink-0 text-blue-600">{t('product.pendingChangesNet')}</span>
        <span className={`font-semibold ${netValueChange > 0 ? 'text-emerald-700' : netValueChange < 0 ? 'text-amber-700' : 'text-blue-900'}`}>{valueChangeLabel}</span>
        <span className="text-blue-600/70">· {qtyChangeLabel}</span>
      </div>
    </div>
  );
};

const ProductQuantityPanel = ({
  name,
  unitType,
  cartQuantity,
  adjustedPrice,
  orderedQuantity,
  variant,
  embedded = false,
  decrementQuantity,
  incrementQuantity,
  setQuantity,
  setAdjustedPrice,
  onRemove,
}: ProductQuantityPanelProps) => {
  const [priceDisplayValue, setPriceDisplayValue] = useState('');
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const isReadOnly = variant === 'current';
  const isNewProduct = variant === 'pending' && orderedQuantity === 0;
  const displayQuantity = isReadOnly ? orderedQuantity : cartQuantity;
  const quantityDiff = cartQuantity - orderedQuantity;
  const showPriceEdit = variant === 'checkout';

  // Parse formatted price back to number
  const parsePrice = (str: string): number => {
    return parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
  };

  // Update display value when adjusted price changes
  useEffect(() => {
    if (!isEditingPrice) {
      setPriceDisplayValue(formatPrice(adjustedPrice));
    }
  }, [adjustedPrice, isEditingPrice]);

  useEffect(() => {
    setPriceDisplayValue(formatPrice(adjustedPrice));
  }, [cartQuantity, isEditingPrice, adjustedPrice]);

  const handlePriceChange = (value: string) => {
    if (/^[\d,]*\.?\d*$/.test(value)) {
      setPriceDisplayValue(value);
      setAdjustedPrice(parsePrice(value));
    }
  };

  const handlePriceInputFocus = () => {
    setIsEditingPrice(true);
    setPriceDisplayValue(adjustedPrice.toString());
  };

  // Compact shared row shell for narrow side panel and drawer.
  const rowLayout = 'flex min-h-8 w-full min-w-0 items-start py-1.5 text-[11px]';
  const rowInnerLayout = 'flex w-full min-w-0 flex-col gap-1';
  const rowNameLayout = 'flex min-w-0 flex-wrap items-center gap-1';
  const rowActionsLayout = 'flex w-full items-center justify-between gap-1';

  // Row styling depends on variant + whether it sits inside an accordion group (embedded).
  const cardClass =
    embedded && variant === 'pending'
      ? // Intended-change row nested under purchased: no card chrome; parent provides border/bg.
      `${rowLayout} px-2`
      : embedded && variant === 'current'
        ? // Purchased summary inside accordion button: transparent, full width; button supplies hover/bg.
        `${rowLayout} w-full px-0`
        : variant === 'current'
          ? // Standalone purchased (read-only): white card = current order on record.
          `${rowLayout} rounded border border-gray-200 bg-white px-2`
          : variant === 'pending'
            ? // Standalone pending / new cart line: white card, blue left accent = editable change.
            `${rowLayout} rounded border border-gray-200 border-l-2 bg-white px-2`
            : // Checkout drawer line items.
            `${rowLayout} rounded border border-gray-200 bg-white px-2`;

  const handlePriceInputBlur = () => {
    setIsEditingPrice(false);
  };

  const showName = !(embedded && variant === 'pending');

  const quantityNearName = isReadOnly ? (
    <>
      <span className="shrink-0 text-gray-300" aria-hidden>
        ·
      </span>
      <span className="shrink-0 text-gray-600">{displayQuantity}</span>
    </>
  ) : null;

  const quantityNearPrice = !isReadOnly ? (
    <>
      <div className="flex h-6 shrink-0 items-stretch overflow-hidden rounded border border-gray-300 bg-white text-[11px] leading-none">
        <button
          type="button"
          className="flex items-center justify-center px-1 text-gray-600 hover:bg-gray-50"
          onClick={decrementQuantity}
        >
          −
        </button>
        <input
          id={name}
          className="h-full w-7 border-x border-gray-200 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          type="number"
          value={cartQuantity}
          onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
        />
        <button
          type="button"
          className="flex items-center justify-center px-1 text-gray-600 hover:bg-gray-50"
          onClick={incrementQuantity}
        >
          +
        </button>
      </div>
      {variant === 'pending' && orderedQuantity > 0 && quantityDiff !== 0 && (
        <span
          className={`shrink-0 font-semibold ${quantityDiff > 0 ? 'text-emerald-600' : 'text-amber-600'}`}
        >
          {quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff}
        </span>
      )}
    </>
  ) : null;

  const cardContent = (
    <div className={cardClass}>
      <div className={rowInnerLayout}>
        <div className={rowNameLayout}>
          {showName && (
            <span className="min-w-0 break-words text-[11px] font-medium leading-tight text-gray-900">{name}</span>
          )}
          {showName && unitType && <span className="shrink-0 text-[11px] text-gray-500">({unitType})</span>}
          {quantityNearName}
        </div>
        <div className={rowActionsLayout}>
          {quantityNearPrice}
          {showPriceEdit ? (
            <div className="flex items-center gap-1">
              <input
                className="h-6 w-16 rounded border border-gray-300 px-1 text-center text-[11px]"
                type="text"
                value={priceDisplayValue}
                onFocus={handlePriceInputFocus}
                onBlur={handlePriceInputBlur}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
            </div>
          ) : (
            <span className="font-medium text-gray-700 whitespace-nowrap text-[10px]">{formatPrice(adjustedPrice)}</span>
          )}
          {!isReadOnly && (
            <button
              type="button"
              onClick={onRemove}
              className="flex h-4 w-4 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Remove"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isNewProduct) return cardContent;

  return (
    <FolderLabels labels={[{ text: t('product.new'), color: 'violet' }]} className='py-0'>
      {cardContent}
    </FolderLabels>
  );
};

interface ProductGroupItemProps {
  product: ProductPanelProps;
  renderPanel: (
    product: ProductPanelProps,
    variant: ProductPanelVariant,
    embedded?: boolean
  ) => React.ReactNode;
}

function ProductGroupItem({ product, renderPanel }: ProductGroupItemProps) {
  const orderedQty = product.orderedProduct?.quantity ?? 0;
  const cartQty = product.cartProduct?.quantity ?? 0;
  const hasPurchased = orderedQty > 0;
  const hasPendingChange = cartQty !== orderedQty && cartQty >= 0;
  const quantityDiff = cartQty - orderedQty;

  const [expanded, setExpanded] = useState(false);

  if (!hasPurchased && !hasPendingChange) {
    return null;
  }

  return (
    <li className="overflow-hidden rounded-md">
      {hasPurchased && (
        <>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={t('product.expandToChangeQuantity')}
            onClick={() => setExpanded((open) => !open)}
            className="flex min-h-8 w-full items-center gap-1.5 border-b border-gray-100 bg-white px-2 py-0 text-left transition-colors hover:bg-gray-100/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <div className="min-w-0 flex-1">{renderPanel(product, 'current', true)}</div>
            <div className="flex shrink-0 items-center gap-1">
              {hasPendingChange && !expanded && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${quantityDiff > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}
                >
                  {quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff}
                </span>
              )}
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>
          {expanded && (
            <div className="border-t border-blue-100 bg-blue-50">
              {renderPanel(product, 'pending', true)}
            </div>
          )}
        </>
      )}
      {!hasPurchased && hasPendingChange && (
        <div className="bg-white">{renderPanel(product, 'pending', false)}</div>
      )}
    </li>
  );
}


export const ProductAssignmentPanel = ({
  patientVisit,
  cartProducts,
  orderedProducts,
  updateSelectedProducts,
  onAssignProduct,
}: ProductAssignmentPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const cartDrawer = useDrawer();

  const updateVisitCart = async (patientVisit: PatientVisit, productsCart: CheckoutProduct[]) => {
    await UpdatePatientVisit({
      id: patientVisit.id,
      product_cart: productsCart
    });
  };

  const debouncedUpdateCart = useCallback(
    debounce(async (patientVisit: PatientVisit, products: CheckoutProduct[]) => {
      updateVisitCart(patientVisit, products);
    }, 1000),
    []
  );

  const handleSearch = async (term: string) => {
    setSearchTerm(term);

    if (term.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await ListProducts({
        name: term,
        limit: 5
      });
      const results = response ? response as Product[] : [];
      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (product: Product) => {
    const updatedProducts = addProduct({ ...product, quantity: 1 });
    setSearchTerm(product.name);
    setShowResults(false);
    debouncedUpdateCart(patientVisit, updatedProducts);
  };

  useEffect(() => {
    // 1. Safe null/undefined handling
    const _cartProducts = cartProducts || [];
    const orderedProductsList = orderedProducts || [];

    // 2. Early return for empty data
    if (_cartProducts.length === 0 && orderedProductsList.length === 0) {
      updateSelectedProducts([]);
      return;
    }

    // 3. Create a comprehensive product list
    const cartProductIds = new Set(_cartProducts.map(p => p?.id).filter(Boolean));

    // 4. Find ordered products that aren't in cart
    const missingFromCart = orderedProductsList.filter(prod =>
      prod?.id_trx_institution_product &&
      !cartProductIds.has(prod.id_trx_institution_product)
    );

    // 5. Convert missing ordered products to cart format
    const missingProducts: CheckoutProduct[] = missingFromCart.map(prod => ({
      id: prod.id_trx_institution_product,
      name: prod.name || 'Unknown Product',
      price: prod.price || 0,
      quantity: 0, // Start with 0 for ordered products not in cart
      is_item: prod.is_item || false,
      is_treatment: prod.is_treatment || false,
      unit_type: prod.unit_type || '',
      adjusted_price: prod.adjusted_price || 0,
      total_price: prod.total_price || 0,
    })).filter(p => p.id); // Remove any products without valid IDs

    // 6. Combine cart products with missing ordered products
    const combinedProducts = [
      ..._cartProducts,
      ...missingProducts
    ];

    // 7. Remove duplicates based on ID
    const uniqueProducts = combinedProducts.reduce((acc, product) => {
      if (product?.id && !acc.some(p => p.id === product.id)) {
        acc.push(product);
      }
      return acc;
    }, [] as CheckoutProduct[]);

    // 8. Only update if there's actually a change
    updateSelectedProducts(uniqueProducts);

  }, [cartProducts, orderedProducts]);

  // Handle clicks outside of the search container
  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    // Add event listener when the dropdown is shown
    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  const addProduct = (product: Product): CheckoutProduct[] => {
    // Check if product already exists in the list
    const existingProductIndex = cartProducts.findIndex(p => p.id === product.id);
    if (existingProductIndex >= 0) {
      // Product exists, update its quantity
      const updatedProducts = [...cartProducts];
      const existingProduct = updatedProducts[existingProductIndex];
      updatedProducts[existingProductIndex] = {
        ...existingProduct,
        quantity: existingProduct.quantity > 0 ? (existingProduct.quantity || 1) + (product.quantity || 1) : 1,
      };
      updateSelectedProducts(updatedProducts);
      return updatedProducts;
    } else {
      // Product doesn't exist, add it to the list
      const updatedProducts = [...cartProducts, convertProductToCheckoutProduct(product)];
      updateSelectedProducts(updatedProducts);
      return updatedProducts;
    }
  };

  const productPanelList = useMemo(() => {
    const cartProduct = cartProducts.reduce((prev, prod) => {
      prev[prod.id] = prod;
      return prev;
    }, {} as { [key: number]: CheckoutProduct });
    const panelProps: ProductPanelProps[] = orderedProducts.map((prod) => {

      let _cartProduct = cartProduct && cartProduct[prod.id_trx_institution_product];
      if (_cartProduct) {
        delete cartProduct[prod.id_trx_institution_product];
      }

      return {
        product_id: prod.id_trx_institution_product,
        cartProduct: _cartProduct,
        orderedProduct: prod,
      } as ProductPanelProps;
    })
    const isEmpty = !cartProduct || Object.entries(cartProduct).length === 0;
    if (isEmpty) {
      return panelProps;
    }

    for (const key in cartProduct) {
      panelProps.push({
        product_id: cartProduct[key].id,

        name: cartProduct[key].name,
        cartProduct: cartProduct[key],
      })
    }

    return panelProps;
  }, [orderedProducts, cartProducts]);

  const productGroups = useMemo(() => {
    return productPanelList.filter((product) => {
      const orderedQty = product.orderedProduct?.quantity ?? 0;
      const cartQty = product.cartProduct?.quantity ?? 0;
      return orderedQty > 0 || (cartQty !== orderedQty && cartQty >= 0);
    });
  }, [productPanelList]);

  const hasPendingChanges = useMemo(
    () =>
      productGroups.some((product) => {
        const orderedQty = product.orderedProduct?.quantity ?? 0;
        const cartQty = product.cartProduct?.quantity ?? 0;
        return cartQty !== orderedQty && cartQty >= 0;
      }),
    [productGroups]
  );

  const summary = useMemo(() => {
    const currentTotalQty = orderedProducts.reduce(
      (acc, p) => acc + (p.quantity > 0 ? p.quantity : 0),
      0
    );
    const currentTotalValue = orderedProducts.reduce(
      (acc, p) =>
        acc +
        (p.quantity > 0 ? p.adjusted_price || p.total_price || p.price * p.quantity : 0),
      0
    );

    let netQtyChange = 0;
    let netValueChange = 0;

    productPanelList.forEach((p) => {
      const orderedQty = p.orderedProduct?.quantity ?? 0;
      const cartQty = p.cartProduct?.quantity ?? 0;
      const price = p.cartProduct?.price ?? p.orderedProduct?.price ?? 0;

      if (cartQty !== orderedQty) {
        netQtyChange += cartQty - orderedQty;
        const cartValue = p.cartProduct?.adjusted_price ?? cartQty * price;
        const orderedValue = p.orderedProduct?.adjusted_price ?? orderedQty * price;
        netValueChange += cartValue - orderedValue;
      }
    });

    return { currentTotalQty, currentTotalValue, netQtyChange, netValueChange };
  }, [orderedProducts, productPanelList]);

  const incrementQuantity = (id: number) => {
    const updatedProducts = cartProducts.map(p => {
      if (p.id === id) {
        const newQuantity = (p.quantity || 0) + 1;
        return {
          ...p,
          quantity: newQuantity,
          adjusted_price: newQuantity * p.price,
        };
      }
      return p;
    }
    );
    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);

  };

  const decrementQuantity = (id: number) => {
    const updatedProducts = cartProducts.map(p => {
      if (p.id === id && p.quantity) {
        const newQuantity = p.quantity - 1;
        return {
          ...p,
          quantity: newQuantity >= 0 ? newQuantity : 0,
          adjusted_price: (newQuantity >= 0 ? newQuantity : 0) * p.price
        };
      }
      return p;

    });
    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);
  };

  const setAdjustedPrice = (productID: number, adjustedPrice: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === productID ? { ...p, adjusted_price: adjustedPrice } : p
    );
    updateSelectedProducts(updatedProducts);
  }

  const setQuantity = (id: number, quantity: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id ? { ...p, quantity, adjusted_price: quantity * p.price } : p
    );

    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);

  };

  const deleteProduct = (id: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id ? { ...p, quantity: -1 } : p
    );

    // const updatededOrderedProducts = orderedProducts.filter(product => product.id_trx_institution_product !== id);
    // updatedOrderedProduct(updatededOrderedProducts)
    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);
  };


  const renderProductPanel = (
    product: ProductPanelProps,
    variant: ProductPanelVariant,
    embedded = false
  ) => {
    const orderedQty = product.orderedProduct?.quantity ?? 0;
    const cartQty = product.cartProduct?.quantity ?? 0;
    const price = product.cartProduct?.price ?? product.orderedProduct?.price ?? 0;
    const orderedValue =
      product.orderedProduct?.adjusted_price ??
      product.orderedProduct?.total_price ??
      orderedQty * price;
    const cartValue =
      product.cartProduct?.adjusted_price ??
      product.cartProduct?.total_price ??
      cartQty * price;

    return (
      <ProductQuantityPanel
        key={product.product_id}
        variant={variant}
        embedded={embedded}
        name={product.cartProduct?.name ?? product.orderedProduct?.name}
        unitType={product.cartProduct?.unit_type ?? product.orderedProduct?.unit_type ?? ''}
        cartQuantity={cartQty}
        orderedQuantity={orderedQty}
        price={price}
        adjustedPrice={variant === 'current' ? orderedValue : cartValue}
        setAdjustedPrice={(adjustedPrice: number) => {
          setAdjustedPrice(product.product_id, adjustedPrice);
        }}
        decrementQuantity={() => decrementQuantity(product.product_id)}
        incrementQuantity={() => incrementQuantity(product.product_id)}
        setQuantity={(quantity: number) => setQuantity(product.product_id, quantity)}
        onRemove={() => deleteProduct(product.product_id)}
      />
    );
  };

  return (
    <>
      <div className="w-full min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="space-y-2 border-b border-gray-100 px-3 py-2">
          <h3 className="text-sm font-semibold text-gray-800">{t('product.assignProduct')}</h3>
        </div>

        <div className="px-3 py-2">
          <div ref={searchContainerRef} className="relative">
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('product.searchProducts')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowResults(searchResults.length > 0)}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {t('product.searching')}
              </div>
            )}
            {showResults && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full list-none overflow-y-auto rounded-lg border border-gray-200 bg-white p-0 shadow-md">
                {searchResults.map((product) => (
                  <li
                    key={product.id}
                    className={`p-2 text-xs ${product.quantity && product.quantity > 0 ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}`}
                    onClick={() => product.quantity && product.quantity > 0 ? handleResultClick(product) : null}
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-600">
                      {t('product.stock')}: {product.quantity} {product.unit_type}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {hasPendingChanges && (
            <div className="mt-2">
              <button
                type="button"
                onClick={cartDrawer.openDrawer}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                {t('product.proceedToOrder')}
              </button>
            </div>
          )}
        </div>

        <section className="border-t border-gray-100">
          <div className="px-3 py-2">
            {productGroups.length === 0 ? (
              <p className="py-2 text-center text-xs text-gray-500">{t('product.noProducts')}</p>
            ) : (
              <ul className="space-y-1.5">
                {productGroups.map((product) => (
                  <ProductGroupItem
                    key={product.product_id}
                    product={product}
                    renderPanel={renderProductPanel}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <Drawer
        isOpen={cartDrawer.isOpen}
        onClose={cartDrawer.closeDrawer}
        title={t('product.productOrderConfirmation')}
        maxWidth="md"
        position="right"
      >
        <ProductOrderConfirmation
          products={cartProducts}
          visitID={patientVisit.id}
          onClose={cartDrawer.closeDrawer}
          subTotal={cartProducts.reduce(
            (acc, p) => acc + (p.quantity > 0 ? p.adjusted_price || p.total_price : 0),
            0
          )}
          setQuantity={setQuantity}
          decrementQuantity={decrementQuantity}
          incrementQuantity={incrementQuantity}
          setAdjustedPrice={setAdjustedPrice}
          updateSelectedProducts={updateSelectedProducts}
          onMakeOrder={() => {
            onAssignProduct(cartProducts, patientVisit.id);
            setSearchResults([]);
            cartDrawer.closeDrawer();
          }}
          deleteProduct={deleteProduct}
        />
      </Drawer>
    </>
  );
};

const ProductOrderConfirmation = ({
  products,
  subTotal,
  onMakeOrder,
  incrementQuantity,
  decrementQuantity,
  setQuantity,
  setAdjustedPrice,
  deleteProduct,
}: ProductOrderConfirmationProps) => {
  const checkoutProducts = products.filter((p) => p.quantity >= 0);

  return (
    <>
      <div className="px-3 py-3">
        <div className="flow-root">
          {checkoutProducts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-500">{t('product.cartEmpty')}</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {checkoutProducts.map((product) => (
                <li key={product.id}>
                  <ProductQuantityPanel
                    variant="checkout"
                    name={product.name}
                    unitType={product.unit_type}
                    cartQuantity={product.quantity}
                    orderedQuantity={product.quantity}
                    price={product.price}
                    adjustedPrice={product.adjusted_price ?? product.price * product.quantity}
                    setAdjustedPrice={(adjustedPrice: number) => {
                      setAdjustedPrice(product.id, adjustedPrice);
                    }}
                    decrementQuantity={() => decrementQuantity(product.id)}
                    incrementQuantity={() => incrementQuantity(product.id)}
                    setQuantity={(quantity: number) => setQuantity(product.id, quantity)}
                    onRemove={() => deleteProduct(product.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {checkoutProducts.length > 0 && (
        <div className="border-t border-gray-200 px-3 py-3">
          <div className="flex justify-between text-xs font-medium text-gray-900">
            <p>{t('product.subtotal')}</p>
            <p>{formatPrice(subTotal)}</p>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={onMakeOrder}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('product.checkout')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
