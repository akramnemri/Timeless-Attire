import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Alert,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { apiFetch } from './api';
import { vintageColors } from '../../Theme';

const sliderSettings = {
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: true,
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  adaptiveHeight: false, // Prevent height fluctuations
  lazyLoad: 'ondemand', // Improve performance
};

const sliderStyles = {
  width: '100%',
  boxSizing: 'border-box',
  marginBottom: 2,
  '& .slick-slider': {
    width: '100%',
    boxSizing: 'border-box',
  },
  '& .slick-list': {
    width: '100%',
    margin: '0 4px',
  },
  '& .slick-track': {
    width: '100%',
  },
  '& .slick-slide': {
    width: '100%',
  },
  '& .slick-slide img': {
    width: '100%',
    height: 'auto', // Maintain aspect ratio
    maxHeight: '400px', // Increased for better quality
  },
  '& .slick-prev, & .slick-next': {
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: vintageColors.accent,
    '&:hover': {
      backgroundColor: vintageColors.textSecondary,
    },
    '&:before': {
      color: vintageColors.textPrimary,
      fontSize: '20px',
    },
  },
  '& .slick-prev': {
    left: 10,
  },
  '& .slick-next': {
    right: 10,
  },
  '& .slick-dots': {
    bottom: 10,
  },
  '& .slick-dots li button:before': {
    color: vintageColors.textPrimary,
    fontSize: '10px',
  },
  '& .slick-dots li.slick-active button:before': {
    color: vintageColors.accent,
  },
};

const ProductDetails = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const FALLBACK_IMAGE = 'https://placehold.co/400x400?text=Product';
  const BASE_MEDIA_URL = 'http://localhost:8000';

  const getImageUrl = (image) => {
    if (typeof image !== 'string' || !image) {
      return FALLBACK_IMAGE;
    }
    return image.startsWith('http') ? image : `${BASE_MEDIA_URL}${image}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiFetch(`/products/${id}/`);
        const data = await response.json();
        // Filter unique images
        const seen = new Set();
        const uniqueImages = (data.images || [])
          .filter(img => {
            if (!img.product_image || !img.product_image.id) {
              console.warn(`Invalid image data for product ${id}:`, img);
              return false;
            }
            if (seen.has(img.product_image.id)) {
              console.warn(`Duplicate image ID ${img.product_image.id} for product ${id}`);
              return false;
            }
            seen.add(img.product_image.id);
            return true;
          })
          .sort((a, b) => a.position - b.position);
        data.images = uniqueImages;
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLike = async () => {
    try {
      const response = await apiFetch(`/products/${id}/like/`, {
        method: 'POST',
      });
      const data = await response.json();
      setProduct({ ...product, likes: data.likes });
      setMessage('Product liked successfully');
    } catch (err) {
      setMessage(err.message || 'Failed to like product');
    }
  };

  const handleSubmitReview = async () => {
    if (!comment) {
      setMessage('Please enter a comment');
      return;
    }
    try {
      const response = await apiFetch(`/products/${id}/review/`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });
      const data = await response.json();
      setProduct({ ...product, reviews: [...product.reviews, data.review] });
      setComment('');
      setMessage('Review submitted successfully');
    } catch (err) {
      setMessage(err.message || 'Failed to submit review');
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart && product) {
      onAddToCart(product, 1);
      setMessage('Added to cart successfully');
    } else {
      setMessage('Error adding to cart');
    }
  };

  if (loading) return <Typography sx={{ color: vintageColors.textPrimary }}>Loading product details...</Typography>;
  if (error) return <Typography sx={{ color: vintageColors.textSecondary }}>Error: {error}</Typography>;
  if (!product) return <Typography sx={{ color: vintageColors.textPrimary }}>Product not found</Typography>;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: vintageColors.background,
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
        minHeight: '100vh',
      }}
    >
      <Button
        onClick={() => navigate('/home')}
        sx={{
          mb: 2,
          color: vintageColors.textPrimary,
          borderColor: vintageColors.accent,
          borderRadius: '12px',
        }}
        variant="outlined"
      >
        Back to Collection
      </Button>
      <Card
        sx={{
          bgcolor: 'background.paper',
          border: `1px solid ${vintageColors.textPrimary}`,
          borderRadius: '4px',
          backgroundColor: '#fff',
          padding: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        {product.images && product.images.length > 1 ? (
          <Slider {...sliderSettings} sx={sliderStyles}>
            {product.images.map((image, imgIndex) => (
              <CardMedia
                key={`${image.product_image.id}-${imgIndex}`}
                component="img"
                sx={{
                  height: 400, // Increased for better quality
                  width: '100%',
                  objectFit: 'contain',
                  // Removed sepia filter for clarity
                }}
                image={getImageUrl(image.product_image?.image)}
                alt={`${product.name} image ${imgIndex + 1}`}
                loading="lazy"
                onError={(e) => {
                  if (e.target.src !== FALLBACK_IMAGE) {
                    e.target.src = FALLBACK_IMAGE;
                  }
                }}
              />
            ))}
          </Slider>
        ) : product.images && product.images.length === 1 ? (
          <CardMedia
            component="img"
            sx={{
              height: 400, // Increased for better quality
              width: '100%',
              objectFit: 'contain',
              // Removed sepia filter for clarity
            }}
            image={getImageUrl(product.images[0].product_image?.image)}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              if (e.target.src !== FALLBACK_IMAGE) {
                e.target.src = FALLBACK_IMAGE;
              }
            }}
          />
        ) : (
          <CardMedia
            component="img"
            sx={{
              height: 400, // Increased for better quality
              width: '100%',
              objectFit: 'contain',
              // Removed sepia filter for clarity
            }}
            image={FALLBACK_IMAGE}
            alt={product.name}
            loading="lazy"
          />
        )}
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontFamily: "'Playfair Display', serif",
              color: vintageColors.textPrimary,
              textAlign: 'center',
            }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{
              color: vintageColors.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: vintageColors.accent }}
          >
            ${isNaN(product.price) ? 'N/A' : Number(product.price).toFixed(2)}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: vintageColors.textSecondary }}
          >
            Stock: {product.stock}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: vintageColors.textSecondary }}
          >
            Size: {product.size}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              color: vintageColors.textSecondary,
            }}
          >
            <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
            Likes: {product.likes}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: vintageColors.primary,
                color: vintageColors.textPrimary,
                borderRadius: '12px',
              }}
              startIcon={<ThumbUpIcon />}
              onClick={handleLike}
            >
              Like
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: vintageColors.secondary,
                color: vintageColors.textPrimary,
                borderRadius: '12px',
              }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontFamily: "'Playfair Display', serif",
            color: vintageColors.textPrimary,
          }}
        >
          Customer Reviews
        </Typography>
        {message && (
          <Alert
            severity={message.includes('successfully') ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {message}
          </Alert>
        )}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Write a review"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
          <Button
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: vintageColors.secondary,
              color: vintageColors.textPrimary,
              borderRadius: '12px',
            }}
            onClick={handleSubmitReview}
          >
            Submit Review
          </Button>
        </Box>
        {product.reviews && product.reviews.length > 0 ? (
          <List>
            {product.reviews.map((review) => (
              <React.Fragment key={review.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontWeight: 500,
                          color: vintageColors.textPrimary,
                        }}
                      >
                        {`${review.user.first_name} ${review.user.last_name}`}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{ color: vintageColors.textSecondary }}
                        >
                          {review.comment}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ color: vintageColors.textSecondary }}
                        >
                          {new Date(review.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider sx={{ bgcolor: vintageColors.textSecondary }} />
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography sx={{ color: vintageColors.textSecondary }}>
            No reviews yet. Be the first to leave a review!
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProductDetails;