import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { vintageColors } from '../../Theme';

const ResetPassword = () => {
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const { token } = useParams();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/password-reset-confirm/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: formData.password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reset password');
            setSuccess('Password reset successfully. You can now log in.');
            setTimeout(() => navigate('/'), 3000);
        } catch (error) {
            setError(error.message || 'Failed to reset password');
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
                        width: { xs: '90%', sm: 400 },
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
                        Reset Password
                    </Typography>
                    {error && (
                        <Typography
                            sx={{ mb: 2, textAlign: 'center', color: vintageColors.textSecondary }}
                        >
                            {error}
                        </Typography>
                    )}
                    {success && (
                        <Typography
                            sx={{ mb: 2, textAlign: 'center', color: vintageColors.primary }}
                        >
                            {success}
                        </Typography>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="New Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
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
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                </Box>
            </Box>
        </Box>
    );
};

export default ResetPassword;