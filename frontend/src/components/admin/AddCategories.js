import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, IconButton
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const AddCategories = () => {
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState('');
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
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
                    throw new Error('Failed to fetch categories');
                }

                const data = await response.json();
                setCategories(data);
            } catch (error) {
                setMessage(error.message);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!categoryName) {
            setMessage('Please enter a category name');
            return;
        }

        if (!isAdmin) {
            setMessage('Please log in as an admin to add a category.');
            navigate('/');
            return;
        }

        setLoadingSubmit(true);
        setMessage('');

        try {
            console.log('Adding category with data:', { name: categoryName });
            const response = await makeAuthenticatedRequest('http://localhost:8000/api/categories/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: categoryName }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.log('Server error response:', errorData);
                throw new Error(errorData.error || 'Error adding category');
            }

            const data = await response.json();
            setCategories(prev => [...prev, data.category]);
            setCategoryName('');
            setMessage('Category added successfully');
        } catch (error) {
            setMessage(error.message || 'Internal server error');
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        if (!isAdmin) {
            setMessage('Please log in as an admin to delete a category.');
            navigate('/');
            return;
        }

        try {
            const response = await makeAuthenticatedRequest(`http://localhost:8000/api/categories/delete/${categoryId}/`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error deleting category');
            }

            setMessage('Category deleted successfully');
            setCategories(categories.filter(category => category.id !== categoryId));
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
                Manage Categories
            </Typography>

            <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        label="Category Name"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                backgroundColor: '#fff',
                                '&:hover fieldset': {
                                    borderColor: vintageColors.accent,
                                },
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
                    <Button
                        type="submit"
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
                            '&:hover': {
                                bgcolor: vintageColors.textSecondary,
                            },
                            '&.Mui-disabled': {
                                bgcolor: '#cccccc',
                                color: '#666666',
                            },
                        }}
                    >
                        {loadingSubmit ? <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} /> : 'Add Category'}
                    </Button>
                </Box>
            </form>

            {message && (
                <Alert
                    severity={message.includes('successfully') ? 'success' : 'error'}
                    sx={{ mb: 3 }}
                >
                    {message}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textPrimary,
                                }}
                            >
                                Name
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textPrimary,
                                }}
                            >
                                Slug
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: vintageColors.textPrimary,
                                }}
                            >
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingCategories ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map(category => (
                                <TableRow key={category.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {category.name}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {category.slug}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleDelete(category.id)} sx={{ color: vintageColors.accent }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AddCategories;