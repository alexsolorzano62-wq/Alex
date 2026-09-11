"""Íconos de la app: el As de $.

Son dos dibujos, no uno. La carta completa tiene cinco elementos y a 32 píxeles
se vuelve un borrón, así que los tamaños chicos usan una versión simplificada:
solo el signo peso sobre el azul. El manifiesto elige el archivo según el
tamaño que necesite.
"""
import os
from PIL import Image, ImageDraw, ImageFont

SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT, exist_ok=True)

AZUL = (24, 119, 242)       # brand-500
AZUL_HONDO = (10, 46, 107)  # brand-900
VERDE = (5, 150, 105)
CARTA = (247, 249, 252)
SS = 4  # supermuestreo, para que los bordes salgan limpios

# Proporciones del naipe, sobre el alto de la carta.
A_ALTO, PALO_CHICO, PALO_GRANDE = 0.17, 0.10, 0.42
INDICE_X, A_Y, PALO_Y = 0.20, 0.135, 0.29


def glifo(d, cx, cy, texto, px, color):
    d.text((cx, cy), texto, font=ImageFont.truetype(SERIF, px), fill=color, anchor="mm")


def completo(size, margen=0.07):
    """La carta entera, para los tamaños donde se aprecia el detalle."""
    s = size * SS
    base = Image.new("RGB", (s, s), AZUL)
    d = ImageDraw.Draw(base)

    alto = s - 2 * int(s * margen)
    ancho = int(alto * 0.72)
    x0, y0 = (s - ancho) // 2, (s - alto) // 2
    d.rounded_rectangle([x0, y0, x0 + ancho, y0 + alto],
                        radius=int(ancho * 0.085), fill=CARTA)

    ix = x0 + int(ancho * INDICE_X)
    indices = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    di = ImageDraw.Draw(indices)
    glifo(di, ix, y0 + int(alto * A_Y), "A", int(alto * A_ALTO), AZUL_HONDO)
    glifo(di, ix, y0 + int(alto * PALO_Y), "$", int(alto * PALO_CHICO), VERDE)

    base.paste(indices, (0, 0), indices)
    girados = indices.rotate(180, center=(s / 2, s / 2))
    base.paste(girados, (0, 0), girados)

    glifo(d, s // 2, s // 2, "$", int(alto * PALO_GRANDE), VERDE)
    return base.resize((size, size), Image.LANCZOS)


def simple(size):
    """Solo el peso sobre el azul: lo único que sobrevive a 32 píxeles."""
    s = size * SS
    base = Image.new("RGB", (s, s), AZUL)
    glifo(ImageDraw.Draw(base), s // 2, s // 2, "$", int(s * 0.62), CARTA)
    return base.resize((size, size), Image.LANCZOS)


# Tamaños grandes: la carta. El de 96 y para abajo: el simplificado.
completo(512).save(f"{OUT}/icon-512.png", optimize=True)
completo(192).save(f"{OUT}/icon-192.png", optimize=True)
completo(180).save(f"{OUT}/apple-touch-icon.png", optimize=True)
simple(96).save(f"{OUT}/icon-96.png", optimize=True)

# Maskable: Android recorta hasta un quinto de cada borde, así que la carta
# necesita más aire alrededor para no perder los índices.
completo(512, margen=0.20).save(f"{OUT}/icon-maskable-512.png", optimize=True)
completo(192, margen=0.20).save(f"{OUT}/icon-maskable-192.png", optimize=True)

print("íconos regenerados")
