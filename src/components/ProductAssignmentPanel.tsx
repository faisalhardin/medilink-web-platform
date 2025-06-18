// Modified ProductAssignmentPanel.tsx with improved search panel functionality
import { useEffect, useState, useRef } from 'react';
import { PatientVisit, PatientVisitDetail } from '@models/patient';
import { ListProducts } from '@requests/products';
import { Product, AssignedProductRequest, CheckoutProduct, TrxVisitProduct } from '@models/product';
import { set } from 'lodash';

interface ProductAssignmentPanelProps {
  patientVisit: PatientVisit;
  journeyPointId: number;
  assignedProducts: AssignedProductRequest[];
  orderedProducts: TrxVisitProduct[];
  onAssignProduct: ( product: AssignedProductRequest, visitID: number) => Promise<void>;
}

interface ProductListProps {
  product: Product;
  // order: Product;
  decrementQuantity: () => void;
  incrementQuantity: () => void;
  setQuantity: (id: number) => void;
}

const ProductList = ({ product, decrementQuantity, incrementQuantity, setQuantity }: ProductListProps) => {
  return (
    (
      <div className="border rounded p-3 mb-2">
        <div className="font-medium">{product.name}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center border rounded">
            <button
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={decrementQuantity}
            // disabled={quantity <= 1}
            >
              -
            </button>
            <input
              className="px-3 py-1 border-l border-r w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={product.quantity || 1}
              type="number"
              // min="0"
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 1);
              }}
            />
            <button
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={incrementQuantity}
            >
              +
            </button>
          </div>
        </div>
      </div>
    )
  )
}

export const ProductAssignmentPanel = ({
  patientVisit,
  journeyPointId,
  assignedProducts,
  orderedProducts: requestedProducts, //TODO: add later
  onAssignProduct,
}: ProductAssignmentPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  // const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  // const [requestedProducts, setRequestedProducts] = useState<Product[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter assigned products for current journey point
  // const currentAssignedProducts = assignedProducts.filter(
  //   p => p.journey_point_id === journeyPointId
  // );

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
    addProduct({...product, quantity: 1});
    setSearchTerm(product.name);
    setShowResults(false);
  };

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

  const addProduct = (product: Product) => {
    // Check if product already exists in the list
    const existingProductIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Product exists, update its quantity
      const updatedProducts = [...selectedProducts];
      const existingProduct = updatedProducts[existingProductIndex];
      updatedProducts[existingProductIndex] = {
        ...existingProduct,
        quantity: (existingProduct.quantity || 1) + (product.quantity || 1)
      };
      setSelectedProducts(updatedProducts);
    } else {
      // Product doesn't exist, add it to the list
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const incrementQuantity = (id: number) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
    ));
  };

  const decrementQuantity = (id: number ) => {
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, quantity: (p.quantity) - 1 } : p
    ).filter(p => p.quantity !== 0));
  };

  const setQuantity = (id: number, quantity: number ) => {
    console.log("setQuantity", id, quantity);
    setSelectedProducts(selectedProducts.map(p =>
      p.id === id ? { ...p, quantity: quantity } : p
    ).filter(p => p.quantity !== 0));
    console.log("selectedProducts", selectedProducts);
  };

  const deleteProduct = (id: number) => {
    const newProductList = selectedProducts.filter(product => product.id !== id);
    setSelectedProducts(newProductList);
  };

  // const handleAssignx = async () => {
  //   if (!selectedProduct) return;
    
  //   const newAssignment: AssignedProduct = {
  //     product_id: selectedProduct.id || 0,
  //     patient_visit_id: patientVisit.id,
  //     journey_point_id: journeyPointId,
  //     quantity,
  //     notes,
  //     product: selectedProduct
  //   };
    
  //   await onAssignProduct(newAssignment);
    
  //   // Reset form
  //   setSelectedProduct(null);
  //   setQuantity(1);
  //   setNotes('');
  //   setSearchTerm('');
  //   setSearchResults([]);
  // };

  // const incrementQuantity = (id) => {
  //   if (selectedProduct && quantity < selectedProduct.quantity) {
  //     setQuantity(prev => prev + 1);
  //   }
  // };

  // const decrementQuantity = () => {
  //   if (quantity > 1) {
  //     setQuantity(prev => prev - 1);
  //   }
  // };

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
                 className={`p-2 ${product.quantity > 0 ? 'cursor-pointer hover:bg-gray-100' : 'cursor-not-allowed opacity-50'}`}
                 onClick={() => product.quantity > 0 ? handleResultClick(product) : null}
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
        
        {/* Selected product form */}
        {selectedProducts.map((product) => (
          <ProductList
            key={product.id}
            product={product}
            decrementQuantity={() =>{decrementQuantity(product.id ?? product.id ?? 0)}}
            incrementQuantity={() => {incrementQuantity(product.id ?? product.id ?? 0)}}
            setQuantity={(quantity: number)=> {
              setQuantity(product.id ?? product.id ?? 0, quantity);
            }}
            
          />
          
        ))}
        <button onClick={()=>{
          const checkedProducts: CheckoutProduct[] = selectedProducts.map(product => ({
            product_id: product.id,
            quantity: product.quantity || 1,
            // adjustable price
          }));
          const productRequest: AssignedProductRequest = {
            products: checkedProducts,
          };
          
          onAssignProduct( productRequest, patientVisit.id);
        }}> Order</button>
      </div>
    </div>
  );
};
