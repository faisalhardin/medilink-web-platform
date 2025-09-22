// src/components/AddInventoryForm.tsx
import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
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

const UNIT_TYPE_OPTIONS = [
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'pack', label: 'Pack' },
  { value: 'vial', label: 'Vial' },
  { value: 'ampule', label: 'Ampule' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'l', label: 'Liter (L)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogram (kg)' }
];

interface InventoryFormProps {
  onSubmit: (product: any) => void;
  onCancel: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ onSubmit, onCancel }) => {
  const { closeModal } = useModal();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    is_item: true,
    is_treatment: false,
    quantity: '',
    unit_type: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(UNIT_TYPE_OPTIONS);
  const inputRef = useRef<HTMLDivElement>(null);

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


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, unit_type: value }));
    
    // Filter options based on input
    const filtered = UNIT_TYPE_OPTIONS.filter(option => 
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
    if (formData.unit_type.length > 0) {
      const filtered = UNIT_TYPE_OPTIONS.filter(option => 
        option.label.toLowerCase().includes(formData.unit_type.toLowerCase()) ||
        option.value.toLowerCase().includes(formData.unit_type.toLowerCase())
      );
      setFilteredOptions(filtered);
      setShowRecommendations(filtered.length > 0);
    } else {
      setFilteredOptions(UNIT_TYPE_OPTIONS);
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Price must be a number';
    }
    
    if (formData.is_item) {
      if (!formData.quantity.trim()) {
        newErrors.quantity = 'Quantity is required for items';
      } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
        newErrors.quantity = 'Quantity must be a positive number';
      }
    }
    
    if (!formData.unit_type.trim() && formData.is_item) {
      newErrors.unit_type = 'Unit type is required for items';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const product = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        quantity: parseInt(formData.quantity, 10),
      };
      onSubmit(product);

      closeModal();
    }
  };

  const handleCancel = () => {
    onCancel();
    closeModal();
  };

  return (
    <div className="p-2">
      <Typography variant="h6" className="mb-4 font-semibold">
        Add New Inventory Item
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
          
          {formData.is_item && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              type="number"
              required={formData.is_item}
              error={!!errors.quantity}
              helperText={errors.quantity}
              disabled={!formData.is_item}
            />
          </Grid>
          )}
          
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
                placeholder="Type unit type"
                ref={inputRef}
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
          
          <Grid item xs={12} sm={6}>
            <Box className="flex flex-col space-y-2 h-full justify-center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_item}
                    onChange={handleCheckboxChange}
                    name="is_item"
                  />
                }
                label="Is Physical Item"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_treatment}
                    onChange={handleCheckboxChange}
                    name="is_treatment"
                  />
                }
                label="Is Treatment"
              />
            </Box>
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
            Add Product
          </Button>
        </Box>
      </form>
    </div>
  );
};

export default InventoryForm;
