import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { vintageColors } from '../../Theme';

const AddProduct = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        newCategory: '',
        stock: '',
        size: 'M',
        images: [],
    });
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [addNewCategory, setAddNewCategory] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    const refreshToken = useCallback(async () => {
        const refresh = Cookies.get('refresh');
        if (!refresh) {
            throw new Error('No refresh token available. Please log in again.');
        }

        const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        Cookies.set('access', data.access, { expires: 7 });
        return data.access;
    }, []);

    const makeAuthenticatedRequest = useCallback(async (url, options) => {
        let token = Cookies.get('access');
        if (!token) {
            throw new Error('No token found, please log in');
        }

        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };

        try {
            let response = await fetch(url, options);

            if (response.status === 401) {
                try {
                    token = await refreshToken();
                    options.headers['Authorization'] = `Bearer ${token}`;
                    response = await fetch(url, options);
                } catch (error) {
                    throw new Error('Session expired. Please log in again.');
                }
            }

            return response;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to the server. Please ensure the backend server is running.');
            }
            throw error;
        }
    }, [refreshToken]);

    useEffect(() => {
        const token = Cookies.get('access');
        const role = Cookies.get('role');

        if (!token) {
            setMessage('Please log in to access this page.');
            navigate('/');
            return;
        }

        if (role !== 'admin') {
            setMessage('You do not have permission to access this page.');
            navigate('/home');
            return;
        }

        setIsAdmin(true);
    }, [navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!isAdmin) return;

            try {
                const response = await makeAuthenticatedRequest('http://localhost:8000/api/categories/', {
                    method: 'GET',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch categories: ${errorText}`);
                }
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                setMessage('Error fetching categories: ' + error.message);
                if (error.message.includes('Session expired')) {
                    Cookies.remove('access');
                    Cookies.remove('refresh');
                    Cookies.remove('role');
                    navigate('/');
                }
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [isAdmin, navigate, makeAuthenticatedRequest]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!isAdmin) return;

            try {
                const response = await makeAuthenticatedRequest('http://localhost:8000/api/products/', {
                    method: 'GET',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch products: ${errorText}`);
                }
                const data = await response.json();
                const convertedData = data.map(product => ({
                    ...product,
                    price: Number(product.price),
                    stock: Number(product.stock),
                }));
                setProducts(convertedData);
            } catch (error) {
                setMessage('Error fetching products: ' + error.message);
                if (error.message.includes('Session expired')) {
                    Cookies.remove('access');
                    Cookies.remove('refresh');
                    Cookies.remove('role');
                    navigate('/');
                }
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [isAdmin, navigate, makeAuthenticatedRequest]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleToggleAddCategory = (e) => {
        setAddNewCategory(e.target.checked);
        setFormData(prev => ({ ...prev, category: '', newCategory: '' }));
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png'];
        const validFiles = files.filter(file => {
            if (file.size > maxFileSize) {
                setMessage(`File ${file.name} exceeds 5MB limit`);
                return false;
            }
            if (!allowedTypes.includes(file.type)) {
                setMessage(`File ${file.name} is not a valid image (JPEG/PNG only)`);
                return false;
            }
            return true;
        });
        console.log('Dropped files:', validFiles.map(f => f.name));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png'];
        const validFiles = files.filter(file => {
            if (file.size > maxFileSize) {
                setMessage(`File ${file.name} exceeds 5MB limit`);
                return false;
            }
            if (!allowedTypes.includes(file.type)) {
                setMessage(`File ${file.name} is not a valid image (JPEG/PNG only)`);
                return false;
            }
            return true;
        });
        console.log('Selected files:', validFiles.map(f => f.name));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    };

    const removeImage = (index) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async () => {
        // For new products, require all fields
        if (!editingProductId) {
            if (!formData.name || !formData.description || !formData.price || !formData.stock || formData.images.length === 0 || !formData.size) {
                setMessage('Please fill in all fields, select a size, and add at least one image');
                return;
            }
            if (addNewCategory && !formData.newCategory) {
                setMessage('Please enter a new category name');
                return;
            }
            if (!addNewCategory && !formData.category) {
                setMessage('Please select a category');
                return;
            }
        }

        // For updates, allow partial data, but ensure at least one field is provided
        if (editingProductId) {
            const hasChanges = formData.name || formData.description || formData.price || formData.stock || formData.size || formData.category || formData.images.length > 0;
            if (!hasChanges) {
                setMessage('Please update at least one field');
                return;
            }
        }

        setLoadingSubmit(true);
        setMessage('');

        try {
            let categoryId = formData.category;
            if (addNewCategory && formData.newCategory) {
                const categoryResponse = await makeAuthenticatedRequest('http://localhost:8000/api/categories/add/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: formData.newCategory }),
                });
                if (!categoryResponse.ok) {
                    const errorText = await categoryResponse.text();
                    throw new Error(`Error creating category: ${errorText}`);
                }
                const categoryData = await categoryResponse.json();
                categoryId = categoryData.category.id;
                setCategories(prev => [...prev, categoryData.category]);
            }

            const productData = {};
            if (formData.name) productData.name = formData.name;
            if (formData.description) productData.description = formData.description;
            if (formData.price) {
                const price = Number(formData.price);
                if (isNaN(price) || price < 0) {
                    throw new Error('Price must be a valid positive number');
                }
                productData.price = price.toFixed(2);
            }
            if (categoryId) {
                const parsedCategoryId = parseInt(categoryId, 10);
                if (isNaN(parsedCategoryId)) {
                    throw new Error('Category ID must be a valid number');
                }
                productData.category_id = parsedCategoryId;
            }
            if (formData.stock) {
                const stock = Number(formData.stock);
                if (isNaN(stock) || stock < 0) {
                    throw new Error('Stock must be a valid positive integer');
                }
                productData.stock = stock;
            }
            if (formData.size) productData.size = formData.size;

            console.log("Submitting product data:", JSON.stringify(productData, null, 2));

            let response;
            if (editingProductId) {
                response = await makeAuthenticatedRequest(`http://localhost:8000/api/products/${editingProductId}/update/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });
            } else {
                response = await makeAuthenticatedRequest('http://localhost:8000/api/products/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productData),
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend error response:", errorText);
                throw new Error(`Error ${editingProductId ? 'updating' : 'adding'} product: ${errorText}`);
            }

            const productResponse = await response.json();
            console.log("Product creation/update response:", productResponse);
            const productId = editingProductId || productResponse.id;

            if (formData.images.length > 0) {
                console.log("Uploading images:", formData.images.map(img => img.name));
                const imageUploadPromises = formData.images.map(async (image, index) => {
                    const imageFormData = new FormData();
                    imageFormData.append('image', image);
                    imageFormData.append('position', index);
                    console.log(`Uploading image ${index + 1}: ${image.name}`);
                    const imageResponse = await makeAuthenticatedRequest(`http://localhost:8000/api/products/${productId}/add-image/`, {
                        method: 'POST',
                        body: imageFormData,
                    });
                    if (!imageResponse.ok) {
                        const errorText = await imageResponse.text();
                        console.error(`Image ${index + 1} upload error:`, errorText);
                        throw new Error(`Error uploading image ${index + 1}: ${errorText}`);
                    }
                    const imageData = await imageResponse.json();
                    console.log(`Image ${index + 1} uploaded successfully:`, imageData);
                    return imageData;
                });

                await Promise.all(imageUploadPromises);
                console.log("All images uploaded successfully");
            }

            setMessage(`${editingProductId ? 'Product updated' : 'Product added'} successfully`);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: '',
                newCategory: '',
                stock: '',
                size: 'M',
                images: [],
            });
            setAddNewCategory(false);
            setEditingProductId(null);
            setShowForm(false);

            const productsResponse = await makeAuthenticatedRequest('http://localhost:8000/api/products/', {
                method: 'GET',
            });
            if (productsResponse.ok) {
                const data = await productsResponse.json();
                console.log("Fetched products after update:", data);
                const convertedData = data.map(product => ({
                    ...product,
                    price: Number(product.price),
                    stock: Number(product.stock),
                }));
                setProducts(convertedData);
            } else {
                const errorText = await productsResponse.text();
                throw new Error(`Error fetching products after update: ${errorText}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            setMessage(error.message || 'Internal server error');
            if (error.message.includes('Session expired')) {
                Cookies.remove('access');
                Cookies.remove('refresh');
                Cookies.remove('role');
                navigate('/');
            }
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price != null ? product.price.toString() : '',
            category: product.category?.id ? product.category.id.toString() : '',
            newCategory: '',
            stock: product.stock != null ? product.stock.toString() : '',
            size: product.size || 'M',
            images: [],
        });
        setEditingProductId(product.id);
        setShowForm(true);
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const response = await makeAuthenticatedRequest(`http://localhost:8000/api/products/${productId}/delete/`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error deleting product: ${errorText}`);
            }
            setMessage('Product deleted successfully');
            setProducts(products.filter(product => product.id !== productId));
        } catch (error) {
            setMessage(error.message || 'Internal server error');
            if (error.message.includes('Session expired')) {
                Cookies.remove('access');
                Cookies.remove('refresh');
                Cookies.remove('role');
                navigate('/');
            }
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: '',
            newCategory: '',
            stock: '',
            size: 'M',
            images: [],
        });
        setAddNewCategory(false);
        setEditingProductId(null);
        setShowForm(false);
        setMessage('');
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: vintageColors.textPrimary,
                }}
            >
                Manage Products
            </Typography>
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={() => setShowForm(true)}
                    sx={{
                        borderRadius: '25px',
                        padding: '12px 32px',
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 600,
                        textTransform: 'none',
                        bgcolor: vintageColors.accent,
                        color: vintageColors.textPrimary,
                        '&:hover': { bgcolor: vintageColors.textSecondary },
                    }}
                >
                    Add New Product
                </Button>
            </Box>
            {message && (
                <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3, width: '100%' }}>
                    {message}
                </Alert>
            )}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Description
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Price
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Category
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Stock
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Size
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Image
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingProducts ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.name}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.description}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        ${isNaN(Number(product.price)) ? "N/A" : Number(product.price).toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.category?.name || 'Uncategorized'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.stock}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.size}
                                    </TableCell>
                                    <TableCell>
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0].product_image.image.startsWith('http')
                                                    ? product.images[0].product_image.image
                                                    : `http://localhost:8000${product.images[0].product_image.image}`}
                                                alt={product.name}
                                                style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '4px' }}
                                            />
                                        ) : (
                                            <Typography variant="body2" sx={{ color: vintageColors.textSecondary }}>
                                                No image
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(product)} sx={{ color: vintageColors.accent }}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(product.id)} sx={{ color: vintageColors.accent }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={showForm} onClose={handleCancel} maxWidth="sm" fullWidth>
                <DialogTitle
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                    }}
                >
                    {editingProductId ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        {editingProductId && products.find(p => p.id === editingProductId)?.images?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: vintageColors.textPrimary,
                                        fontWeight: 500,
                                    }}
                                >
                                    Current Images
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {products.find(p => p.id === editingProductId).images.map((img, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                position: 'relative',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                transition: 'transform 0.3s ease',
                                                '&:hover': { transform: 'scale(1.05)' },
                                            }}
                                        >
                                            <img
                                                src={img.product_image.image.startsWith('http')
                                                    ? img.product_image.image
                                                    : `http://localhost:8000${img.product_image.image}`}
                                                alt={`Current ${index}`}
                                                style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <Box
                            sx={{
                                padding: 3,
                                border: dragOver ? `2px dashed ${vintageColors.accent}` : '2px dashed #ccc',
                                backgroundColor: dragOver ? vintageColors.background : '#fff',
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderRadius: '12px',
                                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                                transition: 'background-color 0.3s ease, border-color 0.3s ease',
                                '&:hover': { backgroundColor: '#f5f5f5' },
                            }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                    fontWeight: 500,
                                }}
                            >
                                {editingProductId ? 'Add New Images (optional)' : 'Drag and drop images (JPEG/PNG, max 5MB) or click to select'}
                            </Typography>
                            <input
                                id="fileInput"
                                type="file"
                                multiple
                                accept="image/jpeg,image/png"
                                onChange={handleFileInput}
                                style={{ display: 'none' }}
                            />
                        </Box>
                        {formData.images.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {formData.images.map((img, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                            transition: 'transform 0.3s ease',
                                            '&:hover': { transform: 'scale(1.05)' },
                                        }}
                                    >
                                        <img
                                            src={URL.createObjectURL(img)}
                                            alt={`Preview ${index}`}
                                            style={{ width: '150px', height: '150px', objectFit: 'contain' }}
                                        />
                                        <IconButton
                                            onClick={() => removeImage(index)}
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: '4px',
                                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                                color: '#fff',
                                                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
                                            }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        <TextField
                            name="name"
                            label="Product Name"
                            value={formData.name}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            required={!editingProductId}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    '&:hover fieldset': { borderColor: vintageColors.accent },
                                },
                                '& .MuiInputLabel-root': {
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    color: vintageColors.textSecondary,
                                },
                            }}
                        />
                        <TextField
                            name="description"
                            label="Description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            multiline
                            rows={4}
                            required={!editingProductId}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    '&:hover fieldset': { borderColor: vintageColors.accent },
                                },
                                '& .MuiInputLabel-root': {
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    color: vintageColors.textSecondary,
                                },
                            }}
                        />
                        <TextField
                            name="price"
                            label="Price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            required={!editingProductId}
                            inputProps={{ min: 15.99, step: '0.01' }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    '&:hover fieldset': { borderColor: vintageColors.accent },
                                },
                                '& .MuiInputLabel-root': {
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    color: vintageColors.textSecondary,
                                },
                            }}
                        />
                        <FormControlLabel
                            control={<Switch checked={addNewCategory} onChange={handleToggleAddCategory} sx={{ color: vintageColors.accent }} />}
                            label="Add New Category"
                            sx={{
                                color: vintageColors.textSecondary,
                                fontFamily: "'Playfair Display', serif",
                                fontWeight: 500,
                            }}
                        />
                        {addNewCategory ? (
                            <TextField
                                name="newCategory"
                                label="New Category Name"
                                value={formData.newCategory}
                                onChange={handleChange}
                                fullWidth
                                variant="outlined"
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        backgroundColor: '#fff',
                                        '&:hover fieldset': { borderColor: vintageColors.accent },
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontFamily: "'Playfair Display', serif",
                                        color: vintageColors.textSecondary,
                                    },
                                    '& .MuiInputBase-input': {
                                        color: vintageColors.textSecondary,
                                    },
                                }}
                            />
                        ) : (
                            <Box sx={{ position: 'relative' }}>
                                {loadingCategories && (
                                    <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)' }} />
                                )}
                                <FormControl fullWidth>
                                    <InputLabel
                                        sx={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: vintageColors.textSecondary,
                                        }}
                                    >
                                        Select Category
                                    </InputLabel>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        variant="outlined"
                                        disabled={loadingCategories}
                                        required={!editingProductId}
                                        sx={{
                                            borderRadius: '8px',
                                            backgroundColor: '#fff',
                                            '& .MuiSelect-select': {
                                                padding: '10px 14px',
                                                color: vintageColors.textSecondary,
                                                fontFamily: "'Playfair Display', serif",
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: vintageColors.accent,
                                            },
                                        }}
                                    >
                                        <MenuItem value="" disabled>
                                            Select Category
                                        </MenuItem>
                                        {categories.map(category => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}
                        <TextField
                            name="stock"
                            label="Stock"
                            type="number"
                            value={formData.stock}
                            onChange={handleChange}
                            fullWidth
                            variant="outlined"
                            required={!editingProductId}
                            inputProps={{ min: 0 }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    '&:hover fieldset': { borderColor: vintageColors.accent },
                                },
                                '& .MuiInputLabel-root': {
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                },
                                '& .MuiInputBase-input': {
                                    color: vintageColors.textSecondary,
                                },
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel
                                sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textSecondary,
                                }}
                            >
                                Size
                            </InputLabel>
                            <Select
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                variant="outlined"
                                required={!editingProductId}
                                sx={{
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    '& .MuiSelect-select': {
                                        padding: '10px 14px',
                                        color: vintageColors.textSecondary,
                                        fontFamily: "'Playfair Display', serif",
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: vintageColors.accent,
                                    },
                                }}
                            >
                                <MenuItem value="S">Small</MenuItem>
                                <MenuItem value="M">Medium</MenuItem>
                                <MenuItem value="L">Large</MenuItem>
                                <MenuItem value="XL">Extra Large</MenuItem>
                                <MenuItem value="XXL">Double Extra Large</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCancel}
                        variant="outlined"
                        sx={{
                            borderColor: vintageColors.accent,
                            color: vintageColors.accent,
                            fontFamily: "'Playfair Display', serif",
                            borderRadius: '25px',
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loadingSubmit}
                        variant="contained"
                        sx={{
                            borderRadius: '25px',
                            padding: '12px 32px',
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 600,
                            textTransform: 'none',
                            bgcolor: vintageColors.accent,
                            color: vintageColors.textPrimary,
                            '&:hover': { bgcolor: vintageColors.textSecondary },
                        }}
                    >
                        {loadingSubmit ? <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} /> : editingProductId ? 'Update Product' : 'Add Product'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AddProduct;