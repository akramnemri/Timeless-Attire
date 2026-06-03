import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import vintageTheme from './Theme';
import UserHome from './components/user/UserHome';
import Login from './components/user/Login';
import Register from './components/user/Register';
import AdminDashboard from './components/admin/Dashboard';
import ProductDetail from './components/user/ProductDetails';
import Likes from './components/user/Likes';
import PurchaseHistory from './components/user/PurchaseHistory';
import Cart from './components/user/CartPage';
import Profile from './components/user/profile';
import PrivateRoute from './components/user/PrivateRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AddProduct from './components/admin/AddProduct';
import AddCategories from './components/admin/AddCategories';
import Orders from './components/admin/Orders'; // Adjusted import name
import OrderDetail from './components/admin/OrderDetail'; // New import
import ResetPassword from './components/user/ResetPassword';
import ManageReviews from './components/admin/ManageReviews';
import PaymentPage from './components/user/PaymentPage';

function App() {
    const [cartUpdated, setCartUpdated] = useState(false);
    const [productsUpdated, setProductsUpdated] = useState(false);

    const handleCheckout = () => {
        setCartUpdated((prev) => !prev);
        setProductsUpdated((prev) => !prev);
    };

    return (
        <ThemeProvider theme={vintageTheme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route
                        path="/home"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <UserHome productsUpdated={productsUpdated} />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <AdminDashboard />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <AddProduct />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin/categories"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <AddCategories />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin/orders"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <Orders />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin/orders/:orderId"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <OrderDetail />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/admin/reviews"
                        element={
                            <PrivateRoute
                                element={
                                    <AdminLayout>
                                        <ManageReviews />
                                    </AdminLayout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/product/:id"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <ProductDetail
                                            productsUpdated={productsUpdated}
                                            onAddToCart={null}
                                        />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/likes"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <Likes productsUpdated={productsUpdated} />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <PurchaseHistory />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/previous-cart"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <Cart cartUpdated={cartUpdated} onCheckout={handleCheckout} />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/payment"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <PaymentPage cartUpdated={cartUpdated} onCheckout={handleCheckout} />
                                    </Layout>
                                }
                            />
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute
                                element={
                                    <Layout cartUpdated={cartUpdated} onCheckout={handleCheckout}>
                                        <Profile />
                                    </Layout>
                                }
                            />
                        }
                    />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;