import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, TextField, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiFetch } from './api';
import { vintageColors } from '../../Theme';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm = ({ orderId, totalAmount, handleSubmit }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        location: '',
        zip_code: '',
        delivery_method: '',
        payment_method: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCardSubmit = async () => {
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            // Create PaymentIntent on the backend
            const response = await apiFetch('/payment/create-intent/', {
                method: 'POST',
                body: JSON.stringify({ order_id: orderId, amount: totalAmount * 100 }), // Amount in cents
            });
            const { client_secret } = await response.json();

            // Confirm card payment with billing details
            const result = await stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        address: {
                            postal_code: formData.zip_code,
                        },
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                // Combine location and ZIP code for backend
                const combinedLocation = `${formData.location}, ${formData.zip_code}`;
                await handleSubmit({ ...formData, location: combinedLocation }, result.paymentIntent.id);
            }
        } catch (err) {
            setError(err.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" sx={{ maxWidth: 600, mx: 'auto' }}>
            <TextField
                fullWidth
                label="Delivery Address"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                helperText="Enter street address, city, and state (e.g., 123 Main St, Springfield, IL)"
            />
            <TextField
                fullWidth
                label="ZIP Code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 10 }}
                helperText="Enter your 5-digit or 9-digit ZIP code"
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Delivery Method</InputLabel>
                <Select
                    name="delivery_method"
                    value={formData.delivery_method}
                    onChange={handleChange}
                    required
                >
                    <MenuItem value="standard">Standard Shipping</MenuItem>
                    <MenuItem value="express">Express Shipping</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    required
                >
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="on_delivery">On Delivery</MenuItem>
                </Select>
            </FormControl>
            {formData.payment_method === 'card' && (
                <Box sx={{ mb: 2, p: 2, border: `1px solid ${vintageColors.textSecondary}`, borderRadius: 1 }}>
                    <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
                </Box>
            )}
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            <Button
                variant="contained"
                onClick={formData.payment_method === 'card' ? handleCardSubmit : () => {
                    const combinedLocation = `${formData.location}, ${formData.zip_code}`;
                    handleSubmit({ ...formData, location: combinedLocation }, '');
                }}
                disabled={loading || !formData.location || !formData.zip_code || !formData.delivery_method}
                sx={{
                    mt: 2,
                    bgcolor: vintageColors.accent,
                    '&:hover': { bgcolor: vintageColors.accentDark },
                }}
            >
                {loading ? <CircularProgress size={24} /> : 'Confirm Payment'}
            </Button>
        </Box>
    );
};

const PaymentPage = ({ cartUpdated, onCheckout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.state?.orderId;
    const totalAmount = location.state?.totalAmount;
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!orderId || !totalAmount) {
            setError('Invalid order or amount. Redirecting...');
            setTimeout(() => navigate('/previous-cart'), 2000);
        }
    }, [orderId, totalAmount, navigate]);

    const handleSubmit = async (formData, stripePaymentIntentId) => {
        try {
            const data = {
                order_id: orderId,
                delivery_method: formData.delivery_method,
                payment_method: formData.payment_method,
                location: formData.location,
                stripe_payment_intent_id: stripePaymentIntentId,
            };
            const response = await apiFetch('/payment/process/', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (response.ok) {
                onCheckout();
                navigate('/orders', { state: { message: 'Payment processed successfully' } });
            } else {
                setError(result.error || 'Failed to process payment');
            }
        } catch (err) {
            setError(err.message || 'Failed to process payment');
        }
    };

    if (!orderId || !totalAmount) {
        return <Typography color="error">Invalid order. Redirecting...</Typography>;
    }

    return (
        <Box sx={{ p: 3, bgcolor: vintageColors.background, minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                Payment Details
            </Typography>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            <Elements stripe={stripePromise}>
                <CheckoutForm orderId={orderId} totalAmount={totalAmount} handleSubmit={handleSubmit} />
            </Elements>
        </Box>
    );
};

export default PaymentPage;