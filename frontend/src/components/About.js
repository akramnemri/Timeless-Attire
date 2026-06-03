// src/components/About.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import { vintageColors } from '../Theme';

const About = () => (
    <Box sx={{ p: 4, bgcolor: vintageColors.background, minHeight: '100vh' }}>
        <Typography variant="h4" sx={{ fontFamily: "'Playfair Display', serif" }}>
            About Us
        </Typography>
        <Typography sx={{ mt: 2, fontFamily: "'Lora', sans-serif" }}>
            Vintage Threads offers timeless fashion with a modern twist.
        </Typography>
    </Box>
);
export default About;