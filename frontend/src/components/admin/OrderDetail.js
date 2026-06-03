import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, CircularProgress, Alert, Button, Checkbox, FormControlLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const OrderDetail = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    const refreshToken = useCallback(async () => {
        const refresh = Cookies.get('refresh');
        if (!refresh) {
            throw new Error('No refresh token available. Please log in again.');
        }
        const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const fetchOrder = async () => {
            if (!isAdmin) return;
            try {
                const response = await makeAuthenticatedRequest(`http://localhost:8000/api/orders/`, {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch order');
                }
                const data = await response.json();
                const selectedOrder = data.find(o => o.id === parseInt(orderId));
                if (!selectedOrder) {
                    throw new Error('Order not found');
                }
                setOrder(selectedOrder);
            } catch (error) {
                setMessage(error.message);
                if (error.message.includes('Session expired')) {
                    Cookies.remove('access');
                    Cookies.remove('refresh');
                    Cookies.remove('role');
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [isAdmin, orderId, navigate, makeAuthenticatedRequest]);

    const handleToggleDelivered = async () => {
        try {
            const response = await makeAuthenticatedRequest(
                `http://localhost:8000/api/orders/${orderId}/delivery/`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_delivered: !order.is_delivered }),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update delivery status');
            }
            setOrder({ ...order, is_delivered: !order.is_delivered });
            setMessage('Delivery status updated successfully');
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{message || 'Order not found'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}
            >
                Order #{order.id}
            </Typography>
            {message && (
                <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif" }}>
                    User Information
                </Typography>
                <Typography>Email: {order.user.email}</Typography>
                <Typography>Name: {`${order.user.first_name} ${order.user.last_name}`.trim()}</Typography>
                <Typography>Location: {order.location || 'N/A'}</Typography>
            </Paper>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif" }}>
                    Order Details
                </Typography>
                <Typography>Date: {new Date(order.created_at).toLocaleDateString()}</Typography>
                <Typography>Total: ${order.total ? Number(order.total).toFixed(2) : 'N/A'}</Typography>
                <Typography>Delivery Method: {order.delivery_method || 'N/A'}</Typography>
                <Typography>Payment Status: {order.payment_status}</Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={order.is_delivered}
                            onChange={handleToggleDelivered}
                            sx={{ color: vintageColors.accent }}
                        />
                    }
                    label="Delivered"
                    sx={{ mt: 2 }}
                />
            </Paper>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: "'Playfair Display', serif" }}>
                    Purchased Products
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontFamily: "'Playfair Display', serif" }}>Product</TableCell>
                                <TableCell sx={{ fontFamily: "'Playfair Display', serif" }}>Quantity</TableCell>
                                <TableCell sx={{ fontFamily: "'Playfair Display', serif" }}>Price</TableCell>
                                <TableCell sx={{ fontFamily: "'Playfair Display', serif" }}>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {order.items && order.items.length > 0 ? (
                                order.items.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.product.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>${Number(item.price_at_time).toFixed(2)}</TableCell>
                                        <TableCell>${(item.quantity * Number(item.price_at_time)).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4}>No items found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <Button
                variant="contained"
                onClick={() => navigate('/admin/orders')}
                sx={{ mt: 3, backgroundColor: vintageColors.accent }}
            >
                Back to Orders
            </Button>
        </Box>
    );
};

export default OrderDetail;