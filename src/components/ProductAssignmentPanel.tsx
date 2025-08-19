// Modified ProductAssignmentPanel.tsx with improved search panel functionality
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { PatientVisit, PatientVisitDetail } from '@models/patient';
import { ListProducts } from '@requests/products';
import { Product, AssignedProductRequest, CheckoutProduct, TrxVisitProduct, ProductPanelProps } from '@models/product';
import { debounce } from 'lodash';
import { UpdatePatientVisit } from '@requests/patient';

interface ProductAssignmentPanelProps {
  patientVisit: PatientVisit;
  journeyPointId: number;
  cartProducts: Product[];
  orderedProducts: TrxVisitProduct[];
  updateSelectedProducts: (products: Product[]) => void;
  onAssignProduct: (product: CheckoutProduct[], visitID: number) => void;
}

interface ProductListProps {
  name: string | undefined;
  cartQuantity: number;
  orderedQuantity: number;
  decrementQuantity: () => void;
  incrementQuantity: () => void;
  setQuantity: (id: number) => void;
}

const ProductQuantityPanel = ({  name, cartQuantity, orderedQuantity, decrementQuantity, incrementQuantity, setQuantity }: ProductListProps) => {
  const quantityDiff =cartQuantity - orderedQuantity;
  console.log("new quantity", quantityDiff, cartQuantity, orderedQuantity);
  
  return (
    (
      <div className="border rounded p-3 mb-2">
        <div className="font-medium">{name}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center border rounded">
            <button onClick={decrementQuantity}>-</button>
            <input
              className="px-3 py-1 border-l border-r w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              value={cartQuantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />
            <button onClick={incrementQuantity}>+</button>
          </div>
          {quantityDiff !== 0 && (
            <span className={quantityDiff > 0 ? "positive-quantity" : "negative-quantity"}>
              {quantityDiff > 0 ? `+${quantityDiff}` : quantityDiff}
            </span>
          )}
        </div>
      </div>
    )
  )
}

export const ProductAssignmentPanel = ({
  patientVisit,
  cartProducts,
  orderedProducts,

  journeyPointId,
  updateSelectedProducts,
  // productPanelProps,
  onAssignProduct,
}: ProductAssignmentPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // const [selectedProducts, setSelectedProducts] = useState<Product[]>(patientVisit.product_cart || []);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const updateVisitCart = async (patientVisit: PatientVisit, products: Product[]) => {
   const productsCart: CheckoutProduct[] = products.map((product) => {
        return {
          id: product.id,
          quantity: product.quantity,
          unit_type: product.unit_type,
          total_price: product.price * product.quantity,
          price: product.price,
          name: product.name,

        };
      });
      const resp = await UpdatePatientVisit({
        id: patientVisit.id,
        product_cart: productsCart
      });
  };
  
  const debouncedUpdateCart = useCallback(
    debounce(async (patientVisit: PatientVisit, products: Product[]) => {
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
  const missingProducts = missingFromCart.map(prod => ({
    id: prod.id_trx_institution_product,
    name: prod.name || 'Unknown Product',
    price: prod.price || 0,
    quantity: 0, // Start with 0 for ordered products not in cart
    is_item: prod.is_item || false,
    is_treatment: prod.is_treatment || false,
    unit_type: prod.unit_type || '',
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
  }, [] as Product[]);

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

  const addProduct = (product: Product): Product[] => {
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
      console.log("add new", product);
      const updatedProducts = [...cartProducts, product];
      updateSelectedProducts(updatedProducts);
      return updatedProducts;
    }
  };

  let productPanelList = useMemo(() => {
    const cartProduct = cartProducts.reduce((prev, prod) => {
      prev[prod.id] = prod;
      return prev;
    }, {} as { [key: number]: Product });
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
      console.log("empty cart", panelProps);
      return panelProps;
    }

    for (const key in cartProduct) {
      panelProps.push({
        product_id: cartProduct[key].id,

        name: cartProduct[key].name,
        cartProduct: cartProduct[key],
      })
    }

    console.log("productPanelList", panelProps);
    return panelProps
  }, [orderedProducts, cartProducts])

  const incrementQuantity = (id: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id ? { ...p, quantity: (p.quantity || 0) + 1 } : p
    )
    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);

  };

  const decrementQuantity = (id: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id && p.quantity ? { ...p, quantity: (p.quantity) - 1 || 0 } : p
    );
    // .filter(p => p.quantity !== 0);
    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);
  };

  const setQuantity = (id: number, quantity: number) => {
    const updatedProducts = cartProducts.map(p =>
      p.id === id ? { ...p, quantity: quantity } : p
    ).filter(p => p.quantity !== 0);

    updateSelectedProducts(updatedProducts);
    debouncedUpdateCart(patientVisit, updatedProducts);

  };

  const deleteProduct = (id: number) => {
    const newProductList = cartProducts.filter(product => product.id !== id);
    updateSelectedProducts(newProductList);
  };

  return (
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
                  cartQuantity={product.cartProduct?.quantity ?? 0}
                  orderedQuantity={product.orderedProduct?.quantity ?? 0}
                  decrementQuantity={() => { decrementQuantity(product.product_id) }}
                  incrementQuantity={() => { incrementQuantity(product.product_id) }}
                  setQuantity={(quantity: number) => {
                    setQuantity(product.product_id, quantity);
                  }}

                />
              </li>


            ))}
        </ul>

        <button onClick={() => {
          const checkedProducts: CheckoutProduct[] = cartProducts.map(product => ({
            id: product.id,
            quantity: product.quantity || 1,
            name: product.name,
            price: product.price,
            unit_type: product.unit_type ?? '',
            total_price: product.price * product.quantity,
          }));


          onAssignProduct(checkedProducts, patientVisit.id);
        }}> Order</button>
      </div>
    </div>
  );
};
