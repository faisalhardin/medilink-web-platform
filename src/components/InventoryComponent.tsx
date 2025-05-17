// src/pages/Inventory.tsx
import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, IconButton, Typography, Box, FormControl, InputLabel,
  Select, MenuItem, Chip, Grid, Card, CardContent, SelectChangeEvent
} from "@mui/material";
import {
  Add, Edit, Delete, Refresh, FilterList, Search,
  Warning, Inventory as InventoryIcon, ShoppingCart, AttachMoney
} from "@mui/icons-material";
import { useModal } from "../context/ModalContext";
import InventoryForm from "../components/InventoryForm";

// Define the Product type based on your backend structure
interface Product {
  id: number;
  name: string;
  id_mst_product?: number;
  price?: number;
  is_item?: boolean;
  is_treatment: boolean;
  quantity: number;
  unit_type?: string;
}

const InventoryComponent = () => {
  const { openModal } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    showLowStock: false,
    type: "all", // "all", "item", "treatment"
  });
  
  // Fetch products from API
  useEffect(() => {
    // Replace with your actual API call
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      setTimeout(() => {
        const mockProducts: Product[] = [
          { id: 1, name: "Paracetamol", price: 5.99, is_item: true, is_treatment: false, quantity: 150, unit_type: "box" },
          { id: 2, name: "Bandages", price: 3.50, is_item: true, is_treatment: false, quantity: 75, unit_type: "pack" },
          { id: 3, name: "Blood Test", price: 25.00, is_item: false, is_treatment: true, quantity: 0, unit_type: "" },
          { id: 4, name: "Syringes", price: 1.25, is_item: true, is_treatment: false, quantity: 8, unit_type: "piece" },
          { id: 5, name: "Consultation", price: 50.00, is_item: false, is_treatment: true, quantity: 0, unit_type: "" },
        ];
        setProducts(mockProducts);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };
  
  // Handle adding a new product
  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    // In a real app, you would make an API call here
    const productWithId = {
      ...newProduct,
      id: Math.max(0, ...products.map(p => p.id)) + 1 // Generate a temporary ID
    };
    
    setProducts([...products, productWithId as Product]);
  };
  
  // Open the add product modal
  const openAddProductModal = () => {
    openModal(
      <InventoryForm 
        onSubmit={handleAddProduct}
        onCancel={() => {
          // This will be handled by the form
        }}
      />
    );
  };
  
  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filterOptions.type === "item" && !product.is_item) return false;
    if (filterOptions.type === "treatment" && !product.is_treatment) return false;
    
    // Low stock filter (assuming less than 10 is low stock)
    if (filterOptions.showLowStock && product.quantity > 10) {
      return false;
    }
    
    return true;
  });
  
  // Calculate inventory statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.quantity <= 10).length;
  const totalItems = products.filter(p => p.is_item).length;
  const totalTreatments = products.filter(p => p.is_treatment).length;
  const inventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);
  
  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold">Inventory Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          className="bg-blue-600 hover:bg-blue-700"
          onClick={openAddProductModal}
        >
          Add New Product
        </Button>
      </div>
      
      {/* Dashboard Cards */}
      <Grid container spacing={2} className="mb-6">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="shadow-sm h-full">
            <CardContent className="flex flex-col items-center p-4 h-full">
              <InventoryIcon className="text-blue-600 text-3xl mb-2" />
              <Typography variant="h5" className="font-bold">{totalProducts}</Typography>
              <Typography variant="body2" className="text-gray-600">Total Products</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
        <Card className="shadow-sm h-full">
            <CardContent className="flex flex-col items-center p-4 h-full">
              <ShoppingCart className="text-green-600 text-3xl mb-2" />
              <Typography variant="h5" className="font-bold">{totalItems}</Typography>
              <Typography variant="body2" className="text-gray-600">Items</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
        <Card className="shadow-sm h-full">
            <CardContent className="flex flex-col items-center p-4 h-full">
              <Warning className="text-amber-600 text-3xl mb-2" />
              <Typography variant="h5" className="font-bold">{lowStockCount}</Typography>
              <Typography variant="body2" className="text-gray-600">Low Stock</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
        <Card className="shadow-sm h-full">
            <CardContent className="flex flex-col items-center p-4 h-full">
              <AttachMoney className="text-emerald-600 text-3xl mb-2" />
              <Typography variant="h5" className="font-bold">${inventoryValue.toLocaleString()}</Typography>
              <Typography variant="body2" className="text-gray-600">Total Value</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Search and Filter */}
      <Box className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <Box className="flex items-center gap-2 w-full sm:w-auto">
          <TextField
            placeholder="Search products..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search className="text-gray-400 mr-2" />,
            }}
            className="min-w-[250px]"
          />
          <IconButton onClick={() => setFilterOptions(prev => ({ ...prev, showLowStock: !prev.showLowStock }))}>
            <FilterList color={filterOptions.showLowStock ? "primary" : "inherit"} />
          </IconButton>
        </Box>
        
        <Box className="flex items-center gap-2 w-full sm:w-auto">
          <FormControl size="small" className="min-w-[150px]">
            <InputLabel id="type-filter-label">Type</InputLabel>
            <Select
  labelId="type-filter-label"
  value={filterOptions.type}
  label="Type"
  onChange={(event: SelectChangeEvent<string>) => {
    setFilterOptions(prev => ({ ...prev, type: event.target.value }));
  }}
>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="item">Items Only</MenuItem>
              <MenuItem value="treatment">Treatments Only</MenuItem>
            </Select>
          </FormControl>
          <Button 
            startIcon={<Refresh />} 
            onClick={fetchProducts}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Products Table */}
      <TableContainer component={Paper} className="shadow-md">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="font-semibold">ID</TableCell>
              <TableCell className="font-semibold">Name</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Price</TableCell>
              <TableCell className="font-semibold">Quantity</TableCell>
              <TableCell className="font-semibold">Unit</TableCell>
              <TableCell className="font-semibold">Status</TableCell>
              <TableCell className="font-semibold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {product.is_item && (
                      <Chip size="small" label="Item" className="bg-blue-100 text-blue-800" />
                    )}
                    {product.is_treatment && (
                      <Chip size="small" label="Treatment" className="bg-purple-100 text-purple-800" />
                    )}
                  </TableCell>
                  <TableCell>${product.price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.unit_type || '-'}</TableCell>
                  <TableCell>
                    {product.quantity <= 10 ? (
                      <Chip size="small" label="Low Stock" color="warning" />
                    ) : (
                      <Chip size="small" label="In Stock" color="success" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box className="flex gap-2">
                      <IconButton size="small" color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default InventoryComponent;
