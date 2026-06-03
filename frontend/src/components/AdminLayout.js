import React from 'react';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RateReviewIcon from '@mui/icons-material/RateReview'; // Added for Reviews
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import Cookies from 'js-cookie';
import { vintageColors } from '../Theme';

const drawerWidth = 240;

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('refresh');
        Cookies.remove('role');
        navigate('/');
    };

    const drawer = (
        <div>
            <Toolbar>
                <Typography
                    variant="h6"
                    noWrap
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                    }}
                >
                    Admin Dashboard
                </Typography>
            </Toolbar>
            <List>
                <ListItem button component={Link} to="/admin">
                    <ListItemIcon>
                        <DashboardIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Dashboard"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/admin/products">
                    <ListItemIcon>
                        <InventoryIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Manage Products"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/admin/categories">
                    <ListItemIcon>
                        <CategoryIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Manage Categories"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/admin/orders">
                    <ListItemIcon>
                        <ShoppingCartIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Orders"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/admin/reviews">
                    <ListItemIcon>
                        <RateReviewIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Manage Reviews"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon>
                        <ExitToAppIcon sx={{ color: vintageColors.accent }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Logout"
                        primaryTypographyProps={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    />
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: vintageColors.primary,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            fontFamily: "'Playfair Display', serif",
                            color: vintageColors.textPrimary,
                        }}
                    >
                        Admin Panel
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: vintageColors.background,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Permanent Drawer for Desktop */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            bgcolor: vintageColors.background,
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    bgcolor: vintageColors.background,
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
};

export default AdminLayout;