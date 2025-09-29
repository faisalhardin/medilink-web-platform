import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  ArrowForward,
  Add,
  Remove,
  Search,
  ShoppingCart,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { Product } from '@models/product';
import { ListProducts } from '@requests/products';
import { formatPrice } from '@utils/common';

interface ReplenishmentItem {
  id: number;
  name: string;
  currentQuantity: number;
  unitType: string;
  price: number;
  replenishmentQuantity: number;
  isItem: boolean;
  isTreatment: boolean;
}

const ProductReplenishment = () => {
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [replenishmentItems, setReplenishmentItems] = useState<ReplenishmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch available products
  const fetchProducts = async (searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        is_item: true, // Only show items for replenishment
        limit: 50
      };
      
      if (searchTerm) {
        params.name = searchTerm;
      }
      
      const response = await ListProducts(params);
      setAvailableProducts(response as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle search with debouncing
  const handleSearch = async (term: string) => {
    setSearchQuery(term);
    setIsSearching(true);
    
    // Simple debouncing
    const timeoutId = setTimeout(() => {
      fetchProducts(term);
      setIsSearching(false);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Move product to replenishment list
  const moveToReplenishment = (product: Product) => {
    const existingItem = replenishmentItems.find(item => item.id === product.id);
    
    if (!existingItem) {
      const newItem: ReplenishmentItem = {
        id: product.id,
        name: product.name,
        currentQuantity: product.quantity,
        unitType: product.unit_type,
        price: product.price,
        replenishmentQuantity: 0,
        isItem: product.is_item,
        isTreatment: product.is_treatment
      };
      
      setReplenishmentItems(prev => [...prev, newItem]);
    }
  };

  // Remove product from replenishment list
  const removeFromReplenishment = (productId: number) => {
    setReplenishmentItems(prev => prev.filter(item => item.id !== productId));
  };

  // Update replenishment quantity
  const updateReplenishmentQuantity = (productId: number, quantity: number) => {
    setReplenishmentItems(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, replenishmentQuantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  // Increment quantity
  const incrementQuantity = (productId: number) => {
    setReplenishmentItems(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, replenishmentQuantity: item.replenishmentQuantity + 1 }
          : item
      )
    );
  };

  // Decrement quantity
  const decrementQuantity = (productId: number) => {
    setReplenishmentItems(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, replenishmentQuantity: Math.max(0, item.replenishmentQuantity - 1) }
          : item
      )
    );
  };

  // Handle order submission
  const handleMakeOrder = () => {
    const itemsToOrder = replenishmentItems.filter(item => item.replenishmentQuantity > 0);
    
    if (itemsToOrder.length === 0) {
      alert('Please add items to replenish');
      return;
    }
    
    // Here you would typically call an API to process the replenishment order
    console.log('Replenishment order:', itemsToOrder);
    alert(`Order placed for ${itemsToOrder.length} items`);
    
    // Clear the replenishment list after successful order
    setReplenishmentItems([]);
  };

  // Calculate total value
  const totalValue = replenishmentItems.reduce((sum, item) => 
    sum + (item.price * item.replenishmentQuantity), 0
  );

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">Product Replenishment</Typography>
        <Box className="flex items-center gap-2">
          <InventoryIcon className="text-blue-600" />
          <Typography variant="h6" className="text-gray-600">
            {replenishmentItems.length} items selected
          </Typography>
        </Box>
      </div>

      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Panel - Available Products */}
        <Grid item xs={12} md={6}>
          <Card className="h-full">
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-4">
                Available Products
              </Typography>
              
              {/* Search Bar */}
              <Box className="mb-4">
                <TextField
                  fullWidth
                  placeholder="Search products..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search className="text-gray-400 mr-2" />,
                    endAdornment: isSearching ? <CircularProgress size={20} /> : null
                  }}
                />
              </Box>

              <Divider className="mb-4" />

              {/* Products List */}
              <Box className="max-h-96 overflow-y-auto">
                {loading ? (
                  <Box className="flex justify-center py-8">
                    <CircularProgress />
                  </Box>
                ) : availableProducts.length === 0 ? (
                  <Typography className="text-center py-8 text-gray-500">
                    No products found
                  </Typography>
                ) : (
                  availableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onMove={moveToReplenishment}
                      isInReplenishment={replenishmentItems.some(item => item.id === product.id)}
                    />
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Replenishment List */}
        <Grid item xs={12} md={6}>
          <Card className="h-full">
            <CardContent className="flex flex-col">
              <Typography variant="h6" className="font-semibold mb-4">
                Replenishment List
              </Typography>
              
              <Divider className="mb-4" />

              {/* Replenishment Items */}
              <Box className="flex-1 overflow-y-auto mb-4">
                {replenishmentItems.length === 0 ? (
                  <Typography className="text-center py-8 text-gray-500">
                    No items selected for replenishment
                  </Typography>
                ) : (
                  replenishmentItems.map((item) => (
                    <ReplenishmentItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateReplenishmentQuantity}
                      onIncrement={incrementQuantity}
                      onDecrement={decrementQuantity}
                      onRemove={removeFromReplenishment}
                    />
                  ))
                )}
              </Box>

              {/* Order Summary and Button */}
              {replenishmentItems.length > 0 && (
                <>
                  <Divider className="mb-4" />
                  <Box className="space-y-2">
                    <Box className="flex justify-between items-center">
                      <Typography variant="h6" className="font-semibold">
                        Total Value:
                      </Typography>
                      <Typography variant="h6" className="font-bold text-blue-600">
                        {formatPrice(totalValue)}
                      </Typography>
                    </Box>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={handleMakeOrder}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Make Replenishment Order
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onMove: (product: Product) => void;
  isInReplenishment: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onMove, isInReplenishment }) => {
  return (
    <Box className="border rounded-lg p-3 mb-2 hover:bg-gray-50 transition-colors">
      <Box className="flex justify-between items-center">
        <Box className="flex-1">
          <Typography variant="subtitle1" className="font-medium">
            {product.name}
          </Typography>
          <Box className="flex items-center gap-2 mt-1">
            <Typography variant="body2" className="text-gray-600">
              Stock: {product.quantity} {product.unit_type}
            </Typography>
            <Chip 
              size="small" 
              label={product.is_item ? "Item" : "Treatment"} 
              color={product.is_item ? "primary" : "secondary"}
            />
          </Box>
          <Typography variant="body2" className="text-gray-500">
            {formatPrice(product.price)}
          </Typography>
        </Box>
        
        <IconButton
          onClick={() => onMove(product)}
          disabled={isInReplenishment}
          className={`ml-2 ${isInReplenishment ? 'opacity-50' : 'hover:bg-blue-100'}`}
          title={isInReplenishment ? "Already in replenishment list" : "Add to replenishment"}
        >
          <ArrowForward color={isInReplenishment ? "disabled" : "primary"} />
        </IconButton>
      </Box>
    </Box>
  );
};

// Replenishment Item Card Component
interface ReplenishmentItemCardProps {
  item: ReplenishmentItem;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onIncrement: (productId: number) => void;
  onDecrement: (productId: number) => void;
  onRemove: (productId: number) => void;
}

const ReplenishmentItemCard: React.FC<ReplenishmentItemCardProps> = ({
  item,
  onUpdateQuantity,
  onIncrement,
  onDecrement,
  onRemove
}) => {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [quantityDisplayValue, setQuantityDisplayValue] = useState(item.replenishmentQuantity.toString());

  // Update display value when replenishment quantity changes
  useEffect(() => {
    if (!isEditingQuantity) {
      setQuantityDisplayValue(item.replenishmentQuantity.toString());
    }
  }, [item.replenishmentQuantity, isEditingQuantity]);

  const handleQuantityChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setQuantityDisplayValue(value);
      const numericValue = parseInt(value) || 0;
      onUpdateQuantity(item.id, numericValue);
    }
  };

  const handleQuantityFocus = () => {
    setIsEditingQuantity(true);
  };

  const handleQuantityBlur = () => {
    setIsEditingQuantity(false);
  };

  return (
    <Box className="border rounded-lg p-3 mb-2 bg-gray-50">
      <Box className="flex justify-between items-start mb-2">
        <Box className="flex-1">
          <Typography variant="subtitle1" className="font-medium">
            {item.name}
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Current Stock: {item.currentQuantity} {item.unitType}
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            {formatPrice(item.price)} per {item.unitType}
          </Typography>
        </Box>
        
        <IconButton
          onClick={() => onRemove(item.id)}
          size="small"
          className="text-red-500 hover:bg-red-100"
          title="Remove from replenishment"
        >
          <Remove fontSize="small" />
        </IconButton>
      </Box>

      {/* Quantity Controls */}
      <Box className="flex items-center gap-2">
        <Typography variant="body2" className="text-gray-700 min-w-0">
          Replenishment Qty:
        </Typography>
        
        <Box className="flex items-center border rounded">
          <IconButton
            size="small"
            onClick={() => onDecrement(item.id)}
            disabled={item.replenishmentQuantity <= 0}
          >
            <Remove fontSize="small" />
          </IconButton>
          
          <TextField
            size="small"
            value={quantityDisplayValue}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onFocus={handleQuantityFocus}
            onBlur={handleQuantityBlur}
            className="w-16"
            inputProps={{
              style: { textAlign: 'center', padding: '4px' },
              min: 0
            }}
          />
          
          <IconButton
            size="small"
            onClick={() => onIncrement(item.id)}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="body2" className="text-gray-600">
          {item.unitType}
        </Typography>
      </Box>

      {/* Total Price */}
      {item.replenishmentQuantity > 0 && (
        <Typography variant="body2" className="text-blue-600 font-medium mt-2">
          Total: {formatPrice(item.price * item.replenishmentQuantity)}
        </Typography>
      )}
    </Box>
  );
};

export default ProductReplenishment;
