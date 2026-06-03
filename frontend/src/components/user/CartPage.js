import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Button,
    Alert,
} from '@mui/material';
import { apiFetch } from './api';
import { vintageColors } from '../../Theme';

const CartPage = ({ cartUpdated, onCheckout }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const fetchCart = async () => {
        try {
            const response = await apiFetch('/cart/');
            const data = await response.json();
            setCartItems(data.items || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [cartUpdated]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleRemoveFromCart = async (productId) => {
        try {
            await apiFetch('/cart/remove/', {
                method: 'POST',
                body: JSON.stringify({ product_id: productId }),
            });
            await fetchCart();
            setMessage('Item removed from cart');
            if (onCheckout) onCheckout();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch('/checkout/', {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                const totalAmount = cartItems.reduce((total, item) => {
                    return total + (item.quantity * item.product.price);
                }, 0).toFixed(2);
                await fetchCart();
                setMessage(`Checkout initiated! Proceeding to payment...`);
                if (onCheckout) onCheckout();
                // Redirect to payment page with order_id and totalAmount
                navigate('/payment', { state: { orderId: data.order_id, totalAmount: parseFloat(totalAmount) } });
            } else {
                setError(data.error || 'Checkout failed');
            }
        } catch (err) {
            setError(err.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    // Calculate total amount
    const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.quantity * item.product.price);
    }, 0).toFixed(2);

    if (loading) return <Typography sx={{ color: vintageColors.textPrimary }}>Loading cart...</Typography>;
    if (error) return <Typography sx={{ color: vintageColors.textSecondary }}>Error: {error}</Typography>;

    return (
        <Box
            sx={{
                p: 3,
                bgcolor: vintageColors.background,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                minHeight: '100vh',
            }}
        >
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: vintageColors.textPrimary,
                    textAlign: 'center',
                }}
            >
                Your Cart
            </Typography>
            {message && (
                <Alert
                    severity={message.includes('successful') || message.includes('Proceeding') ? 'success' : 'info'}
                    sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}
                >
                    {message}
                </Alert>
            )}
            {cartItems.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: vintageColors.textSecondary }}>
                    Your cart is empty
                </Typography>
            ) : (
                <Box sx={{ maxWidth: 600, mx: 'auto', bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <List>
                        {cartItems.map((item) => (
                            <ListItem
                                key={item.id}
                                secondaryAction={
                                    <Button
                                        variant="outlined"
                                        sx={{
                                            borderColor: vintageColors.textSecondary,
                                            color: vintageColors.textSecondary,
                                            borderRadius: '12px',
                                        }}
                                        size="small"
                                        onClick={() => handleRemoveFromCart(item.product.id)}
                                    >
                                        Remove
                                    </Button>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            sx={{
                                                fontFamily: "'Playfair Display', serif",
                                                color: vintageColors.textPrimary,
                                            }}
                                        >
                                            {`${item.product.name} (${item.product.size})`}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography sx={{ color: vintageColors.textSecondary }}>
                                            Quantity: {item.quantity} - ${(item.quantity * item.product.price).toFixed(2)}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: "'Playfair Display', serif",
                                color: vintageColors.textPrimary,
                                mb: 1,
                            }}
                        >
                            Total: ${totalAmount}
                        </Typography>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: vintageColors.secondary,
                                color: vintageColors.textPrimary,
                                borderRadius: '12px',
                                width: '100%',
                            }}
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            Proceed to Checkout
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default CartPage;