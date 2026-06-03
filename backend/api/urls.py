from django.urls import path
from .views import (
    register_user, get_user_info, login_user, password_reset, password_reset_confirm,
    CustomTokenRefreshView, add_category, delete_category, CategoryListView,
    product_list, get_product, update_product, delete_product, add_product_image,
    like_product, add_review, get_cart, add_to_cart, remove_from_cart, checkout,
    get_user_likes, get_user_orders, dashboard_metrics, get_reviews, delete_review,
    process_payment, create_payment_intent
)
from . import views

urlpatterns = [
    # Authentication
    path('register/', register_user, name='register'),
    path('user/', get_user_info, name='get_user_info'),
    path('login/', login_user, name='login'),
    path('password-reset/', password_reset, name='password_reset'),
    path('password-reset-confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    # Categories
    path('categories/add/', add_category, name='add_category'),
    path('categories/delete/<int:category_id>/', delete_category, name='delete_category'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    # Products
    path('products/', product_list, name='product_list'),
    path('products/<int:product_id>/', get_product, name='get_product'),
    path('products/<int:product_id>/update/', update_product, name='update_product'),
    path('products/<int:product_id>/delete/', delete_product, name='delete_product'),
    path('products/<int:product_id>/add-image/', add_product_image, name='add_product_image'),
    # Likes and Reviews
    path('products/<int:product_id>/like/', like_product, name='like_product'),
    path('products/<int:product_id>/review/', add_review, name='add_review'),
    path('likes/', get_user_likes, name='get_user_likes'),
    path('reviews/', get_reviews, name='get_reviews'),
    path('reviews/<int:pk>/delete/', delete_review, name='delete_review'),
    # Cart and Orders
    path('cart/', get_cart, name='get_cart'),
    path('cart/add/', add_to_cart, name='add_to_cart'),
    path('cart/remove/', remove_from_cart, name='remove_from_cart'),
    path('checkout/', checkout, name='checkout'),
    path('orders/', get_user_orders, name='get_user_orders'),
    path('payment/process/', process_payment, name='process_payment'),
    path('payment/create-intent/', create_payment_intent, name='create_payment_intent'),
    path('orders/', views.get_user_orders, name='get_user_orders'),
    path('orders/<int:order_id>/delivery/', views.update_order_delivery, name='update_order_delivery'),
    # Dashboard
    path('dashboard-metrics/', dashboard_metrics, name='dashboard_metrics'),
]