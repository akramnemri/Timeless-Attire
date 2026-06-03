import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    TextField,
    Button,
    Box,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';
import loginBackground from '../../assets/loginbackground.jpeg';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetError, setResetError] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');
            Cookies.set('access', data.token, { expires: 7 });
            Cookies.set('refresh', data.refresh, { expires: 7 });
            if (data.user && data.user.role) {
                Cookies.set('role', data.user.role, { expires: 7 });
            }
            navigate(data.user?.role === 'admin' ? '/admin' : '/home');
        } catch (error) {
            setError(error.message || 'Internal server error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetOpen = () => {
        setResetDialogOpen(true);
        setResetError(null);
        setResetSuccess(null);
        setResetEmail('');
    };

    const handleResetClose = () => {
        setResetDialogOpen(false);
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setResetError(null);
        setResetSuccess(null);
        setResetLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/password-reset/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send reset email');
            setResetSuccess('Password reset email sent. Check your inbox.');
        } catch (error) {
            setResetError(error.message || 'Failed to send reset email');
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: vintageColors.background,
                display: 'flex',
                flexDirection: 'column',
                backgroundImage: `
                    linear-gradient(to bottom, rgba(245, 245, 220, 0.5), rgba(139, 69, 19, 0.4)),
                    url(${loginBackground}),
                    url("https://www.transparenttextures.com/patterns/paper-fibers.png")
                `,
                backgroundSize: 'cover, cover, auto',
                backgroundPosition: 'center, center, center',
                backgroundRepeat: 'no-repeat, no-repeat, repeat',
                position: 'relative',
                '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/vintage-floral.png")',
                    opacity: 0.1,
                    zIndex: 0,
                },
            }}
        >
            <Box sx={{ p: 4, textAlign: 'center', zIndex: 1 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                        textShadow: `2px 2px 4px ${vintageColors.textSecondary}`,
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
                    zIndex: 1,
                }}
            >
                <Box
                    sx={{
                        width: { xs: '90%', sm: 400 },
                        p: 4,
                        borderRadius: '12px',
                        bgcolor: 'rgba(245, 245, 220, 0.95)', // Slightly transparent
                        boxShadow: `0 8px 20px rgba(0,0,0,0.3)`,
                        border: `2px solid ${vintageColors.textSecondary}`,
                        animation: 'fadeInScale 0.7s ease-in-out',
                        '@keyframes fadeInScale': {
                            from: { opacity: 0, transform: 'translateY(30px) scale(0.95)' },
                            to: { opacity: 1, transform: 'translateY(0) scale(1)' },
                        },
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'scale(1.02)',
                        },
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
                        Sign In
                    </Typography>
                    {error && (
                        <Typography
                            sx={{ mb: 2, textAlign: 'center', color: vintageColors.textSecondary }}
                        >
                            {error}
                        </Typography>
                    )}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                },
                            }}
                            error={!!error}
                            helperText={error || ''}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                },
                            }}
                            error={!!error}
                            helperText={error || ''}
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
                                borderRadius: '8px',
                                '&:hover': {
                                    bgcolor: vintageColors.accent,
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                    <Typography
                        sx={{ mt: 2, textAlign: 'center', color: vintageColors.textSecondary }}
                    >
                        <Link
                            to="#"
                            onClick={handleResetOpen}
                            style={{ color: vintageColors.accent, textDecoration: 'none' }}
                        >
                            Forgot Password?
                        </Link>
                    </Typography>
                    <Typography
                        sx={{ mt: 2, textAlign: 'center', color: vintageColors.textSecondary }}
                    >
                        Don’t have an account?{' '}
                        <Link
                            to="/register"
                            style={{ color: vintageColors.accent, textDecoration: 'none' }}
                        >
                            Sign Up
                        </Link>
                    </Typography>
                </Box>
            </Box>
            <Dialog open={resetDialogOpen} onClose={handleResetClose}>
                <DialogTitle sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                    Reset Password
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, color: vintageColors.textSecondary }}>
                        Enter your email address to receive a password reset link.
                    </Typography>
                    {resetError && (
                        <Typography sx={{ mb: 2, color: vintageColors.textSecondary }}>
                            {resetError}
                        </Typography>
                    )}
                    {resetSuccess && (
                        <Typography sx={{ mb: 2, color: vintageColors.accent }}>
                            {resetSuccess}
                        </Typography>
                    )}
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                            },
                        }}
                        error={!!resetError}
                        helperText={resetError || ''}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleResetClose}
                        sx={{ color: vintageColors.textSecondary }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResetSubmit}
                        variant="contained"
                        disabled={resetLoading}
                        sx={{
                            bgcolor: vintageColors.secondary,
                            color: vintageColors.textPrimary,
                            borderRadius: '8px',
                        }}
                    >
                        {resetLoading ? (
                            <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} />
                        ) : (
                            'Send Reset Link'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Login;