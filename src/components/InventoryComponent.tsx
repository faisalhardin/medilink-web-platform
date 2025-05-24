// src/pages/Inventory.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, IconButton, Typography, Box, FormControl, InputLabel,
  Select, MenuItem, Chip, Grid, Card, CardContent, SelectChangeEvent,
  Alert
} from "@mui/material";
import {
  Add, Edit, Delete, Refresh, FilterList, Search,
  Warning, Inventory as InventoryIcon, ShoppingCart, AttachMoney
} from "@mui/icons-material";
import { useModal } from "../context/ModalContext";
import InventoryForm from "../components/InventoryForm";
import { ListProductParams, Product } from "@models/product";
import { InsertProduct, ListProducts } from "@requests/products";
import { useLocation, useNavigate } from "react-router-dom";
import { List } from "lodash";



const InventoryComponent = () => {
  const { openModal } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  console.log(queryParams.get("name"))

  // Initialize state from URL parameters
  const [searchQuery, setSearchQuery] = useState(queryParams.get("name") || "");
  const [filterOptions, setFilterOptions] = useState({
    showLowStock: false,
    type: "item", // "all", "item", "treatment"
    page: 1,
    limit: 20,
  });

   // Update URL when filters change
 // Helper function to update URL parameters
const updateUrlParams = (search: string, params: Record<string, any>) => {
  const urlParams = new URLSearchParams();
  
  // Add search parameter if it exists
  if (search) urlParams.set("name", search);
  
  // Add all other parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.set(key, value.toString());
    }
  });
  
  // Update the URL without reloading the page
  navigate(
    {
    pathname: location.pathname,
    search: urlParams.toString()
    }, 
    { replace: true });
};
  
  // Fetch products from API
  useEffect(() => {
    // If URL has parameters, use them
    if (location.search) {
      setSearchQuery(queryParams.get("name") || "");
      setFilterOptions({
        showLowStock: queryParams.get("lowStock") === "true",
        type: queryParams.get("type") || "item",
        // Include page and limit properties with defaults if not in URL
        page: parseInt(queryParams.get("page") || "1", 10),
        limit: parseInt(queryParams.get("limit") || "20", 10),
      });
      fetchProducts();
    } else {
      // Otherwise set defaults
      setDefaultFilters();
    }
  }, []);

  const setDefaultFilters = () => {
    const newOptions = {
      ...filterOptions,
      type: "item" // Default to item type
    };
    
    setFilterOptions(newOptions);
    updateUrlParams(searchQuery, newOptions);
    fetchProducts(); // Actually fetch with the new filters
  };
  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchQuery) params.name = searchQuery;
      if (filterOptions.showLowStock) params.lowStock = "true";
      if (filterOptions.type === "item") {
        params.is_item = true;
        params.is_treatment = false;
      }
      if (filterOptions.type === "treatment") {
        params.is_item = false;
        params.is_treatment = true;
      }
      console.log("fetchProducts", params);
      const productResponse = await ListProducts(params);
      setProducts(productResponse.data as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterOptions]);
  

  
  
  // Handle adding a new product
  const handleAddProduct = async (newProduct: Omit<Product, "id">) => {
    await InsertProduct(newProduct);
    await fetchProducts();
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

   // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search query:", e.target.value);
    setSearchQuery(e.target.value);
    applyFilters();
  };

  // Handle filter changes
  const handleFilterChange = (newOptions: typeof filterOptions) => {
    setFilterOptions(newOptions);
  };

  // Apply filters when filter button is clicked
  const applyFilters = () => {
    updateUrlParams(searchQuery, filterOptions);
    fetchProducts();
  };
  
  // Filter products based on search and filters
  const filteredProducts = products;
  
  // Calculate inventory statistics
  const totalProducts = products?.length || 0;
  const lowStockCount = products?.filter(p => p.quantity <= 10).length || 0;
  const totalItems = products?.filter(p => p.is_item).length || 0;
  const totalTreatments = products?.filter(p => p.is_treatment).length || 0;
  const inventoryValue = products?.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0) || 0;
  
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
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search className="text-gray-400 mr-2" />,
            }}
            className="min-w-[250px]"
          />
          <IconButton 
            onClick={() => {
              const newOptions = {
                ...filterOptions,
                showLowStock: !filterOptions.showLowStock
              };
              handleFilterChange(newOptions);
            }}
          >
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
    const newOptions = {
      ...filterOptions,
      type: event.target.value
    };
    handleFilterChange(newOptions);
  }}
>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="item">Items Only</MenuItem>
              <MenuItem value="treatment">Treatments Only</MenuItem>
            </Select>
          </FormControl>
          <Button 
            startIcon={<Refresh />} 
            onClick={applyFilters}
            variant="outlined"
            size="small"
          >
            Apply Filters
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
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => (
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
      {error && (
  <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
    </div>
  );
};

export default InventoryComponent;
