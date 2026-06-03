import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Paper,
    Divider,
} from '@mui/material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const Profile = () => {
    const navigate = useNavigate();
    const token = Cookies.get('access');
    const [userInfo, setUserInfo] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!token) {
                navigate('/');
                return;
            }
            try {
                const response = await fetch('http://localhost:8000/api/user/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch user info');
                const data = await response.json();
                console.log('Fetched userInfo:', data);
                setUserInfo(data);
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    phone_number: data.phone_number || '',
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUserInfo();
    }, [token, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditToggle = () => {
        setIsEditing((prev) => !prev);
        setSuccess(null);
        setError(null);
    };

    const handleSave = async () => {
        if (!token) {
            navigate('/');
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
            };
            console.log('PUT payload:', payload);
            console.log('Current userInfo:', userInfo);
            console.log('Current formData:', formData);

            const response = await fetch('http://localhost:8000/api/user/', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.email?.[0] || errorData.detail || 'Failed to update profile');
            }

            const updatedData = await response.json();
            console.log('PUT response:', updatedData);

            // Check for changes
            const hasChanges =
                updatedData.first_name !== userInfo?.first_name ||
                updatedData.last_name !== userInfo?.last_name ||
                updatedData.phone_number !== userInfo?.phone_number;

            // Update state
            setUserInfo((prev) => ({
                ...prev,
                first_name: updatedData.first_name || prev?.first_name || '',
                last_name: updatedData.last_name || prev?.last_name || '',
                phone_number: updatedData.phone_number || prev?.phone_number || '',
            }));
            setFormData({
                first_name: updatedData.first_name || '',
                last_name: updatedData.last_name || '',
                phone_number: updatedData.phone_number || '',
            });
            setIsEditing(false);
            if (hasChanges) {
                setSuccess('Profile updated successfully');
                // Refresh page to ensure UI updates
                setTimeout(() => {
                    window.location.reload();
                }, 500); // Delay for success message visibility
            } else {
                setSuccess('No changes detected');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: vintageColors.accent }} />
            </Box>
        );
    }

    if (error && !userInfo) {
        return (
            <Typography sx={{ color: vintageColors.textSecondary, textAlign: 'center', mt: 4 }}>
                Error: {error}
            </Typography>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: vintageColors.background,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                backgroundBlendMode: 'overlay',
                p: 4,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    maxWidth: 600,
                    mx: 'auto',
                    p: 4,
                    bgcolor: vintageColors.background,
                    border: `2px solid ${vintageColors.textSecondary}`,
                    borderRadius: '12px',
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                        textAlign: 'center',
                        mb: 3,
                    }}
                >
                    Your Profile
                </Typography>
                <Divider sx={{ mb: 3, borderColor: vintageColors.textSecondary }} />

                {/* Email (Non-editable) */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textPrimary,
                            mb: 1,
                        }}
                    >
                        Email
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textSecondary,
                            ml: 2,
                        }}
                    >
                        {userInfo?.email || 'Not set'}
                    </Typography>
                </Box>

                {/* Role (Non-editable) */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textPrimary,
                            mb: 1,
                        }}
                    >
                        Role
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textSecondary,
                            ml: 2,
                        }}
                    >
                        {userInfo?.role
                            ? userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)
                            : 'User'}
                    </Typography>
                </Box>

                {/* Editable Fields */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textPrimary,
                            mb: 1,
                        }}
                    >
                        First Name
                    </Typography>
                    {isEditing ? (
                        <TextField
                            fullWidth
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            variant="outlined"
                            label="First Name"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: vintageColors.background,
                                    borderRadius: '8px',
                                    color: vintageColors.textPrimary,
                                    '&:hover fieldset': {
                                        borderColor: vintageColors.accent,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: vintageColors.textPrimary,
                                    fontFamily: "'Lora', sans-serif",
                                },
                            }}
                        />
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Lora', sans-serif",
                                color: vintageColors.textSecondary,
                                ml: 2,
                            }}
                        >
                            {userInfo?.first_name || 'Not set'}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textPrimary,
                            mb: 1,
                        }}
                    >
                        Last Name
                    </Typography>
                    {isEditing ? (
                        <TextField
                            fullWidth
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            variant="outlined"
                            label="Last Name"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: vintageColors.background,
                                    borderRadius: '8px',
                                    color: vintageColors.textPrimary,
                                    '&:hover fieldset': {
                                        borderColor: vintageColors.accent,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: vintageColors.textPrimary,
                                    fontFamily: "'Lora', sans-serif",
                                },
                            }}
                        />
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Lora', sans-serif",
                                color: vintageColors.textSecondary,
                                ml: 2,
                            }}
                        >
                            {userInfo?.last_name || 'Not set'}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontFamily: "'Lora', sans-serif",
                            color: vintageColors.textPrimary,
                            mb: 1,
                        }}
                    >
                        Phone Number
                    </Typography>
                    {isEditing ? (
                        <TextField
                            fullWidth
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            variant="outlined"
                            label="Phone Number"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: vintageColors.background,
                                    borderRadius: '8px',
                                    color: vintageColors.textPrimary,
                                    '&:hover fieldset': {
                                        borderColor: vintageColors.accent,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: vintageColors.textPrimary,
                                    fontFamily: "'Lora', sans-serif",
                                },
                            }}
                        />
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: "'Lora', sans-serif",
                                color: vintageColors.textSecondary,
                                ml: 2,
                            }}
                        >
                            {userInfo?.phone_number || 'Not set'}
                        </Typography>
                    )}
                </Box>

                {/* Edit/Save/Cancel Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    {isEditing ? (
                        <>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={saving}
                                sx={{
                                    bgcolor: vintageColors.secondary,
                                    color: vintageColors.textPrimary,
                                    borderRadius: '12px',
                                    fontFamily: "'Lora', sans-serif",
                                    '&:hover': {
                                        bgcolor: vintageColors.accent,
                                    },
                                }}
                            >
                                {saving ? <CircularProgress size={24} sx={{ color: vintageColors.textPrimary }} /> : 'Save'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleEditToggle}
                                disabled={saving}
                                sx={{
                                    borderColor: vintageColors.textSecondary,
                                    color: vintageColors.textSecondary,
                                    borderRadius: '12px',
                                    fontFamily: "'Lora', sans-serif",
                                    '&:hover': {
                                        borderColor: vintageColors.accent,
                                        color: vintageColors.accent,
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleEditToggle}
                            sx={{
                                bgcolor: vintageColors.secondary,
                                color: vintageColors.textPrimary,
                                borderRadius: '12px',
                                fontFamily: "'Lora', sans-serif",
                                '&:hover': {
                                    bgcolor: vintageColors.accent,
                                },
                            }}
                        >
                            Edit Profile
                        </Button>
                    )}
                </Box>

                {/* Success/Error Messages */}
                {success && (
                    <Typography
                        sx={{
                            color: vintageColors.accent,
                            textAlign: 'center',
                            fontFamily: "'Lora', sans-serif",
                            mb: 2,
                        }}
                    >
                        {success}
                    </Typography>
                )}
                {error && (
                    <Typography
                        sx={{
                            color: vintageColors.textSecondary,
                            textAlign: 'center',
                            fontFamily: "'Lora', sans-serif",
                            mb: 2,
                        }}
                    >
                        Error: {error}
                    </Typography>
                )}

                {/* Navigation Links */}
                <Divider sx={{ mb: 3, borderColor: vintageColors.textSecondary }} />
                <Typography
                    variant="h6"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                        textAlign: 'center',
                        mb: 2,
                    }}
                >
                    Quick Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                    <Button
                        onClick={() => navigate('/previous-cart')}
                        sx={{
                            color: vintageColors.textPrimary,
                            fontFamily: "'Lora', sans-serif",
                            textTransform: 'none',
                            '&:hover': {
                                color: vintageColors.accent,
                            },
                        }}
                    >
                        View Cart
                    </Button>
                    <Button
                        onClick={() => navigate('/orders')}
                        sx={{
                            color: vintageColors.textPrimary,
                            fontFamily: "'Lora', sans-serif",
                            textTransform: 'none',
                            '&:hover': {
                                color: vintageColors.accent,
                            },
                        }}
                    >
                        Purchase History
                    </Button>
                    <Button
                        onClick={() => navigate('/likes')}
                        sx={{
                            color: vintageColors.textPrimary,
                            fontFamily: "'Lora', sans-serif",
                            textTransform: 'none',
                            '&:hover': {
                                color: vintageColors.accent,
                            },
                        }}
                    >
                        View Likes
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Profile;