import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import Cookies from 'js-cookie';

const PurchaseHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('PurchaseHistory component mounted'); // Debug
        const fetchOrders = async () => {
            const token = Cookies.get('access');
            console.log('Token in PurchaseHistory:', token); // Debug
            if (!token) {
                console.log('No token found, will redirect to /');
                setError('No authentication token found');
                setTimeout(() => {
                    navigate('/');
                }, 1000); // Delay for debugging
                return;
            }
            try {
                console.log('Fetching /api/orders/'); // Debug
                const response = await fetch('http://localhost:8000/api/orders/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                console.log('Response status:', response.status); // Debug
                if (!response.ok) {
                    throw new Error(`Failed to fetch orders: ${response.status}`);
                }
                const data = await response.json();
                console.log('Fetched orders:', data); // Debug
                setOrders(data);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [navigate]);

    if (loading) return <Typography>Loading purchase history...</Typography>;
    if (error) return <Typography color="error">Error: {error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Your Purchase History
            </Typography>
            {orders.length === 0 ? (
                <Typography>No purchases yet.</Typography>
            ) : (
                orders.map((order) => (
                    <Box key={order.id} sx={{ mb: 2, border: '1px solid #ddd', p: 2 }}>
                        <Typography variant="h6">
                            Order #{order.id} - {new Date(order.created_at).toLocaleString()}
                        </Typography>
                        <Typography>Total: ${order.total}</Typography>
                        <List>
                            {(order.items || []).map((item) => (
                                <ListItem key={item.id}>
                                    <ListItemText
                                        primary={item.product?.name || 'Unknown Product'}
                                        secondary={`Qty: ${item.quantity} - $${item.price_at_time} (Size: ${item.product?.size || 'N/A'})`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                ))
            )}
        </Box>
    );
};

export default PurchaseHistory;