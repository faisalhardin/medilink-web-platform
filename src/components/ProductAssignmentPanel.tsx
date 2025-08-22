// Modified ProductAssignmentPanel.tsx with improved search panel functionality
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { PatientVisit, PatientVisitDetail } from '@models/patient';
import { ListProducts } from '@requests/products';
import { Product, AssignedProductRequest, CheckoutProduct, TrxVisitProduct, ProductPanelProps, ProductOrderConfirmationProps } from '@models/product';
import { debounce } from 'lodash';
import { UpdatePatientVisit } from '@requests/patient';
import { convertProductToCheckoutProduct} from '@utils/common'
import { useDrawer } from 'hooks/useDrawer';
import { Drawer } from '@components/Drawer';

interface ProductAssignmentPanelProps {
  patientVisit: PatientVisit;
  journeyPointId: number;
  cartProducts: CheckoutProduct[];
  orderedProducts: TrxVisitProduct[];
  updateSelectedProducts: (products: CheckoutProduct[]) => void;
  onAssignProduct: (product: CheckoutProduct[], visitID: number) => void;
}

interface ProductListProps {
  name: string | undefined;
  unitType: string;
  cartQuantity: number;
  orderedQuantity: number;
  price: number;
  adjustedPrice: number;
  decrementQuantity: () => void;
  incrementQuantity: () => void;
  setQuantity: (id: number) => void;
  setAdjustedPrice: (adjustedPrice: number) => void;
}

const ProductQuantityPanel = ({ name, unitType, cartQuantity, price, adjustedPrice, orderedQuantity, decrementQuantity, incrementQuantity, setQuantity, setAdjustedPrice }: ProductListProps) => {
  
  const quantityDiff = cartQuantity - orderedQuantity;
    
    const handlePriceChange = (newPrice: number) => {
    setAdjustedPrice(newPrice);
  };

  const handlePriceInputBlur = () => {
    setAdjustedPrice(adjustedPrice);
  };

  return (
    <div className="border rounded p-1 mb-2 text-sm">
      <div className="font-medium">{name} <span className='text-xs font-extralight'>({unitType})</span></div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center border rounded text-xs">
          <button className="px-1.5 py-0.5" onClick={decrementQuantity}>-</button>
          <input
            id={name}
            className="px-1 py-0.5 border-l border-r w-6 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            value={cartQuantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
          <button className="px-1.5 py-0.5" onClick={incrementQuantity}>+</button>
        </div>
        {quantityDiff !== 0 && (
          <span className={quantityDiff > 0 ? "positive-quantity" : "negative-quantity"}>
            {quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff}
          </span>
        )}
      </div>
      
      {/* Price Box */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-600">Price:</span>
        <div className="flex items-center border rounded">
          <input
            className="px-2 py-0.5 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            step="0.01"
            id='price'
            placeholder={(price * cartQuantity).toString()}
            value={adjustedPrice}
            onBlur={handlePriceInputBlur}
            onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};


export const ProductAssignmentPanel = ({
  patientVisit,
  cartProducts,
  orderedProducts,
  journeyPointId,
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
      const resp = await UpdatePatientVisit({
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
    // setSelectedProduct(product);
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
  const missingProducts:CheckoutProduct[] = missingFromCart.map(prod => ({
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
        quantity: (existingProduct.quantity || 1) + (product.quantity || 1)
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

  let productPanelList = useMemo(() => {
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

    return panelProps
  }, [orderedProducts, cartProducts])

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
      p.id === productID  ? { ...p, adjusted_price: adjustedPrice } : p
    );
    console.log("after update",updatedProducts)
    updateSelectedProducts(updatedProducts);
  }

  const setQuantity = (id: number, quantity: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id ? { ...p, quantity: quantity,  adjusted_price: p.quantity * p.price } : p
    );

    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);

  };

  const deleteProduct = (id: number) => {
    const newProductList = cartProducts.filter(product => product.id !== id);
    updateSelectedProducts(newProductList);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Assign Products</h3>

        {/* Search and assign section with improved search panel */}
        <div className="mb-4">
          <div ref={searchContainerRef} className="relative mb-2">
            <input
              type="text"
              className="w-full border rounded px-2 py-1"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setShowResults(searchResults.length > 0)}
            />

            {isSearching && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                Searching...
              </div>
            )}

            {showResults && (
              <ul className="absolute w-full max-h-40 overflow-y-auto mt-0 p-0 list-none border border-gray-300 rounded-b-md bg-white z-10 shadow-md">
                {searchResults.map(product => (
                  <li
                    key={product.id}
                    className={`p-2 ${product.quantity && product.quantity > 0 ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-50'}`}
                    onClick={() => product.quantity && product.quantity > 0 ? handleResultClick(product) : null}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      Stock: {product.quantity} {product.unit_type}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ul>
            {
              productPanelList.map((product) => (
                <li key={product.product_id}>
                  <ProductQuantityPanel
                    key={product.product_id}
                    name={product.cartProduct?.name ?? product.orderedProduct?.name}
                    unitType={product.cartProduct?.unit_type ?? product.orderedProduct?.unit_type ?? ''}
                    cartQuantity={product.cartProduct?.quantity ?? 0}
                    orderedQuantity={product.orderedProduct?.quantity ?? 0}
                    price={product.cartProduct?.price ?? product.orderedProduct?.price ?? 0}
                    adjustedPrice={product.cartProduct?.adjusted_price ?? product.orderedProduct?.adjusted_price ?? 0}
                    setAdjustedPrice={(adjustedPrice: number) => {
                      setAdjustedPrice(product.product_id, adjustedPrice);
                    }}
                    decrementQuantity={() => { decrementQuantity(product.product_id) }}
                    incrementQuantity={() => { incrementQuantity(product.product_id) }}
                    setQuantity={(quantity: number) => {
                      setQuantity(product.product_id, quantity);
                    }}

                  />
                </li>


              ))}
          </ul>

          <button
            onClick={cartDrawer.openDrawer}
          > Order</button>
        </div>
      </div>
      <Drawer
        isOpen={cartDrawer.isOpen}
        onClose={cartDrawer.closeDrawer}
        title="Product Order Confirmation"
        maxWidth="md"
        position="right"
      >
        <ProductOrderConfirmation
          products={cartProducts}
          visitID={patientVisit.id}
          onClose={cartDrawer.closeDrawer}
          subTotal={(cartProducts.reduce((acc, p) => acc + (p.adjusted_price || p.total_price), 0))}
          setQuantity={setQuantity}
          decrementQuantity={decrementQuantity}
          incrementQuantity={incrementQuantity}
          setAdjustedPrice={setAdjustedPrice}
          onRemoveItem={() => { }}
          updateSelectedProducts={updateSelectedProducts}
          onMakeOrder={() => { }}
        />
      </Drawer>
    </>
    
    
  );
};

const ProductOrderConfirmation = ({
  visitID,
  products,
  subTotal,
  onRemoveItem,
  onClose,
  updateSelectedProducts,
  onMakeOrder,
  incrementQuantity,
  decrementQuantity,
  setQuantity,
  setAdjustedPrice,
}: ProductOrderConfirmationProps) => {



  return (
    <>
      {/* Items List */}
      <div className="px-4 py-6 sm:px-6">
        <div className="flow-root">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <ul role="list" className="-my-6 divide-y divide-gray-200">
              {products.map((product) => (
                <li key={product.id}>
                    <ProductQuantityPanel
                    key={product.id}
                    name={product.name}
                    unitType={product.unit_type}
                    cartQuantity={product.quantity}
                    orderedQuantity={product.quantity}
                    price={product.price}
                    adjustedPrice={product.adjusted_price ?? (product.price * product.quantity)}
                    setAdjustedPrice={(adjustedPrice: number)=>{
                      console.log("adjustedPrice", adjustedPrice)
                      setAdjustedPrice(product.id, adjustedPrice);
                    }}
                    decrementQuantity={() => { decrementQuantity(product.id) }}
                    incrementQuantity={() => { incrementQuantity(product.id) }}
                    setQuantity={(quantity: number) => { setQuantity(product.id, quantity) }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      {products.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>Subtotal</p>
            <p>Rp{subTotal}</p>
          </div>
          <div className="mt-6">
            <button
              onClick={onMakeOrder}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </>
  )
}
