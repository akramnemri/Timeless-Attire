import React from 'react';
import { Box, Typography } from '@mui/material';
import ProductList from './ProductList';
import { vintageColors } from '../../Theme';

const UserHome = ({ onAddToCart, selectedCategory, searchQuery, productsUpdated, cartUpdated }) => {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: vintageColors.background,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                backgroundBlendMode: 'overlay',
            }}
        >
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography
                    variant="h2"
                    sx={{
                        fontFamily: "'Playfair Display', serif",
                        color: vintageColors.textPrimary,
                        mb: 2,
                    }}
                >
                    Explore Our Collection
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        color: vintageColors.textSecondary,
                        maxWidth: '600px',
                        mx: 'auto',
                        mb: 4,
                    }}
                >
                    Discover timeless pieces crafted with care, inspired by the elegance of yesteryears.
                </Typography>
            </Box>
            <Box sx={{ px: 3 }}>
                <ProductList
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    onAddToCart={onAddToCart}
                    productsUpdated={productsUpdated}
                />
            </Box>
        </Box>
    );
};

export default UserHome;