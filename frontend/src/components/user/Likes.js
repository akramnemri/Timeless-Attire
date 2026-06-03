import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import Cookies from 'js-cookie';

const Likes = ({ productsUpdated }) => {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const FALLBACK_IMAGE = 'https://placehold.co/200x200?text=Product';
  const BASE_URL = 'http://localhost:8000';

  const getImageUrl = (image) => {
    if (!image) {
      console.log('Image is null/empty, using fallback');
      return FALLBACK_IMAGE;
    }
    if (image.startsWith('http')) {
      console.log('Image is full URL:', image);
      return image;
    }
    const fullUrl = `${BASE_URL}${image}`;
    console.log('Transformed image URL:', fullUrl);
    return fullUrl;
  };

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const token = Cookies.get('access');
        const response = await fetch('http://localhost:8000/api/likes/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch likes');
        const data = await response.json();
        console.log('Likes data:', data); // Debug response structure
        setLikes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLikes();
  }, [productsUpdated]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Liked Products
      </Typography>
      {likes.length === 0 ? (
        <Typography>No liked products yet.</Typography>
      ) : (
        <Grid container spacing={2}>
          {likes.map((like) => (
            <Grid item xs={12} sm={6} md={4} key={like.id}>
              <Card>
                <CardMedia
                  component="img"
                  sx={{ height: 200, width: 200, objectFit: 'cover', margin: '0 auto' }}
                  image={
                    getImageUrl(
                      like.product.image || // Try product.image first
                      (like.product.images && like.product.images[0]?.product_image?.image) || // Fallback to images array
                      FALLBACK_IMAGE
                    )
                  }
                  alt={like.product.name}
                  onError={(e) => {
                    if (e.target.src !== FALLBACK_IMAGE) {
                      console.log('Image failed to load, using fallback:', like.product.image);
                      e.target.src = FALLBACK_IMAGE;
                    }
                  }}
                />
                <CardContent>
                  <Typography variant="h6">{like.product.name}</Typography>
                  <Typography color="text.secondary">Size: {like.product.size}</Typography>
                  <Typography color="text.secondary">Price: ${like.product.price}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Likes;