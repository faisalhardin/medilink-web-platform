// src/pages/Inventory.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, TextField, IconButton, Typography, Box, FormControl, InputLabel,
  Select, MenuItem, Chip, Grid, Card, CardContent, SelectChangeEvent,
  Alert
} from "@mui/material";
import {
  Add, Edit, Delete, FilterList, Search,
  Warning, Inventory as InventoryIcon, ShoppingCart, AttachMoney
} from "@mui/icons-material";
import { useModal } from "../context/ModalContext";
import InventoryForm from "../components/InventoryForm";
import { Product } from "@models/product";
import { InsertProduct, ListProducts } from "@requests/products";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { formatPrice } from "@utils/common";


const InventoryComponent = () => {
  const { openModal } = useModal();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("name") || "";
  });

  // Initialize state from URL parameters
  const [filterOptions, setFilterOptions] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    return {
      showLowStock: queryParams.get("lowStock") === "true",
      type: queryParams.get("type") || "item", // "all", "item", "treatment"
      page: parseInt(queryParams.get("page") || "1", 10),
      limit: parseInt(queryParams.get("limit") || "9", 10), // Default to 9 if not in URL
    };
  });

  // Create a debounced version of the search handler
  const debouncedUpdateSearchQuery = useCallback(
    debounce((value: string) => {
      // Update URL with search parameter
      const params = new URLSearchParams(location.search);
      if (value) {
        params.set('name', value);
      } else {
        params.delete('name');
      }
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }, 300), // 300ms delay
    [location.search, navigate]
  );
  
  // Effect to sync state to URL and fetch data whenever state changes
  useEffect(() => {
    const fetchAndSync = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

      // Sync state to URL
      const urlParams = new URLSearchParams();
      if (searchQuery) urlParams.set("name", searchQuery);
      if (filterOptions.showLowStock) urlParams.set("lowStock", "true");
      // Only add type, page, and limit to URL if they are not the default values
      if (filterOptions.type !== "item") urlParams.set("type", filterOptions.type);
      if (filterOptions.page !== 1) urlParams.set("page", filterOptions.page.toString());
      if (filterOptions.limit !== 9) urlParams.set("limit", filterOptions.limit.toString());


      // Use replace to avoid adding to history stack for filter changes
      navigate(
        {
          pathname: location.pathname,
          search: urlParams.toString()
        },
        { replace: true }
      );

      // Fetch products
      try {
        const params: Record<string, any> = {};
        if (searchQuery) params.name = searchQuery;
        if (filterOptions.showLowStock) params.lowStock = "true";
        if (filterOptions.type === "item") {
          params.is_item = true;
          params.is_treatment = false;
        } else if (filterOptions.type === "treatment") {
          params.is_item = false;
          params.is_treatment = true;
        }
        // Note: "all" type means neither is_item nor is_treatment is set

        params.page = filterOptions.page;
        params.limit = filterOptions.limit;

        console.log("Fetching with params:", params); // Debug log

        const productResponse = await ListProducts(params);
        setProducts(productResponse as Product[]);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchAndSync();

  }, [searchQuery, filterOptions, navigate, location.pathname]);

  // Handle adding a new product
  const handleAddProduct = async (newProduct: Omit<Product, "id">) => {
    await InsertProduct(newProduct);
    // After adding, refetch products based on current filters
    // The useEffect will handle the fetch when state changes, but we need to trigger a state change or refetch manually
    // A simple way is to refetch directly after adding
    // Alternatively, if the API returns the new product, you could add it to the state
    // For simplicity, let's refetch all based on current filters
    const params: Record<string, any> = {};
    if (searchQuery) params.name = searchQuery;
    if (filterOptions.showLowStock) params.lowStock = "true";
    if (filterOptions.type === "item") {
      params.is_item = true;
      params.is_treatment = false;
    } else if (filterOptions.type === "treatment") {
      params.is_item = false;
      params.is_treatment = true;
    }
    params.page = filterOptions.page;
    params.limit = filterOptions.limit;
    setLoading(true);
    try {
      const productResponse = await ListProducts(params);
      setProducts(productResponse.data as Product[]);
    } catch (error) {
      console.error("Error refetching products after add:", error);
      setError("Failed to refresh products after adding");
    } finally {
      setLoading(false);
    }
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
    const value = e.target.value;
    setSearchQuery(value);
  };

  // Handle filter changes
  const handleFilterChange = (newOptions: typeof filterOptions) => {
    setFilterOptions(newOptions);
  };
  
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
              <AttachMoney fontSize="large" className="text-emerald-600 text-3xl mb-2" />
              <Typography variant="h5" className="font-bold">{formatPrice(inventoryValue)}</Typography>
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
        </Box>
      </Box>
      
      {/* Products Table */}
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper} className="shadow-md">
        <Table>
          <TableHead className="bg-white">
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
            ): products?.length === 0 ?  (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
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
                  <TableCell>{formatPrice(product.price || 0)}</TableCell>
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
