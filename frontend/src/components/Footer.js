import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, IconButton } from '@mui/material';
import { GitHub, Twitter, Instagram } from '@mui/icons-material';
import { vintageColors } from '../Theme';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: vintageColors.textPrimary,
                color: vintageColors.background,
                py: 4,
                px: 2,
                borderTop: `2px solid ${vintageColors.textSecondary}`,
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                backgroundBlendMode: 'overlay',
            }}
        >
            <Box
                sx={{
                    maxWidth: 1200,
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                {/* Navigation Links */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: 'center',
                    }}
                >
                    <Link
                        to="/home"
                        style={{
                            color: vintageColors.background,
                            textDecoration: 'none',
                            fontFamily: "'Lora', sans-serif",
                        }}
                    >
                        Home
                    </Link>
                    <Link
                        to="/products"
                        style={{
                            color: vintageColors.background,
                            textDecoration: 'none',
                            fontFamily: "'Lora', sans-serif",
                        }}
                    >
                        Shop
                    </Link>
                    <Link
                        to="/orders"
                        style={{
                            color: vintageColors.background,
                            textDecoration: 'none',
                            fontFamily: "'Lora', sans-serif",
                        }}
                    >
                        Orders
                    </Link>
                    <Link
                        to="/profile"
                        style={{
                            color: vintageColors.background,
                            textDecoration: 'none',
                            fontFamily: "'Lora', sans-serif",
                        }}
                    >
                        Profile
                    </Link>
                </Box>

                {/* Social Media Icons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                        component="a"
                        href="https://github.com"
                        target="_blank"
                        sx={{ color: vintageColors.background, '&:hover': { color: vintageColors.accent } }}
                    >
                        <GitHub />
                    </IconButton>
                    <IconButton
                        component="a"
                        href="https://twitter.com"
                        target="_blank"
                        sx={{ color: vintageColors.background, '&:hover': { color: vintageColors.accent } }}
                    >
                        <Twitter />
                    </IconButton>
                    <IconButton
                        component="a"
                        href="https://instagram.com"
                        target="_blank"
                        sx={{ color: vintageColors.background, '&:hover': { color: vintageColors.accent } }}
                    >
                        <Instagram />
                    </IconButton>
                </Box>

                {/* Copyright */}
                <Typography
                    variant="body2"
                    sx={{
                        fontFamily: "'Lora', sans-serif",
                        color: vintageColors.background,
                        textAlign: { xs: 'center', md: 'right' },
                    }}
                >
                    © {new Date().getFullYear()} Vintage Threads. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default Footer;