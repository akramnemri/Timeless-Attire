# In Django shell
from models import ProductImage
from PIL import Image
from io import BytesIO
from django.core.files import File

for img in ProductImage.objects.all():
    if img.image:
        pil_img = Image.open(img.image)
        output_size = (300, 300)
        pil_img = pil_img.resize(output_size, Image.LANCZOS)
        buffer = BytesIO()
        pil_img.save(buffer, format='JPEG', quality=85)
        img.image.save(img.image.name, File(buffer))
        
        
# In Django shell
from models import ProductImageAssociation
associations = ProductImageAssociation.objects.all()
seen = set()
for assoc in associations:
    key = (assoc.product_id, assoc.product_image_id)
    if key in seen:
        assoc.delete()
    else:
        seen.add(key)
        
