from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import AbstractUser, BaseUserManager
from decimal import Decimal
import os
import re
from django.utils.text import slugify
from PIL import Image
from io import BytesIO
from django.core.files import File
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator

# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        if 'username' not in extra_fields or not extra_fields['username']:
            extra_fields['username'] = email.split('@')[0]
            base_username = extra_fields['username']
            suffix = 1
            while User.objects.filter(username=extra_fields['username']).exists():
                extra_fields['username'] = f"{base_username}{suffix}"
                suffix += 1
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

# User Model
class User(AbstractUser):
    email = models.EmailField(max_length=254, unique=True, blank=False, null=False, verbose_name='email address')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('user', 'User')], default='user')
    password_reset_token = models.CharField(max_length=36, blank=True, null=True)
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

# Category Model
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
            base_slug = self.slug
            suffix = 1
            while Category.objects.filter(slug=self.slug).exclude(id=self.id).exists():
                self.slug = f"{base_slug}-{suffix}"
                suffix += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# ProductImage Model
class ProductImage(models.Model):
    image = models.ImageField(upload_to='product_images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.image:
            # Clean filename
            filename = self.image.name
            clean_filename = re.sub(r'[^a-zA-Z0-9._]', '_', filename)
            base, ext = os.path.splitext(clean_filename)
            counter = 1
            while os.path.exists(os.path.join('media/product_images/', clean_filename)):
                clean_filename = f"{base}_{counter}{ext}"
                counter += 1
            self.image.name = clean_filename

            # Process image
            img = Image.open(self.image)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img.convert('RGB'))
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            output_size = (350, 350)
            img = img.resize(output_size, Image.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            self.image.save(self.image.name, File(buffer), save=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image {self.id} ({self.image.name})"

class ProductImageAssociation(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='image_associations')
    product_image = models.ForeignKey(ProductImage, on_delete=models.CASCADE, related_name='product_associations')
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position']
        unique_together = ('product', 'product_image')

    def __str__(self):
        return f"Image {self.product_image.id} for Product {self.product.id}"

    def clean(self):
        if ProductImageAssociation.objects.filter(
            product=self.product,
            product_image=self.product_image
        ).exclude(id=self.id).exists():
            raise ValidationError('This image is already associated with this product.')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

# Product Model
class Product(models.Model):
    SIZE_CHOICES = [
        ('S', 'Small'),
        ('M', 'Medium'),
        ('L', 'Large'),
        ('XL', 'Extra Large'),
        ('XXL', 'Double Extra Large'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField()
    stock = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('15.99'))])
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    size = models.CharField(max_length=3, choices=SIZE_CHOICES, default='M')
    images = models.ManyToManyField(ProductImage, through=ProductImageAssociation, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.size})"

    @property
    def likes(self):
        return self.user_likes.count()

# Like Model
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='user_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.user.email} likes {self.product.name}"

# Review Model
class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review by {self.user.email} on {self.product.name}"

# Cart Model
class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"

# CartItem Model
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in cart"

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    DELIVERY_METHOD_CHOICES = [
        ('standard', 'Standard Shipping'),
        ('express', 'Express Shipping'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Card'),
        ('on_delivery', 'On Delivery'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHOD_CHOICES, blank=True, null=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    is_delivered = models.BooleanField(default=False, verbose_name='Delivered')

    def __str__(self):
        return f"Order {self.id} by {self.user.email}"
    

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.product.name} in Order {self.order.id}"