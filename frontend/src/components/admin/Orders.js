import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, CircularProgress, Alert, IconButton, Checkbox
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const Orders = () => {
    const [orders, setOrders] = useState([]);
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
                options.headers['Authorization'] = ` # Bearer ${token}`;
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
        const fetchOrders = async () => {
            if (!isAdmin) return;
            try {
                const response = await makeAuthenticatedRequest('http://localhost:8000/api/orders/', {
                    method: 'GET',
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }
                const data = await response.json();
                setOrders(data);
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
        fetchOrders();
    }, [isAdmin, navigate, makeAuthenticatedRequest]);

    const handleToggleDelivered = async (orderId, isDelivered) => {
        try {
            const response = await makeAuthenticatedRequest(
                `http://localhost:8000/api/orders/${orderId}/delivery/`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_delivered: !isDelivered }),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update delivery status');
            }
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, is_delivered: !isDelivered } : order
            ));
            setMessage('Delivery status updated successfully');
        } catch (error) {
            setMessage(error.message);
        }
    };

    const handleViewDetails = (orderId) => {
        navigate(`/admin/orders/${orderId}`);
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
                Orders
            </Typography>
            {message && (
                <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mb: 3 }}>
                    {message}
                </Alert>
            )}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Order ID
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                User Email
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                User Name
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Location
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Delivery Method
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Date
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Delivered
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {order.id}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {order.user.email}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {`${order.user.first_name} ${order.user.last_name}`.trim()}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {order.location || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {order.delivery_method || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        ${order.total ? Number(order.total).toFixed(2) : 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={order.is_delivered}
                                            onChange={() => handleToggleDelivered(order.id, order.is_delivered)}
                                            sx={{ color: vintageColors.accent }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleViewDetails(order.id)} sx={{ color: vintageColors.accent }}>
                                            <VisibilityIcon />
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

export default Orders;