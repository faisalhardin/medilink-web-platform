import React, { useState, useEffect } from 'react';
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
import { ResupplyProduct } from '@requests/institution';

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
          ? { ...item, replenishmentQuantity: Math.max(-item.currentQuantity, quantity) }
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
          ? { ...item, replenishmentQuantity: Math.max(-item.currentQuantity, item.replenishmentQuantity - 1) }
          : item
      )
    );
  };

  // Handle order submission
  const handleMakeOrder = async () => {
    const itemsToOrder = replenishmentItems.filter(item => item.replenishmentQuantity !== 0);
    
    if (itemsToOrder.length === 0) {
      alert('Please add items to replenish');
      return;
    }
    
    // Here you would typically call an API to process the replenishment order
    await ResupplyProduct({products: itemsToOrder.map(item => ({product_id: item.id, quantity: item.replenishmentQuantity}))});
    
    // Clear the replenishment list after successful order
    setReplenishmentItems([]);
    fetchProducts();
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-end lg:justify-between items-center mb-6">
        <Typography variant="h4" className="hidden lg:block font-bold">Product Replenishment</Typography>
        {/* 
          On mobile (screen width < 1024px), make this clickable.
          On click, scroll/move to the replenishment panel (assume it has id="replenishment-panel")
        */}
        <Box
          className={`flex items-center gap-3 transition-all duration-300 ${
            replenishmentItems.length > 0 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 lg:bg-none rounded-xl lg:rounded-none px-4 py-3 lg:px-3 lg:py-2 border border-blue-200/60 lg:border-b-0 lg:border-t-0 lg:border-l-0 lg:border-r-0 lg:border-blue-300 backdrop-blur-sm lg:backdrop-blur-none' 
              : 'px-2 py-2'
          }`}
          sx={{
            cursor: {
              xs: 'pointer',
              lg: 'default'
            },
            position: 'relative',
            boxShadow: {
              xs: replenishmentItems.length > 0 ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
              lg: 'none'
            },
            '&:hover': replenishmentItems.length > 0 ? {
              transform: {'xs': 'translateY(-2px)', 'lg': 'none'},
              transition: 'all 0.3s ease-in-out'
            } : {}
          }}
          onClick={() => {
            if (window.innerWidth < 1024) {
              const panel = document.getElementById('replenishment-panel');
              if (panel) {
                panel.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <InventoryIcon 
              className={`transition-all duration-300 ${
                replenishmentItems.length > 0 
                  ? 'text-blue-600' 
                  : 'text-gray-400'
              }`}
              sx={{
                fontSize: {
                  xs: '1.75rem',
                  lg: '1.5rem'
                }
              }}
            />
            {replenishmentItems.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: {
                    xs: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    lg: '#3b82f6'
                  },
                  border: '2px solid white',
                  display: {
                    xs: 'block',
                    lg: 'none'
                  }
                }}
              />
            )}
          </Box>
          <Typography 
            variant="h6" 
            className={`transition-all duration-300 ${
              replenishmentItems.length > 0 
                ? 'text-blue-700 lg:text-blue-600 font-semibold lg:font-normal tracking-tight' 
                : 'text-gray-600'
            }`}
            sx={{
              fontSize: {
                xs: replenishmentItems.length > 0 ? '1.1rem' : '1rem',
                lg: '1rem'
              },
              fontWeight: {
                xs: replenishmentItems.length > 0 ? 600 : 400,
                lg: 400
              }
            }}
          >
            {replenishmentItems.length} {replenishmentItems.length === 1 ? 'item' : 'items'} selected
          </Typography>
          {replenishmentItems.length > 0 && window.innerWidth < 1024 && (
            <Chip 
              label="Tap to view" 
              size="small" 
              sx={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '24px',
                animation: 'verticalBounce 2s ease-in-out infinite',
                '@keyframes verticalBounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-4px)' }
                },
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                  transform: 'translateY(-2px)'
                }
              }}
            />
          )}
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
                  availableProducts
                  .filter(product => {
                    return !replenishmentItems.some(item => item.id === product.id);
                  })
                  .map((product) => (
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
              <Box id="replenishment-panel" className="flex-1 overflow-y-auto mb-4">
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
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCart />}
                      onClick={handleMakeOrder}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Resupply Order
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
    // Allow negative and positive integers (including empty string)
    if (/^-?\d*$/.test(value)) {
      setQuantityDisplayValue(value);
      // parseInt handles negative numbers, fallback to 0 if NaN or empty
      const numericValue = value === '' || value === '-' ? 0 : parseInt(value, 10) || 0;
      console.log(numericValue);
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
          Order Qty:
        </Typography>
        
        <Box className="flex items-center border rounded">
          <IconButton
            size="small"
            onClick={() => onDecrement(item.id)}
            disabled={item.replenishmentQuantity <= -item.currentQuantity}
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
    </Box>
  );
};

export default ProductReplenishment;
