// src/components/InventoryEditForm.tsx
import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  InputAdornment,
  Typography,
  Grid,
  Divider,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useModal } from '../context/ModalContext';
import { Product } from '@models/product';
import { UNIT_TYPE_OPTIONS } from 'constants/constants';

interface InventoryEditFormProps {
  product: Product;
  onSubmit: (product: Partial<Product>) => void;
  onCancel: () => void;
}

const InventoryEditForm: React.FC<InventoryEditFormProps> = ({ product, onSubmit, onCancel }) => {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState({
    id: product.id || 0,
    name: product.name || '',
    price: product.price?.toString() || '',
    is_item: product.is_item || false,
    is_treatment: product.is_treatment || false,
    unit_type: product.unit_type || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(() => {
    return UNIT_TYPE_OPTIONS.filter(option => 
      option.type === (product.is_item ? 'item' : 'treatment')
    );
  });
  const inputRef = useRef<HTMLDivElement>(null);

  // Get the appropriate unit options based on product type
  const getUnitOptions = () => {
    return UNIT_TYPE_OPTIONS.filter(option => 
      option.type === (formData.is_item ? 'item' : 'treatment')
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      
      // Clear error when field is edited
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      is_item: value === 'item',
      is_treatment: value === 'treatment',
      unit_type: '', // Clear unit type when switching product type
    }));
    
    // Update filtered options based on new product type
    const newOptions = getUnitOptions();
    setFilteredOptions(newOptions);
    
    // Clear errors when type is changed
    if (errors.unit_type) {
      setErrors((prev) => ({ ...prev, unit_type: '' }));
    }
  };

  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, unit_type: value }));
    
    // Filter options based on input and product type
    const currentOptions = getUnitOptions();
    const filtered = currentOptions.filter(option => 
      option.label.toLowerCase().includes(value.toLowerCase()) ||
      option.value.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
    setShowRecommendations(value.length > 0 && filtered.length > 0);
    
    // Clear error when field is edited
    if (errors.unit_type) {
      setErrors((prev) => ({ ...prev, unit_type: '' }));
    }
  };

  const handleRecommendationClick = (option: { value: string; label: string }) => {
    setFormData((prev) => ({ ...prev, unit_type: option.value }));
    setShowRecommendations(false);
  };

  const handleUnitTypeFocus = () => {
    const unitType = formData.unit_type ?? '';
    if (unitType.length > 0) {
      const currentOptions = getUnitOptions();
      const filtered = currentOptions.filter(option => 
        option.label.toLowerCase().includes(unitType.toLowerCase()) ||
        option.value.toLowerCase().includes(unitType.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowRecommendations(filtered.length > 0);
    } else {
      const currentOptions = getUnitOptions();
      setFilteredOptions(currentOptions);
      setShowRecommendations(true);
    }
  };

  const handleUnitTypeBlur = () => {
    // Delay hiding recommendations to allow clicks on items
    setTimeout(() => {
      setShowRecommendations(false);
    }, 200);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a number';
    }
    
    if (!formData.unit_type || !formData.unit_type.trim()) {
      newErrors.unit_type = 'Unit type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const updatedProduct = {
        id: formData.id,
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        is_item: formData.is_item,
        is_treatment: formData.is_treatment,
        unit_type: formData.unit_type,
      };
      onSubmit(updatedProduct);
      closeModal();
    }
  };

  const handleCancel = () => {
    onCancel();
    closeModal();
  };

  // Determine the selected radio value
  const selectedType = formData.is_item ? 'item' : formData.is_treatment ? 'treatment' : '';

  return (
    <div className="p-2">
      <Typography variant="h6" className="mb-4 font-semibold">
        Edit Product Information
      </Typography>
      <Divider className="mb-4" />
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={!!errors.price}
              helperText={errors.price}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box position="relative">
              <TextField
                fullWidth
                label="Unit Type"
                name="unit_type"
                value={formData.unit_type}
                onChange={handleUnitTypeChange}
                onFocus={handleUnitTypeFocus}
                onBlur={handleUnitTypeBlur}
                error={!!errors.unit_type}
                helperText={errors.unit_type}
                placeholder={`Type unit type (${formData.is_item ? 'e.g., piece, box' : 'e.g., session, hour'})`}
                ref={inputRef}
                required
              />
              {showRecommendations && (
                <Paper
                  elevation={3}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: 200,
                    overflow: 'auto',
                    mt: 1,
                  }}
                >
                  <List dense>
                    {filteredOptions.map((option, index) => (
                      <ListItem
                        key={index}
                        button
                        onClick={() => handleRecommendationClick(option)}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <ListItemText primary={option.label} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" className="text-gray-700 font-medium mb-2">
                Product Type
              </FormLabel>
              <RadioGroup
                value={selectedType}
                onChange={handleRadioChange}
                row
                className="gap-4"
              >
                <FormControlLabel
                  value="item"
                  control={<Radio color="primary" />}
                  label="Physical Item"
                  className="border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
                />
                <FormControlLabel
                  value="treatment"
                  control={<Radio color="primary" />}
                  label="Treatment/Service"
                  className="border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box className="flex justify-end mt-6 space-x-2">
          <Button 
            variant="outlined" 
            onClick={handleCancel}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Update Product
          </Button>
        </Box>
      </form>
    </div>
  );
};

export default InventoryEditForm;