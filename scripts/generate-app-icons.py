from __future__ import annotations

import base64
import io
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "public" / "icons"
SVG_PATH = ICONS_DIR / "app-icon.svg"


def load_embedded_logo() -> Image.Image:
    svg = SVG_PATH.read_text(encoding="utf-8")
    match = re.search(
        r"<image[^>]+href=[\"']data:image/(?:png|jpeg|jpg);base64,([^\"']+)",
        svg,
        flags=re.IGNORECASE,
    )
    if not match:
        raise RuntimeError("Imagem incorporada não encontrada em public/icons/app-icon.svg")

    raw = base64.b64decode(match.group(1))
    image = Image.open(io.BytesIO(raw))
    image.load()
    return image.convert("RGBA")


def render_icon(source: Image.Image, size: int, safe_area: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (7, 17, 31, 255))
    max_dimension = max(1, int(size * safe_area))
    logo = source.copy()
    logo.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas.convert("RGB")


def save_and_validate(image: Image.Image, path: Path, expected_size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    with Image.open(path) as validation:
        if validation.format != "PNG" or validation.size != (expected_size, expected_size):
            raise RuntimeError(f"Ícone inválido gerado em {path}")


def main() -> None:
    source = load_embedded_logo()
    outputs = [
        ("app-icon-512.png", 512, 0.86),
        ("app-icon-192.png", 192, 0.86),
        ("app-icon-maskable-512.png", 512, 0.68),
        ("apple-touch-icon.png", 180, 0.82),
    ]

    for filename, size, safe_area in outputs:
        save_and_validate(
            render_icon(source, size=size, safe_area=safe_area),
            ICONS_DIR / filename,
            expected_size=size,
        )

    print("Ícones PNG válidos gerados para Android, Windows e PWA.")


if __name__ == "__main__":
    main()
