// src/components/AddInventoryForm.tsx
import React, { useState } from 'react';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Typography,
  Grid,
  Divider,
  Box,
  FormHelperText,
  SelectChangeEvent
} from '@mui/material';
import { useModal } from '../context/ModalContext';

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

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
    
    // Clear error when field is edited
    if (name && errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.price && isNaN(Number(formData.price))) {
      newErrors.price = 'Price must be a number';
    }
    
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be a positive number';
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
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              type="number"
              required
              error={!!errors.quantity}
              helperText={errors.quantity}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.unit_type}>
              <InputLabel id="unit-type-label">Unit Type</InputLabel>
              <Select
                labelId="unit-type-label"
                name="unit_type"
                value={formData.unit_type}
                label="Unit Type"
                onChange={handleSelectChange}
                disabled={!formData.is_item}
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="piece">Piece</MenuItem>
                <MenuItem value="box">Box</MenuItem>
                <MenuItem value="bottle">Bottle</MenuItem>
                <MenuItem value="pack">Pack</MenuItem>
                <MenuItem value="vial">Vial</MenuItem>
                <MenuItem value="ampule">Ampule</MenuItem>
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="capsule">Capsule</MenuItem>
                <MenuItem value="ml">Milliliter (ml)</MenuItem>
                <MenuItem value="l">Liter (L)</MenuItem>
                <MenuItem value="g">Gram (g)</MenuItem>
                <MenuItem value="kg">Kilogram (kg)</MenuItem>
              </Select>
              {errors.unit_type && <FormHelperText>{errors.unit_type}</FormHelperText>}
            </FormControl>
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
