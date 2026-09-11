"""Iconos de la app: el emoji del billete sobre el azul de la marca.

NotoColorEmoji es una fuente de mapa de bits y solo se dibuja a 109 px, así que
el emoji se agranda con LANCZOS. Para que no se note, ocupa poco más de la mitad
del icono: agrandar 2,5 veces un dibujo plano aguanta bien.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT, exist_ok=True)

EMOJI = "💵"
FUENTE = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
TAM_NATIVO = 109
AZUL = (24, 119, 242)  # brand-500, el azul de Facebook


def dibujar_emoji() -> Image.Image:
    """El emoji recortado justo a su contenido, con fondo transparente."""
    fuente = ImageFont.truetype(FUENTE, TAM_NATIVO)
    lienzo = Image.new("RGBA", (TAM_NATIVO * 2, TAM_NATIVO * 2), (0, 0, 0, 0))
    ImageDraw.Draw(lienzo).text((20, 20), EMOJI, font=fuente, embedded_color=True)
    return lienzo.crop(lienzo.getbbox())


def render(size: int, ratio: float) -> Image.Image:
    fondo = Image.new("RGB", (size, size), AZUL)
    emoji = dibujar_emoji()

    ancho = int(size * ratio)
    alto = round(ancho * emoji.height / emoji.width)
    emoji = emoji.resize((ancho, alto), Image.LANCZOS)

    fondo.paste(emoji, ((size - ancho) // 2, (size - alto) // 2), emoji)
    return fondo


for size in (192, 512):
    render(size, 0.62).save(f"{OUT}/icon-{size}.png", optimize=True)
render(180, 0.62).save(f"{OUT}/apple-touch-icon.png", optimize=True)

# Maskable: Android recorta hasta un 20% de cada borde.
for size in (192, 512):
    render(size, 0.46).save(f"{OUT}/icon-maskable-{size}.png", optimize=True)

print("íconos regenerados")
