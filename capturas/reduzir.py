"""Reduz as capturas para o repositório: PNG 3x vira JPEG de 780 px (q78) e o PNG sai."""
import glob
import os

from PIL import Image

for path in glob.glob('docs/imagens/capturas/*/*.png'):
    image = Image.open(path).convert('RGB')
    width, height = image.size
    image = image.resize((780, round(height * 780 / width)), Image.LANCZOS)
    image.save(path[:-4] + '.jpg', quality=78, optimize=True)
    os.remove(path)
