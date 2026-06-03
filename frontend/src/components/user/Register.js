import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography, Checkbox, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const Register = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleCheckboxChange = () => setShowPassword(!showPassword);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateForm = () => {
        if (!formData.email) {
            setError('Email is required.');
            return false;
        }
        if (!formData.first_name) {
            setError('First name is required.');
            return false;
        }
        if (!formData.last_name) {
            setError('Last name is required.');
            return false;
        }
        if (!formData.phone_number) {
            setError('Phone number is required.');
            return false;
        }
        if (formData.phone_number.length < 8) {
            setError('Phone number must be at least 8 digits long.');
            return false;
        }
        if (formData.phone_number && isNaN(formData.phone_number)) {
            setError('Phone number must be numeric.');
            return false;
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (!formData.password) {
            setError('Password is required.');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/register/', formData);
            const isProduction = process.env.NODE_ENV === 'production';
            Cookies.set('access', response.data.token, {
                expires: 1,
                secure: isProduction,
                sameSite: 'Strict',
            });
            Cookies.set('role', response.data.user.role, {
                expires: 1,
                secure: isProduction,
                sameSite: 'Strict',
            });
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                phone_number: '',
            });
            setTimeout(() => {
                navigate(response.data.user.role === 'admin' ? '/admin' : '/home');
            }, 1000);
        } catch (error) {
            const errorMessage = error.response?.data?.email?.[0] || 
                                error.response?.data?.message || 
                                'An error occurred during registration.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: vintageColors.background,
                display: 'flex',
                flexDirection: 'column',
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
            }}
        >
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                    }}
                >
                    Vintage Threads
                </Typography>
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        width: { xs: '90%', sm: 500 },
                        p: 4,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                            mb: 3,
                            textAlign: 'center',
                        }}
                    >
                        Create Account
                    </Typography>
                    {error && (
                        <Typography
                            sx={{
                                mt: 2,
                                textAlign: 'center',
                                color: vintageColors.textSecondary,
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                    <form onSubmit={handleSubmit}>
                        <Box display="flex" gap={2} sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            type="email"
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                            error={error.includes('email') || error.includes('Email')}
                            helperText={error.includes('email') || error.includes('Email') ? error : ''}
                        />
                        <TextField
                            fullWidth
                            type={showPassword ? 'text' : 'password'}
                            label="Password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            sx={{ mb: 1 }}
                            error={error.includes('Password')}
                            helperText={error.includes('Password') ? error : ''}
                        />
                        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                            <Checkbox
                                checked={showPassword}
                                onChange={handleCheckboxChange}
                                sx={{
                                    color: vintageColors.textSecondary,
                                    '&.Mui-checked': { color: vintageColors.accent },
                                }}
                            />
                            <Typography sx={{ color: vintageColors.textSecondary }}>
                                Show Password
                            </Typography>
                        </Box>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                bgcolor: vintageColors.secondary,
                                color: vintageColors.textPrimary,
                                py: 1.5,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} />
                            ) : (
                                'Sign Up'
                            )}
                        </Button>
                    </form>
                    <Typography
                        sx={{ mt: 2, textAlign: 'center', color: vintageColors.textSecondary }}
                    >
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            style={{ color: vintageColors.accent, textDecoration: 'none' }}
                        >
                            Sign In
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Register;