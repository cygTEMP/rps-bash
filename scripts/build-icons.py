"""Draws the placeholder app icons (three hand-shape cards on felt) into assets/.
Run with: python3 scripts/build-icons.py  (needs Pillow and the Noto Color Emoji font)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'assets'
FONT = ImageFont.truetype('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', 109)
FELT = (22, 88, 75, 255)
CARD = (255, 244, 224, 255)
EDGE = (231, 211, 176, 255)
HANDS = ['✊', '✋', '✌️']


def emoji(ch, size):
    img = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((80, 80), ch, font=FONT, embedded_color=True, anchor='mm')
    img = img.crop(img.getbbox())
    scale = size / max(img.size)
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def cards(size, mono=False):
    """Three tilted cards fanned out, drawn on a transparent square."""
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cw, ch = int(size * 0.30), int(size * 0.39)
    for i, (hand, angle) in enumerate(zip(HANDS, [12, 0, -12])):
        card = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        d = ImageDraw.Draw(card)
        fill = (255, 255, 255, 255) if mono else CARD
        d.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=cw // 7, fill=fill,
                            outline=None if mono else EDGE, width=max(2, cw // 40))
        e = emoji(hand, int(cw * 0.66))
        if mono:
            # Cut the hand out of the white card so the monochrome icon keeps its shape.
            hole = Image.new('RGBA', e.size, (0, 0, 0, 0))
            card.paste(hole, ((cw - e.width) // 2, (ch - e.height) // 2), e.split()[3])
        else:
            card.alpha_composite(e, ((cw - e.width) // 2, (ch - e.height) // 2))
        card = card.rotate(angle, expand=True, resample=Image.BICUBIC)
        x = int(size * (0.5 + (i - 1) * 0.27)) - card.width // 2
        y = int(size * (0.53 if i != 1 else 0.48)) - card.height // 2
        layer.alpha_composite(card, (x, y))
    return layer


def solid(size, color):
    return Image.new('RGBA', (size, size), color)


# Full icon (iOS and the store listing).
icon = solid(1024, FELT)
icon.alpha_composite(cards(1024))
icon.convert('RGB').save(OUT / 'icon.png')

# Android adaptive icon: content within the central safe zone of the foreground.
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg.alpha_composite(cards(700), (162, 162))
fg.save(OUT / 'android-icon-foreground.png')
solid(1024, FELT).save(OUT / 'android-icon-background.png')
mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
mono.alpha_composite(cards(700, mono=True), (162, 162))
mono.save(OUT / 'android-icon-monochrome.png')

# Splash image, drawn on the felt background colour set in app.json.
cards(1024).save(OUT / 'splash-icon.png')

icon.resize((48, 48), Image.LANCZOS).convert('RGB').save(OUT / 'favicon.png')
print('Wrote icons to', OUT)
