import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Pagination,
  Grid,
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
  '& .slick-slider': {
    width: '100%',
    boxSizing: 'border-box',
  },
  '& .slick-list': {
    width: '100%',
    margin: '0 4px',
  },
  '& .slick-track': {
    display: 'flex',
    width: '100%',
  },
  '& .slick-slide': {
    width: '100%',
    flex: '0 0 100%',
  },
  '& .slick-slide img': {
    width: '100%',
    height: 'auto', // Maintain aspect ratio
    maxHeight: '300px', // Increased for better quality
  },
  '& .slick-prev, & .slick-next': {
    zIndex: 1000,
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: `${vintageColors.accent} !important`,
    '&:hover': {
      backgroundColor: `${vintageColors.textSecondary} !important`,
    },
    '&:before': {
      color: `${vintageColors.textPrimary} !important`,
      fontSize: '20px',
      opacity: 1,
    },
  },
  '& .slick-prev': {
    left: 15,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '& .slick-next': {
    right: 15,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '& .slick-dots': {
    bottom: 10,
  },
  '& .slick-dots li button:before': {
    color: `${vintageColors.textPrimary} !important`,
    fontSize: '10px',
    opacity: 0.5,
  },
  '& .slick-dots li.slick-active button:before': {
    color: `${vintageColors.accent} !important`,
    opacity: 1,
  },
};

const ProductList = ({ selectedCategory, searchQuery, onAddToCart, productsUpdated }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 16; // 4x4 grid
  const navigate = useNavigate();
  const FALLBACK_IMAGE = 'https://placehold.co/300x300?text=Product';
  const BASE_MEDIA_URL = 'http://localhost:8000';

  const getImageUrl = (image) => {
    if (typeof image !== 'string' || !image) {
      return FALLBACK_IMAGE;
    }
    return image.startsWith('http') ? image : `${BASE_MEDIA_URL}${image}`;
  };

  const fetchProducts = useCallback(async () => {
    try {
      let url = '/products/';
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const response = await apiFetch(url);
      const data = await response.json();
      const convertedData = data.map(product => {
        const seen = new Set();
        const uniqueImages = (product.images || [])
          .filter(img => {
            if (!img.product_image || !img.product_image.id) {
              console.warn(`Invalid image data for product ${product.id}:`, img);
              return false;
            }
            if (seen.has(img.product_image.id)) {
              console.warn(`Duplicate image ID ${img.product_image.id} for product ${product.id}`);
              return false;
            }
            seen.add(img.product_image.id);
            return true;
          })
          .sort((a, b) => a.position - b.position);
        return {
          ...product,
          images: uniqueImages,
        };
      });
      setProducts(convertedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, productsUpdated]);

  const pageCount = Math.ceil(products.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (loading) return <Typography sx={{ color: vintageColors.textPrimary }}>Loading products...</Typography>;
  if (error) return <Typography sx={{ color: vintageColors.textSecondary }}>Error: {error}</Typography>;

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontFamily: "'Playfair Display', serif",
          color: vintageColors.textPrimary,
          textAlign: 'center',
        }}
      >
        {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Collection'}
      </Typography>
      {products.length === 0 && searchQuery ? (
        <Typography sx={{ textAlign: 'center', color: vintageColors.textSecondary }}>
          No products found for "{searchQuery}".
        </Typography>
      ) : (
        <>
          <Grid
            container
            spacing={3}
            sx={{ maxWidth: '1200px', mx: 'auto' }}
          >
            {currentProducts.map((product, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={product.id}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Card
                    sx={{
                      minHeight: 500,
                      width: '100%',
                      minWidth: '200px',
                      maxWidth: '300px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      border: `1px solid ${vintageColors.textPrimary}`,
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      padding: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: index % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'rotate(0deg) scale(1.05)',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    {product.images && product.images.length > 1 ? (
                      <Slider {...sliderSettings} sx={sliderStyles}>
                        {product.images.map((image, imgIndex) => (
                          <CardMedia
                            key={`${image.product_image.id}-${imgIndex}`}
                            component="img"
                            sx={{
                              height: 300, // Increased for better quality
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
                    ) : (
                      <CardMedia
                        component="img"
                        sx={{
                          height: 300, // Increased for better quality
                          width: '100%',
                          objectFit: 'contain',
                          // Removed sepia filter for clarity
                        }}
                        image={product.images && product.images.length === 1 ? getImageUrl(product.images[0].product_image?.image) : FALLBACK_IMAGE}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                          if (e.target.src !== FALLBACK_IMAGE) {
                            e.target.src = FALLBACK_IMAGE;
                          }
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, pt: 1, pb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Dancing Script', cursive !important",
                          color: vintageColors.textPrimary,
                          fontSize: '1.5rem',
                        }}
                        noWrap
                        title={product.name}
                      >
                        {product.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: `${vintageColors.textSecondary} !important`,
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
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
                        sx={{ color: `${vintageColors.textSecondary} !important` }}
                      >
                        Stock: {product.stock}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: `${vintageColors.textSecondary} !important` }}
                      >
                        Size: {product.size}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: `${vintageColors.textSecondary} !important`,
                          display: 'flex',
                          alignItems: 'center',
                          mt: 1,
                        }}
                      >
                        <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
                        Likes: {product.likes}
                      </Typography>
                    </CardContent>
                    <CardActions
                      sx={{
                        justifyContent: 'center',
                        minHeight: 60,
                        pb: 2,
                        pt: 0.5,
                        borderTop: '1px solid',
                        borderColor: vintageColors.textSecondary,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        sx={{
                          mr: 1,
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          minWidth: 100,
                        }}
                        onClick={() => onAddToCart(product, 1)}
                        disabled={product.stock === 0}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          padding: '6px 12px',
                          minWidth: 100,
                        }}
                        onClick={() => handleViewDetails(product.id)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pageCount}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: vintageColors.textPrimary,
                    '&.Mui-selected': {
                      bgcolor: vintageColors.accent,
                      color: vintageColors.textPrimary,
                    },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ProductList;