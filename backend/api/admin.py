from django.contrib import admin
from .models import (
    User, Category, Product, ProductImage, ProductImageAssociation,
    Like, Review, Cart, CartItem, Order, OrderItem
)

# Inline for Order Items
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'quantity', 'price_at_time')
    readonly_fields = ('product', 'quantity', 'price_at_time')
    can_delete = False

# Order Admin
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user_email', 'user_full_name', 'location', 'delivery_method',
        'created_at', 'total', 'payment_status', 'is_delivered'
    )
    list_filter = ('payment_status', 'delivery_method', 'is_delivered', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'location', 'id')
    inlines = [OrderItemInline]
    readonly_fields = (
        'user', 'created_at', 'total', 'payment_status', 'payment_method', 'location'
    )
    fieldsets = (
        ('Order Details', {
            'fields': ('user', 'created_at', 'total', 'payment_status', 'payment_method')
        }),
        ('Delivery Information', {
            'fields': ('location', 'delivery_method', 'is_delivered')
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'

    def user_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    user_full_name.short_description = 'User Name'
    user_full_name.admin_order_field = 'user__first_name'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items__product')

# Existing registrations
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('role', 'is_staff')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'size', 'created_at')
    list_filter = ('category', 'size')
    search_fields = ('name', 'description')

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'image', 'created_at')
    search_fields = ('image',)

@admin.register(ProductImageAssociation)
class ProductImageAssociationAdmin(admin.ModelAdmin):
    list_display = ('product', 'product_image', 'position')
    list_filter = ('product',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__email',)

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity')
    list_filter = ('cart',)
    search_fields = ('product__name',)

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    list_filter = ('product',)
    search_fields = ('user__email', 'product__name')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'comment', 'created_at')
    list_filter = ('product',)
    search_fields = ('user__email', 'product__name', 'comment')