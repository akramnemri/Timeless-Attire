# backend/api/views.py

import base64
import io
import logging
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.authentication import TokenAuthentication
from django.core.mail import send_mail
from django.conf import settings
import uuid
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
import stripe
from .models import (
    User, Product, ProductImage, ProductImageAssociation, Cart, CartItem,
    Category, Review, Like, Order, OrderItem
)
from .serializers import (
    LoginSerializer, ProductSerializer, UserSerializer, ProductImageSerializer,
    CartSerializer, CartItemSerializer, CategorySerializer, ReviewSerializer,
    LikeSerializer, OrderSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer, PaymentSerializer
)

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY

# Register User
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = serializer.save(password=request.data.get('password'))
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "User registered successfully",
                "user": UserSerializer(user).data,
                "token": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"email": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get or Update User Info
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "User updated successfully",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Login User
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    "message": "Login successful",
                    "token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Incorrect password"}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Password Reset Request
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset(request):
    serializer = PasswordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            reset_token = str(uuid.uuid4())
            user.password_reset_token = reset_token
            user.save()
            
            # Check if FRONTEND_URL is defined
            frontend_url = getattr(settings, 'FRONTEND_URL', None)
            if not frontend_url:
                logger.error("FRONTEND_URL is not defined in settings")
                return Response(
                    {"message": "Server configuration error: FRONTEND_URL is not set"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            reset_url = f"{frontend_url}/reset-password/{reset_token}"
            try:
                send_mail(
                    subject='Vintage Threads Password Reset',
                    message=f'Click the link to reset your password: {reset_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"Password reset email sent to {email} with token {reset_token}")
                return Response({"message": "Password reset email sent"}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error sending reset email to {email}: {str(e)}")
                return Response(
                    {"message": "Failed to send reset email. Please check email configuration."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except User.DoesNotExist:
            logger.warning(f"Password reset attempted for non-existent email: {email}")
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    logger.error(f"Password reset serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Password Reset Confirm
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        try:
            user = User.objects.get(password_reset_token=token)
            user.set_password(password)
            user.password_reset_token = None
            user.save()
            logger.info(f"Password reset successfully for user with token {token}")
            return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.warning(f"Invalid or expired password reset token: {token}")
            return Response({"message": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
    logger.error(f"Password reset confirm serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Token Refresh
class CustomTokenRefreshView(TokenRefreshView):
    pass

# Add Category
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_category(request):
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    if Category.objects.filter(name=request.data.get('name')).exists():
        return Response({"error": "A category with this name already exists"}, status=status.HTTP_400_BAD_REQUEST)
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        return Response({
            "message": "Category added successfully",
            "category": CategorySerializer(category).data
        }, status=status.HTTP_201_CREATED)
    logger.error(f"Serializer errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete Category
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_category(request, category_id):
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    try:
        category = Category.objects.get(id=category_id)
        if category.products.exists():
            return Response({"error": "Cannot delete category with associated products"}, status=status.HTTP_400_BAD_REQUEST)
        category.delete()
        return Response({"message": "Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Category.DoesNotExist:
        return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

# Category List
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

# Product List with Search and Category Filtering
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_list(request):
    if request.method == 'GET':
        search_query = request.GET.get('search', '')
        category_id = request.GET.get('category', None)
        products = Product.objects.prefetch_related('image_associations__product_image').all()
        if search_query:
            products = products.filter(name__icontains=search_query)
        if category_id:
            products = products.filter(category_id=category_id)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if request.user.role != 'admin':
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get Single Product
@api_view(['GET'])
@permission_classes([AllowAny])
def get_product(request, product_id):
    try:
        product = Product.objects.prefetch_related('image_associations__product_image').get(id=product_id)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

# Update Product
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    serializer = ProductSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        product = serializer.save()
        images = request.FILES.getlist('images')
        if images:
            ProductImageAssociation.objects.filter(product=product).delete()
            for index, image in enumerate(images):
                product_image = ProductImage.objects.create(image=image)
                ProductImageAssociation.objects.create(product=product, product_image=product_image, position=index)
        return Response({
            "message": "Product updated successfully",
            "product": serializer.data
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete Product
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    product.delete()
    return Response({"message": "Product deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# Add Product Image
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_product_image(request, product_id):
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    try:
        product = Product.objects.get(id=product_id)
        image = request.FILES.get('image')
        position = request.data.get('position', 0)
        if not image:
            return Response({"error": "Image is required"}, status=status.HTTP_400_BAD_REQUEST)
        product_image = ProductImage.objects.create(image=image)
        ProductImageAssociation.objects.create(
            product=product,
            product_image=product_image,
            position=position
        )
        return Response({
            "id": product_image.id,
            "image": product_image.image.url
        }, status=status.HTTP_201_CREATED)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        return Response({"error": f"Failed to upload image: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# Like a Product
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        like = Like.objects.filter(product=product, user=request.user).first()
        if like:
            like.delete()
            message = "Product unliked successfully"
            is_liked = False
        else:
            Like.objects.create(product=product, user=request.user)
            message = "Product liked successfully"
            is_liked = True
        like_count = product.user_likes.count()
        return Response({
            "message": message,
            "is_liked": is_liked,
            "likes": like_count
        }, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

# Add a Review
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_review(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        data = request.data.copy()
        data['product_id'] = product.id
        data['user_id'] = request.user.id
        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            review = serializer.save()
            return Response({
                "message": "Review added successfully",
                "review": serializer.data
            }, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

# Get User Cart
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_200_OK)

# Add Product to Cart
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))
    try:
        product = Product.objects.get(id=product_id)
        if quantity <= 0:
            return Response({"error": "Quantity must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
        if quantity > product.stock:
            return Response({"error": "Quantity exceeds available stock"}, status=status.HTTP_400_BAD_REQUEST)
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not item_created:
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response({"error": "Total quantity exceeds available stock"}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()
        cart.save()
        return Response({
            "message": item_created and "Product added to cart" or "Product quantity updated in cart"
        }, status=item_created and status.HTTP_201_CREATED or status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

# Remove Product from Cart
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request):
    product_id = request.data.get('product_id')
    try:
        cart = Cart.objects.get(user=request.user)
        cart_item = CartItem.objects.get(cart=cart, product__id=product_id)
        cart_item.delete()
        return Response({"message": "Item removed from cart"}, status=status.HTTP_200_OK)
    except Cart.DoesNotExist:
        return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

# Checkout with Order Creation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    logger.info(f"Checkout initiated for user {request.user.email}, cart ID: {cart.id}")
    if not cart.items.exists():
        logger.warning("Cart is empty")
        return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        cart_items = cart.items.select_for_update().all()
        total = sum(item.quantity * item.product.price for item in cart_items)
        order = Order.objects.create(user=request.user, total=total)
        for cart_item in cart_items:
            product = Product.objects.select_for_update().get(id=cart_item.product.id)
            quantity = cart_item.quantity
            logger.info(f"Checking product {product.id} - {product.name}: stock={product.stock}, quantity={quantity}")
            if quantity > product.stock:
                logger.error(f"Insufficient stock for {product.name}: {product.stock} available, {quantity} requested")
                return Response({
                    "error": f"Insufficient stock for product {product.name}. Available: {product.stock}, Requested: {quantity}"
                }, status=status.HTTP_400_BAD_REQUEST)
            product.stock -= quantity
            product.save()
            logger.info(f"Updated stock for {product.name}: new stock={product.stock}")
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price_at_time=product.price
            )
        cart.items.all().delete()
        cart.save()
        logger.info("Cart cleared after checkout")
    return Response({"message": "Checkout successful", "order_id": order.id}, status=status.HTTP_200_OK)

# Create Payment Intent
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    try:
        data = request.data
        order_id = data.get('order_id')
        amount = data.get('amount')  # Amount in cents
        order = Order.objects.get(id=order_id, user=request.user)
        if order.payment_status != 'pending':
            return Response({"error": "Order payment already processed"}, status=status.HTTP_400_BAD_REQUEST)
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            metadata={'order_id': order_id},
        )
        return Response({"client_secret": intent.client_secret}, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
    except stripe.error.StripeError as e:
        return Response({"error": f"Failed to create payment intent: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

# Process Payment
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    serializer = PaymentSerializer(data=request.data)
    if serializer.is_valid():
        order_id = serializer.validated_data['order_id']
        delivery_method = serializer.validated_data['delivery_method']
        payment_method = serializer.validated_data['payment_method']
        location = serializer.validated_data['location']
        zip_code = serializer.validated_data.get('zip_code', '')  # Not used in Option 1
        stripe_payment_intent_id = serializer.validated_data.get('stripe_payment_intent_id', '')
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status != 'pending':
            return Response({"error": "Order payment already processed"}, status=status.HTTP_400_BAD_REQUEST)
        order.delivery_method = delivery_method
        order.payment_method = payment_method
        order.location = location
        if payment_method == 'on_delivery':
            order.payment_status = 'pending'
        elif payment_method == 'card' and stripe_payment_intent_id:
            try:
                payment_intent = stripe.PaymentIntent.retrieve(stripe_payment_intent_id)
                if payment_intent.status == 'succeeded':
                    order.payment_status = 'completed'
                else:
                    return Response({"error": "Payment not completed"}, status=status.HTTP_400_BAD_REQUEST)
            except stripe.error.StripeError as e:
                return Response({"error": f"Payment verification failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "Invalid payment method or missing Stripe payment intent ID"}, status=status.HTTP_400_BAD_REQUEST)
        order.save()
        return Response({
            "message": "Payment processed successfully",
            "order_id": order.id,
            "payment_status": order.payment_status
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Get User Likes
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_likes(request):
    likes = Like.objects.filter(user=request.user)
    serializer = LikeSerializer(likes, many=True)
    return Response(serializer.data)

# Get User Orders
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_orders(request):
    if request.user.role == 'admin':
        orders = Order.objects.all()
    else:
        orders = Order.objects.filter(user=request.user)
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

# Dashboard Metrics
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    if request.user.role != 'admin':
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if start_date and end_date:
            try:
                naive_start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d')
                naive_end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d')
                start_date = timezone.make_aware(naive_start_date)
                end_date = timezone.make_aware(naive_end_date) + timedelta(days=1)
            except ValueError as e:
                logger.error(f"Date parsing error: {str(e)}")
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
        orders = Order.objects.filter(created_at__range=[start_date, end_date])
        total_sales = orders.aggregate(total=Sum('total'))['total'] or 0
        total_orders = orders.count()
        total_users = User.objects.count()
        active_carts = Cart.objects.filter(items__isnull=False, updated_at__range=[start_date, end_date]).distinct().count()
        orders_by_date = Order.objects.filter(created_at__range=[start_date, end_date])\
            .values('created_at__date')\
            .annotate(count=Count('id'))\
            .order_by('created_at__date')
        top_products = Product.objects.filter(orderitem__order__created_at__range=[start_date, end_date])\
            .annotate(total_sold=Sum('orderitem__quantity'))\
            .filter(total_sold__gt=0)\
            .order_by('-total_sold')[:5]
        top_products_data = []
        for product in top_products:
            serialized_product = ProductSerializer(product).data
            serialized_product['total_sold'] = product.total_sold
            serialized_product['revenue'] = float(product.total_sold * product.price) if product.total_sold and product.price else 0.0
            top_products_data.append(serialized_product)
        most_liked_products = Product.objects.filter(user_likes__created_at__range=[start_date, end_date])\
            .annotate(total_likes=Count('user_likes'))\
            .filter(total_likes__gt=0)\
            .order_by('-total_likes')[:5]
        total_likes = Like.objects.filter(created_at__range=[start_date, end_date]).count()
        total_reviews = Review.objects.filter(created_at__range=[start_date, end_date]).count()
        return Response({
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'total_users': total_users,
            'active_carts': active_carts,
            'orders_trend': [
                {'date': item['created_at__date'].strftime('%Y-%m-%d'), 'count': item['count']}
                for item in orders_by_date
            ],
            'top_products': top_products_data,
            'total_likes': total_likes,
            'total_reviews': total_reviews,
            'most_liked_products': ProductSerializer(most_liked_products, many=True).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in dashboard_metrics: {str(e)}", exc_info=True)
        return Response(
            {"error": "An unexpected error occurred while fetching dashboard metrics."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Get All Reviews
@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_reviews(request):
    reviews = Review.objects.all()
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)

# Delete a Review
@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_review(request, pk):
    try:
        review = Review.objects.get(pk=pk)
        review.delete()
        return Response({"message": "Review deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    except Review.DoesNotExist:
        return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)

# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        logger.info(f"PUT request data: {request.data}")
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        response_data = serializer.data
        logger.info(f"PUT response data: {response_data}")
        updated_instance = self.get_object()
        logger.info(f"Database state after update: {UserSerializer(updated_instance).data}")
        return Response(response_data)
    
@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_delivery(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        is_delivered = request.data.get('is_delivered')
        if is_delivered is None:
            return Response({"error": "is_delivered field is required"}, status=status.HTTP_400_BAD_REQUEST)
        order.is_delivered = is_delivered
        order.save()
        return Response({
            "message": f"Order {order_id} delivery status updated",
            "is_delivered": order.is_delivered
        }, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)