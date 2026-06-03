import React, { useState, useEffect, useCallback } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
    CircularProgress,
    TextField,
    IconButton,
    Menu,
    Slide,
    Badge,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from './user/api';
import { vintageColors } from '../Theme';
import { debounce } from 'lodash';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Footer from './Footer';

const Layout = ({ children, cartUpdated, onCheckout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = Cookies.get('access');
    const [role, setRole] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [error, setError] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [cartError, setCartError] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [cartAnchorEl, setCartAnchorEl] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const open = Boolean(anchorEl);
    const cartOpen = Boolean(cartAnchorEl);

    const fetchCartCount = useCallback(async () => {
        try {
            const response = await apiFetch('/cart/');
            const data = await response.json();
            if (response.ok) {
                setCartCount(data.items?.length || 0);
                setCartError(null);
            } else {
                setCartCount(0);
                setCartError('Failed to fetch cart count');
            }
        } catch (err) {
            console.error('Fetch cart count error:', err);
            setCartCount(0);
            setCartError(err.message || 'Failed to fetch cart count');
        }
    }, []);

    const fetchCartItems = useCallback(async () => {
        try {
            const response = await apiFetch('/cart/');
            const data = await response.json();
            if (response.ok) {
                setCartItems(data.items || []);
                setCartError(null);
            } else {
                setCartItems([]);
                setCartError('Failed to fetch cart items');
            }
        } catch (err) {
            console.error('Fetch cart items error:', err);
            setCartItems([]);
            setCartError(err.message || 'Failed to fetch cart items');
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetchCartCount();
        }
    }, [token, cartUpdated, fetchCartCount]);

    useEffect(() => {
        if (cartOpen && token) {
            fetchCartItems();
        }
    }, [cartOpen, token, fetchCartItems]);

    const debouncedNavigate = useCallback(
        (query, category) => {
            navigate('/home', { state: { selectedCategory: category, searchQuery: query } });
        },
        [navigate]
    );

    const debouncedNavigateWrapper = debounce(debouncedNavigate, 300);

    const handleAddToCart = useCallback(
        (product, quantity = 1) => {
            return apiFetch('/cart/add/', {
                method: 'POST',
                body: JSON.stringify({ product_id: product.id, quantity }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (onCheckout) onCheckout();
                    return data;
                })
                .catch((err) => {
                    console.error('Add to cart error:', err);
                    throw err;
                });
        },
        [onCheckout]
    );

    const handleRemoveFromCart = useCallback(
        async (productId) => {
            try {
                await apiFetch('/cart/remove/', {
                    method: 'POST',
                    body: JSON.stringify({ product_id: productId }),
                });
                await fetchCartItems();
                await fetchCartCount();
                if (onCheckout) onCheckout();
            } catch (err) {
                console.error('Remove from cart error:', err);
                setCartError(err.message || 'Failed to remove item');
            }
        },
        [fetchCartItems, fetchCartCount, onCheckout]
    );

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) return;
            try {
                const response = await fetch('http://localhost:8000/api/user/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch user data');
                const data = await response.json();
                setRole(data.role);
                setUserInfo(data);
            } catch (error) {
                setError('Could not fetch user data');
            }
        };
        fetchUserData();
    }, [token]);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const response = await fetch('http://localhost:8000/api/categories/');
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                setError('Could not fetch categories');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const stateCategory = location.state?.selectedCategory || '';
        const stateSearchQuery = location.state?.searchQuery || '';
        setSelectedCategory(stateCategory);
        setSearchQuery(stateSearchQuery);
    }, [location.state]);

    const handleLogout = () => {
        Cookies.remove('access');
        Cookies.remove('refresh');
        setRole(null);
        setUserInfo(null);
        navigate('/');
    };

    const handleCategoryChange = (event) => {
        const categoryId = event.target.value;
        setSelectedCategory(categoryId);
        navigate('/home', { state: { selectedCategory: categoryId, searchQuery } });
    };

    const handleSearchChange = (event) => {
        const query = event.target.value;
        setSearchQuery(query);
        debouncedNavigateWrapper(query, selectedCategory);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        navigate('/home', { state: { selectedCategory, searchQuery: '' } });
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleCartMenuOpen = (event) => {
        setCartAnchorEl(event.currentTarget);
    };

    const handleCartMenuClose = () => {
        setCartAnchorEl(null);
    };

    const handleMenuItemClick = (path) => {
        handleMenuClose();
        navigate(path);
    };

    const handleCartClick = () => {
        handleCartMenuClose();
        navigate('/previous-cart');
    };

    const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.quantity * item.product.price);
    }, 0).toFixed(2);

    useEffect(() => {
        return () => {
            debouncedNavigateWrapper.cancel();
        };
    }, [debouncedNavigateWrapper]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: vintageColors.background }}>
            <AppBar position="fixed">
                <Toolbar sx={{ bgcolor: 'transparent' }}>
                    <Typography
                        variant="h6"
                        sx={{
                            flexGrow: 1,
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    >
                        Vintage Threads
                    </Typography>
                    {token && (
                        <>
                            <Button
                                color="inherit"
                                onClick={() => navigate('/home')}
                                sx={{ color: vintageColors.textPrimary, mx: 1 }}
                            >
                                Home
                            </Button>
                            <FormControl sx={{ minWidth: 150, mx: 2 }}>
                                <InputLabel sx={{ color: vintageColors.textPrimary }}>Categories</InputLabel>
                                <Select
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                    label="Categories"
                                    sx={{
                                        color: vintageColors.textPrimary,
                                        bgcolor: vintageColors.background,
                                        borderRadius: '8px',
                                        '& .MuiSvgIcon-root': { color: vintageColors.textPrimary },
                                    }}
                                    disabled={loadingCategories}
                                >
                                    <MenuItem value="">
                                        <em>All Categories</em>
                                    </MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                variant="outlined"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                sx={{
                                    width: 200,
                                    mx: 2,
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: vintageColors.background,
                                        borderRadius: '8px',
                                        color: vintageColors.textPrimary,
                                        '&:hover fieldset': {
                                            borderColor: vintageColors.accent,
                                        },
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: vintageColors.textSecondary,
                                        opacity: 1,
                                    },
                                }}
                            />
                            {searchQuery && (
                                <Button
                                    onClick={handleClearSearch}
                                    sx={{
                                        color: vintageColors.textSecondary,
                                        mx: 1,
                                        border: `1px solid ${vintageColors.textSecondary}`,
                                        borderRadius: '12px',
                                        textTransform: 'none',
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                            <IconButton
                                onClick={handleCartMenuOpen}
                                sx={{ color: vintageColors.textPrimary, mx: 1 }}
                                aria-label="View cart"
                            >
                                <Badge
                                    badgeContent={cartCount}
                                    color="error"
                                    showZero
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            backgroundColor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                            fontFamily: "'Lora', sans-serif",
                                        },
                                    }}
                                >
                                    <ShoppingCartIcon fontSize="large" />
                                </Badge>
                            </IconButton>
                            <Menu
                                anchorEl={cartAnchorEl}
                                open={cartOpen}
                                onClose={handleCartMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                TransitionComponent={Slide}
                                TransitionProps={{ direction: 'down' }}
                                PaperProps={{
                                    sx: {
                                        bgcolor: vintageColors.background,
                                        border: `1px solid ${vintageColors.textSecondary}`,
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        minWidth: 300,
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                    },
                                }}
                            >
                                {cartItems.length === 0 ? (
                                    <MenuItem sx={{ fontFamily: "'Lora', sans-serif', color: vintageColors.textSecondary" }}>
                                        Your cart is empty
                                    </MenuItem>
                                ) : (
                                    [
                                        ...cartItems.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <ListItem
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        py: 1,
                                                    }}
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
                                                                Qty: {item.quantity} - ${(item.quantity * item.product.price).toFixed(2)}
                                                            </Typography>
                                                        }
                                                    />
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        onClick={() => handleRemoveFromCart(item.product.id)}
                                                        sx={{
                                                            mt: 1,
                                                            borderColor: vintageColors.textSecondary,
                                                            color: vintageColors.textSecondary,
                                                            borderRadius: '12px',
                                                            '&:hover': {
                                                                bgcolor: vintageColors.accent,
                                                                color: vintageColors.textPrimary,
                                                            },
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </ListItem>
                                                <Divider sx={{ bgcolor: vintageColors.textSecondary, opacity: 0.3 }} />
                                            </React.Fragment>
                                        )),
                                        <ListItem
                                            key="total-amount"
                                            sx={{
                                                justifyContent: 'flex-end',
                                                py: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontFamily: "'Playfair Display', serif",
                                                    color: vintageColors.textPrimary,
                                                }}
                                            >
                                                Total: ${totalAmount}
                                            </Typography>
                                        </ListItem>,
                                        <MenuItem
                                            key="view-cart"
                                            onClick={handleCartClick}
                                            sx={{
                                                fontFamily: "'Lora', sans-serif",
                                                color: vintageColors.textPrimary,
                                                justifyContent: 'center',
                                                '&:hover': {
                                                    bgcolor: vintageColors.accent,
                                                    color: vintageColors.textPrimary,
                                                },
                                            }}
                                        >
                                            View Cart
                                        </MenuItem>,
                                    ]
                                )}
                            </Menu>
                            <IconButton
                                onClick={handleMenuOpen}
                                sx={{ color: vintageColors.textPrimary, mx: 1, display: 'flex', alignItems: 'center' }}
                                aria-label="Open profile menu"
                            >
                                <Typography
                                    sx={{
                                        color: vintageColors.textPrimary,
                                        mr: 1,
                                        fontFamily: "'Lora', sans-serif",
                                        fontSize: '1rem',
                                        maxWidth: 100,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {userInfo?.first_name || 'User'}
                                </Typography>
                                <AccountCircleIcon fontSize="large" />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                TransitionComponent={Slide}
                                TransitionProps={{ direction: 'down' }}
                                PaperProps={{
                                    sx: {
                                        bgcolor: vintageColors.background,
                                        border: `1px solid ${vintageColors.textSecondary}`,
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        minWidth: 200,
                                    },
                                }}
                            >
                                <MenuItem
                                    onClick={() => handleMenuItemClick('/profile')}
                                    aria-label="View Profile"
                                    sx={{
                                        fontFamily: "'Lora', sans-serif",
                                        color: vintageColors.textPrimary,
                                        '&:hover': {
                                            bgcolor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                        },
                                    }}
                                >
                                    Profile
                                </MenuItem>
                                <MenuItem
                                    onClick={() => handleMenuItemClick('/likes')}
                                    aria-label="View Liked Clothes"
                                    sx={{
                                        fontFamily: "'Lora', sans-serif",
                                        color: vintageColors.textPrimary,
                                        '&:hover': {
                                            bgcolor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                        },
                                    }}
                                >
                                    Liked Clothes
                                </MenuItem>
                                <MenuItem
                                    onClick={() => handleMenuItemClick('/orders')}
                                    aria-label="View Purchase History"
                                    sx={{
                                        fontFamily: "'Lora', sans-serif",
                                        color: vintageColors.textPrimary,
                                        '&:hover': {
                                            bgcolor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                        },
                                    }}
                                >
                                    Purchase History
                                </MenuItem>
                                <MenuItem
                                    onClick={() => handleMenuItemClick('/previous-cart')}
                                    aria-label="View Cart"
                                    sx={{
                                        fontFamily: "'Lora', sans-serif",
                                        color: vintageColors.textPrimary,
                                        '&:hover': {
                                            bgcolor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                        },
                                    }}
                                >
                                    Cart
                                </MenuItem>
                                {role === 'admin' && (
                                    <MenuItem
                                        onClick={() => handleMenuItemClick('/admin')}
                                        aria-label="Admin Dashboard"
                                        sx={{
                                            fontFamily: "'Lora', sans-serif",
                                            color: vintageColors.textPrimary,
                                            '&:hover': {
                                                bgcolor: vintageColors.accent,
                                                color: vintageColors.textPrimary,
                                            },
                                        }}
                                    >
                                        Admin
                                    </MenuItem>
                                )}
                                <MenuItem
                                    onClick={() => {
                                        handleMenuClose();
                                        handleLogout();
                                    }}
                                    aria-label="Logout"
                                    sx={{
                                        fontFamily: "'Lora', sans-serif",
                                        color: vintageColors.textPrimary,
                                        '&:hover': {
                                            bgcolor: vintageColors.accent,
                                            color: vintageColors.textPrimary,
                                        },
                                    }}
                                >
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Box sx={{ pt: 8, flexGrow: 1 }}>
                {error && (
                    <Typography color="error" sx={{ p: 2, textAlign: 'center', color: vintageColors.textSecondary }}>
                        {error}
                    </Typography>
                )}
                {cartError && (
                    <Typography color="error" sx={{ p: 2, textAlign: 'center', color: vintageColors.textSecondary }}>
                        {cartError}
                    </Typography>
                )}
                {loadingCategories && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress sx={{ color: vintageColors.accent }} />
                    </Box>
                )}
                <Box sx={{ p: 2 }}>
                    {React.Children.map(children, (child) =>
                        React.cloneElement(child, {
                            onAddToCart: handleAddToCart,
                            selectedCategory,
                            searchQuery,
                            cartUpdated,
                        })
                    )}
                </Box>
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;