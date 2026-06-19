from __future__ import annotations

from pathlib import Path
import textwrap

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


COLORS = {
    "ink": "#111827",
    "muted": "#5B6472",
    "paper": "#F7FAFC",
    "card": "#FFFFFF",
    "line": "#D9E2EC",
    "telegram": "#2AABEE",
    "calendar": "#18A058",
    "amber": "#F59E0B",
    "violet": "#7C3AED",
}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("C:/Windows/Fonts") / name,
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default()


FONT_REG = font("arial.ttf", 34)
FONT_MED = font("arial.ttf", 44)
FONT_BOLD = font("arialbd.ttf", 64)
FONT_HERO = font("arialbd.ttf", 82)
FONT_HERO_OG = font("arialbd.ttf", 74)
FONT_SMALL = font("arial.ttf", 28)
FONT_TINY = font("arial.ttf", 22)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy, content, fill, font_obj, **kwargs):
    draw.text(xy, content, fill=fill, font=font_obj, **kwargs)


def wrap_lines(content: str, width: int) -> list[str]:
    return textwrap.wrap(content, width=width)


def chat_bubble(draw, x, y, w, content, fill, fg, align="left"):
    lines = wrap_lines(content, 26)
    h = 38 + 36 * len(lines)
    rounded(draw, (x, y, x + w, y + h), 24, fill)
    yy = y + 20
    for line in lines:
        tx = x + 24
        if align == "right":
            bbox = draw.textbbox((0, 0), line, font=FONT_SMALL)
            tx = x + w - 24 - (bbox[2] - bbox[0])
        text(draw, (tx, yy), line, fg, FONT_SMALL)
        yy += 36
    return h


def draw_chat_panel(draw, x, y, w, h):
    rounded(draw, (x, y, x + w, y + h), 32, COLORS["card"], COLORS["line"], 2)
    text(draw, (x + 34, y + 26), "Telegram", COLORS["telegram"], FONT_MED)
    text(draw, (x + 34, y + 80), "Founder Chat", COLORS["muted"], FONT_TINY)
    chat_bubble(draw, x + 34, y + 132, w - 86, "Can we do a demo next Monday at 11:00?", "#EAF7FF", COLORS["ink"])
    chat_bubble(draw, x + 116, y + 270, w - 150, "Yes, works for me.", "#DCFCE7", COLORS["ink"], align="right")
    rounded(draw, (x + 34, y + h - 86, x + w - 34, y + h - 34), 18, "#FFF7ED")
    text(draw, (x + 58, y + h - 75), "Caught: demo, Monday, 11:00", COLORS["ink"], FONT_TINY)


def draw_calendar_panel(draw, x, y, w, h):
    rounded(draw, (x, y, x + w, y + h), 32, COLORS["card"], COLORS["line"], 2)
    text(draw, (x + 34, y + 26), "Google Calendar", COLORS["calendar"], FONT_MED)
    rounded(draw, (x + 34, y + 112, x + w - 34, y + h - 34), 26, "#ECFDF5")
    text(draw, (x + 62, y + 146), "Demo call", COLORS["ink"], FONT_BOLD)
    text(draw, (x + 64, y + 236), "Monday, Jun 22", COLORS["muted"], FONT_REG)
    text(draw, (x + 64, y + 290), "11:00 AM - 11:45 AM", COLORS["muted"], FONT_REG)
    rounded(draw, (x + 64, y + 365, x + 262, y + 415), 18, COLORS["calendar"])
    text(draw, (x + 88, y + 374), "Created", "#FFFFFF", FONT_SMALL)


def draw_og_flow_card(draw, x, y, w, h):
    rounded(draw, (x, y, x + w, y + h), 34, COLORS["card"], COLORS["line"], 2)
    text(draw, (x + 36, y + 30), "Telegram message", COLORS["telegram"], FONT_SMALL)
    rounded(draw, (x + 36, y + 84, x + w - 36, y + 188), 26, "#EAF7FF")
    text(draw, (x + 62, y + 104), "Demo next Monday", COLORS["ink"], FONT_REG)
    text(draw, (x + 62, y + 146), "at 11:00?", COLORS["ink"], FONT_REG)

    rounded(draw, (x + 204, y + 206, x + 318, y + 254), 24, COLORS["amber"])
    text(draw, (x + 240, y + 215), "to", "#FFFFFF", FONT_SMALL)

    text(draw, (x + 36, y + 286), "Google Calendar event", COLORS["calendar"], FONT_SMALL)
    rounded(draw, (x + 36, y + 328, x + w - 36, y + h - 34), 26, "#ECFDF5")
    text(draw, (x + 62, y + 348), "Demo call", COLORS["ink"], FONT_MED)
    text(draw, (x + 64, y + 402), "Mon, Jun 22  -  11:00 AM", COLORS["muted"], FONT_SMALL)


def generate_og():
    img = Image.new("RGB", (1200, 630), COLORS["paper"])
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 1200, 80), fill=COLORS["ink"])
    text(draw, (52, 24), "Telegram Meeting Catcher", "#FFFFFF", FONT_SMALL)
    rounded(draw, (882, 18, 1148, 62), 22, COLORS["telegram"])
    text(draw, (913, 25), "Open-source agent", "#FFFFFF", FONT_TINY)

    text(draw, (54, 128), "Catch meetings", COLORS["ink"], FONT_HERO_OG)
    text(draw, (54, 210), "before they", COLORS["ink"], FONT_HERO_OG)
    text(draw, (54, 292), "disappear.", COLORS["ink"], FONT_HERO_OG)
    text(draw, (58, 404), "Telegram chats become", COLORS["muted"], FONT_REG)
    text(draw, (58, 454), "Google Calendar events.", COLORS["muted"], FONT_REG)

    draw_og_flow_card(draw, 650, 104, 500, 470)

    rounded(draw, (54, 540, 426, 596), 28, COLORS["calendar"])
    text(draw, (86, 552), "Catch Meeting From Chat", "#FFFFFF", FONT_SMALL)

    ASSETS.mkdir(exist_ok=True)
    img.save(ASSETS / "og-image.png", quality=96)


def generate_demo():
    img = Image.new("RGB", (1600, 900), COLORS["paper"])
    draw = ImageDraw.Draw(img)
    text(draw, (70, 54), "How Telegram Meeting Catcher works", COLORS["ink"], FONT_HERO)
    text(draw, (74, 154), "A clear meeting plan appears in chat. The event lands in your calendar.", COLORS["muted"], FONT_REG)

    draw_chat_panel(draw, 86, 244, 560, 520)
    rounded(draw, (700, 462, 900, 532), 35, COLORS["amber"])
    text(draw, (762, 477), "catch", "#FFFFFF", FONT_MED)
    draw_calendar_panel(draw, 954, 244, 560, 520)

    text(draw, (122, 802), "1. Watch allowlisted chats", COLORS["muted"], FONT_TINY)
    text(draw, (700, 802), "2. Extract committed meetings", COLORS["muted"], FONT_TINY)
    text(draw, (1036, 802), "3. Create or review events", COLORS["muted"], FONT_TINY)

    ASSETS.mkdir(exist_ok=True)
    img.save(ASSETS / "demo-flow.png", quality=96)


if __name__ == "__main__":
    generate_og()
    generate_demo()
    print("generated assets/og-image.png and assets/demo-flow.png")
