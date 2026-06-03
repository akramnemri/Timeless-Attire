from rest_framework import serializers
from .models import User, Product, ProductImage, ProductImageAssociation, Cart, CartItem, Category, Review, Like, Order, OrderItem

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role']
        read_only_fields = ['id', 'username', 'role']
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
        }

    def get_role(self, obj):
        return obj.role

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data.get('username', ''),
            password=validated_data.get('password'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
        )
        return user

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()
        return instance

# Login Serializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        if not data.get('email'):
            raise serializers.ValidationError("Email is required.")
        if not data.get('password'):
            raise serializers.ValidationError("Password is required.")
        return data

# Password Reset Serializer
class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email.")
        return value

# Password Reset Confirm Serializer
class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

# Category Serializer
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'created_at', 'updated_at']
        extra_kwargs = {'slug': {'required': False, 'read_only': True}}

    def validate_name(self, value):
        if Category.objects.filter(name=value).exists():
            raise serializers.ValidationError("A category with this name already exists.")
        return value

# Review Serializer
class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    product = serializers.SerializerMethodField()
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Review
        fields = ['id', 'product', 'product_id', 'user', 'user_id', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user(self, obj):
        return {'id': obj.user.id, 'email': obj.user.email}

    def get_product(self, obj):
        return {'id': obj.product.id, 'name': obj.product.name}

# Product Image Serializers
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'created_at']

class ProductImageAssociationSerializer(serializers.ModelSerializer):
    product_image = ProductImageSerializer()

    class Meta:
        model = ProductImageAssociation
        fields = ['product_image', 'position']

# Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageAssociationSerializer(many=True, source='image_associations', read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    reviews = ReviewSerializer(many=True, read_only=True)
    total_likes = serializers.IntegerField(read_only=True, required=False)
    size = serializers.ChoiceField(choices=Product.SIZE_CHOICES)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'stock', 'price', 'category', 'category_id', 'size', 'images', 'total_likes', 'reviews', 'created_at', 'updated_at']

    def create(self, validated_data):
        product = Product.objects.create(**validated_data)
        return product

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.stock = validated_data.get('stock', instance.stock)
        instance.price = validated_data.get('price', instance.price)
        instance.category = validated_data.get('category', instance.category)
        instance.size = validated_data.get('size', instance.size)
        instance.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        seen = set()
        unique_images = []
        for image_assoc in representation['images']:
            img_id = image_assoc['product_image']['id']
            if img_id not in seen:
                seen.add(img_id)
                unique_images.append(image_assoc)
        representation['images'] = unique_images
        representation['price'] = float(representation['price'])
        return representation

# Cart Serializers
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'created_at', 'updated_at']

# Like Serializer
class LikeSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ['id', 'product', 'created_at']

# Order Serializers
class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price_at_time']

class OrderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'created_at', 'total', 'items',
            'payment_status', 'delivery_method', 'payment_method',
            'location', 'is_delivered'
        ]

# Payment Serializer
class PaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    delivery_method = serializers.ChoiceField(choices=Order.DELIVERY_METHOD_CHOICES)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    location = serializers.CharField(max_length=255)
    zip_code = serializers.CharField(max_length=10, required=False, allow_blank=True)  # Added for ZIP code
    stripe_payment_intent_id = serializers.CharField(max_length=100, required=False, allow_blank=True)