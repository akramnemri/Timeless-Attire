import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, CircularProgress, Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';

const ManageReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
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
        if (!response.ok) throw new Error('Failed to refresh token');
        const data = await response.json();
        Cookies.set('access', data.access, { expires: 7 });
        return data.access;
    }, []);

    const makeAuthenticatedRequest = useCallback(async (url, options) => {
        let token = Cookies.get('access');
        if (!token) throw new Error('No token found, please log in');
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };
        let response = await fetch(url, options);
        if (response.status === 401) {
            token = await refreshToken();
            options.headers['Authorization'] = `Bearer ${token}`;
            response = await fetch(url, options);
        }
        return response;
    }, [refreshToken]);

    useEffect(() => {
        const role = Cookies.get('role');
        if (role !== 'admin') {
            setMessage('You do not have permission to access this page.');
            navigate('/home');
            return;
        }

        const fetchReviews = async () => {
            try {
                const response = await makeAuthenticatedRequest('http://localhost:8000/api/reviews/', {
                    method: 'GET',
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch reviews: ${errorText}`);
                }
                const data = await response.json();
                setReviews(data);
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

        fetchReviews();
    }, [navigate, makeAuthenticatedRequest]);

    const handleDelete = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            const response = await makeAuthenticatedRequest(`http://localhost:8000/api/reviews/${reviewId}/delete/`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error deleting review: ${errorText}`);
            }
            setReviews(reviews.filter(review => review.id !== reviewId));
            setMessage('Review deleted successfully');
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

    if (loading) {
        return <CircularProgress />;
    }

    if (message) {
        return (
            <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ m: 3 }}>
                {message}
            </Alert>
        );
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
                Manage Reviews
            </Typography>
            <Typography
                variant="body1"
                sx={{
                    color: vintageColors.textSecondary,
                    mb: 3,
                }}
            >
                View and manage user reviews for products.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Product Name
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                User Email
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Comment
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Created At
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {reviews.length > 0 ? (
                            reviews.map(review => (
                                <TableRow key={review.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {review.product?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {review.user?.email || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {review.comment}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleDelete(review.id)} sx={{ color: vintageColors.accent }}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No reviews found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ManageReviews;