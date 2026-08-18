"""Iconos PWA del sistema de prestamos: una pila de monedas."""
import os
from PIL import Image, ImageDraw

OUT = "/home/user/Alex/prestamos/public/icons"
os.makedirs(OUT, exist_ok=True)

BRAND = (67, 56, 202)   # brand-600 #4338ca
WHITE = (255, 255, 255)
SS = 8

RX, RY = 34, 11
CENTROS = [70, 52, 34]          # de abajo hacia arriba
BBOX = (16, 23, 84, 81)


def render(size, ratio, bg, fg):
    s = size * SS
    img = Image.new("RGB", (s, s), bg)
    draw = ImageDraw.Draw(img)

    ancho = BBOX[2] - BBOX[0]
    alto = BBOX[3] - BBOX[1]
    escala = (s * ratio) / ancho
    off_x = (s - ancho * escala) / 2 - BBOX[0] * escala
    off_y = (s - alto * escala) / 2 - BBOX[1] * escala
    grosor = max(1, round(4.5 * escala))

    for cy in CENTROS:  # el de arriba tapa al de abajo: da sensacion de pila
        x0 = off_x + (50 - RX) * escala
        y0 = off_y + (cy - RY) * escala
        x1 = off_x + (50 + RX) * escala
        y1 = off_y + (cy + RY) * escala
        draw.ellipse([x0, y0, x1, y1], fill=bg, outline=fg, width=grosor)

    return img.resize((size, size), Image.LANCZOS)


for size in (192, 512):
    render(size, 0.70, BRAND, WHITE).save(f"{OUT}/icon-{size}.png", optimize=True)
render(180, 0.70, BRAND, WHITE).save(f"{OUT}/apple-touch-icon.png", optimize=True)
for size in (192, 512):
    render(size, 0.52, BRAND, WHITE).save(f"{OUT}/icon-maskable-{size}.png", optimize=True)
