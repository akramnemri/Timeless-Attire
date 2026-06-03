import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box, Typography, Button, Grid, Card, CardContent, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Line } from 'react-chartjs-2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { vintageColors } from '../../Theme';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler // Add Filler plugin
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler // Register Filler plugin
);

const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
    const [endDate, setEndDate] = useState(dayjs());
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
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to refresh token');
        }
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
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Request failed');
        }
        return response;
    }, [refreshToken]);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setMessage(''); // Clear any previous error messages
        try {
            const url = `http://localhost:8000/api/dashboard-metrics/?start_date=${startDate.format('YYYY-MM-DD')}&end_date=${endDate.format('YYYY-MM-DD')}`;
            const response = await makeAuthenticatedRequest(url, { method: 'GET' });
            const data = await response.json();
            setMetrics(data);
            console.log('Dashboard metrics:', data); // Debug log
            console.log('Most liked products:', data.most_liked_products); // Additional debug log
        } catch (error) {
            setMessage(error.message || 'Failed to fetch dashboard metrics');
            if (error.message.includes('No token found') || error.message.includes('refresh token')) {
                Cookies.remove('access');
                Cookies.remove('refresh');
                Cookies.remove('role');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, navigate, makeAuthenticatedRequest]);

    useEffect(() => {
        const role = Cookies.get('role');
        if (role !== 'admin') {
            setMessage('You do not have permission to access this page.');
            navigate('/home');
            return;
        }

        if (startDate && endDate) {
            fetchMetrics();
        }
    }, [startDate, endDate, navigate, fetchMetrics]);

    const handleRefresh = () => {
        fetchMetrics();
    };

    const chartData = metrics?.orders_trend ? {
        labels: metrics.orders_trend.map(item => item.date),
        datasets: [{
            label: 'Orders',
            data: metrics.orders_trend.map(item => item.count),
            borderColor: vintageColors.accent,
            backgroundColor: `${vintageColors.accent}33`,
            fill: true, // This should now work with Filler plugin
        }],
    } : {};

    if (loading) {
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5 }} />;
    }

    if (message) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                {message}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                    }}
                >
                    Admin Dashboard
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    sx={{
                        color: vintageColors.accent,
                        borderColor: vintageColors.accent,
                        fontFamily: "'Playfair Display', serif",
                        '&:hover': { borderColor: vintageColors.textSecondary, bgcolor: vintageColors.background },
                    }}
                >
                    Refresh
                </Button>
            </Box>
            <Typography
                variant="body1"
                sx={{
                    color: vintageColors.textSecondary,
                    mb: 3,
                }}
            >
                Monitor key metrics and manage your store effectively.
            </Typography>

            {/* Date Range Filter */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                </Box>
            </LocalizationProvider>

            {/* Metrics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Sales
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                ${metrics?.total_sales?.toFixed(2) || '0.00'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Orders
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                {metrics?.total_orders || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Users
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                {metrics?.total_users || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Active Carts
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                {metrics?.active_carts || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Likes
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                {metrics?.total_likes || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                    <Card sx={{ bgcolor: vintageColors.background }}>
                        <CardContent>
                            <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Reviews
                            </Typography>
                            <Typography variant="h5" sx={{ color: vintageColors.accent }}>
                                {metrics?.total_reviews || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Order Trend Chart */}
            <Card sx={{ mb: 4, bgcolor: vintageColors.background }}>
                <CardContent>
                    <Typography sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary, mb: 2 }}>
                        Order Trends
                    </Typography>
                    {metrics?.orders_trend?.length > 0 ? (
                        <Line data={chartData} options={{
                            responsive: true,
                            plugins: {
                                legend: { labels: { font: { family: "'Lora', sans-serif" } } },
                                title: { display: false },
                            },
                            scales: {
                                x: { ticks: { font: { family: "'Lora', sans-serif" } } },
                                y: { ticks: { font: { family: "'Lora', sans-serif" } } },
                            },
                        }} />
                    ) : (
                        <Typography sx={{ color: vintageColors.textSecondary }}>
                            No order data available for the selected period.
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Top Products Table */}
            <Typography
                variant="h6"
                sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: vintageColors.textPrimary,
                    mb: 2,
                }}
            >
                Top Products by Sales
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Product Name
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Category
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Units Sold
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Revenue
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics?.top_products?.length > 0 ? (
                            metrics.top_products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.name}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.category?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.total_sold || 0}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        ${(product.revenue || 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ color: vintageColors.textSecondary }}>
                                    No products sold in the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Most Liked Products Table */}
            <Typography
                variant="h6"
                sx={{
                    fontFamily: "'Playfair Display', serif",
                    color: vintageColors.textPrimary,
                    mb: 2,
                }}
            >
                Most Liked Products
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Product Name
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Category
                            </TableCell>
                            <TableCell sx={{ fontFamily: "'Playfair Display', serif", color: vintageColors.textPrimary }}>
                                Total Likes
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metrics?.most_liked_products?.length > 0 ? (
                            metrics.most_liked_products.map(product => (
                                <TableRow key={product.id}>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.name}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.category?.name || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ color: vintageColors.textSecondary }}>
                                        {product.total_likes || 0}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ color: vintageColors.textSecondary }}>
                                    No likes recorded in the selected period.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Navigation Buttons */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/admin/products"
                        fullWidth
                        sx={{
                            bgcolor: vintageColors.accent,
                            color: vintageColors.textPrimary,
                            fontFamily: "'Playfair Display', serif",
                            '&:hover': { bgcolor: vintageColors.textSecondary },
                        }}
                    >
                        Manage Products
                    </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/admin/categories"
                        fullWidth
                        sx={{
                            bgcolor: vintageColors.accent,
                            color: vintageColors.textPrimary,
                            fontFamily: "'Playfair Display', serif",
                            '&:hover': { bgcolor: vintageColors.textSecondary },
                        }}
                    >
                        Manage Categories
                    </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Button
                        variant="contained"
                        component={Link}
                        to="/admin/orders"
                        fullWidth
                        sx={{
                            bgcolor: vintageColors.accent,
                            color: vintageColors.textPrimary,
                            fontFamily: "'Playfair Display', serif",
                            '&:hover': { bgcolor: vintageColors.textSecondary },
                        }}
                    >
                        Orders
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;