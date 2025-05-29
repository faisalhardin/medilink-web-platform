// New component: ProductAssignmentPanel.tsx
import { useEffect, useState } from 'react';
import { PatientVisit, PatientVisitDetail } from '@models/patient';
import { ListProducts } from '@requests/products';
import { Product } from '@models/product';

interface AssignedProduct {
  id?: number;
  product_id: number;
  patient_visit_id: number;
  journey_point_id: number;
  quantity: number;
  notes?: string;
  product?: Product;
}

interface ProductAssignmentPanelProps {
  patientVisit: PatientVisit;
  journeyPointId: number;
  // assignedProducts: AssignedProduct[];
  // onAssignProduct: (product: AssignedProduct) => Promise<void>;
  onRemoveProduct: (productId: number) => Promise<void>;
}

export const ProductAssignmentPanel = (
  {
  // patientVisit,
  // journeyPointId,
  // assignedProducts,
  // onAssignProduct,
  onRemoveProduct
}: ProductAssignmentPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Filter assigned products for current journey point
  // const currentAssignedProducts = assignedProducts.filter(
  //   p => p.journey_point_id === journeyPointId
  // );

  const handleSearch = async () => {
    if (searchTerm.length < 3 || isSearching) return;
    
    setIsSearching(true);
    try {
      // Replace with your actual API call
      const response = await ListProducts({
        name: searchTerm,
        limit:5 
      });
      const data = response;
      setSearchResults(data? data as Product[]: [] );
      console.log("searchResults", searchResults, response);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssign = async () => {
    // if (!selectedProduct) return;
    
    // const newAssignment: AssignedProduct = {
    //   product_id: selectedProduct.id,
    //   patient_visit_id: patientVisit.id,
    //   journey_point_id: journeyPointId,
    //   quantity,
    //   notes,
    //   product: selectedProduct
    // };
    
    // await onAssignProduct(newAssignment);
    
    // // Reset form
    // setSelectedProduct(null);
    // setQuantity(1);
    // setNotes('');
    // setSearchTerm('');
    // setSearchResults([]);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">Assign Products</h3>
      
      {/* Search and assign section */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="flex-1 border rounded px-2 py-1"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="border rounded max-h-40 overflow-y-auto mb-2">
            {searchResults.map(product => (
              <div 
                key={product.id}
                className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedProduct?.id === product.id ? 'bg-blue-100' : ''}`}
                onClick={() => setSelectedProduct(product)}
              >
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">
                  Code: {product.price} | Stock: {product.quantity} {product.unit_type}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Selected product form */}
        {selectedProduct && (
          <div className="border rounded p-3 mb-2">
            <div className="font-medium">{selectedProduct.name}</div>
            <div className="text-sm text-gray-600 mb-2">
              Available: {selectedProduct.quantity} {selectedProduct.unit_type}
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm">Quantity:</label>
              <input
                type="number"
                min="1"
                max={selectedProduct.quantity}
                className="border rounded w-20 px-2 py-1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>            
            <div className="flex justify-end">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={handleAssign}
              >
                Assign
              </button>
            </div>
          </div>
        )}
      </div>
      
      
      {/* Assigned products list */}
      <div>
        <h4 className="font-medium mb-2">Assigned Products</h4>
        {/* {currentAssignedProducts.length === 0 ? (
          <p className="text-gray-500 text-sm">No products assigned yet</p>
        ) : (
          <div className="border rounded">
            {currentAssignedProducts.map((item) => (
              <div key={item.id} className="border-b last:border-b-0 p-2">
                <div className="flex justify-between">
                  <div className="font-medium">{item.product?.name}</div>
                  <button
                    className="text-red-500 text-sm"
                    onClick={() => item.id && onRemoveProduct(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="text-sm">
                  Quantity: {item.quantity} {item.product?.unit}
                </div>
                {item.notes && (
                  <div className="text-sm text-gray-600 mt-1">{item.notes}</div>
                )}
              </div>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
};
