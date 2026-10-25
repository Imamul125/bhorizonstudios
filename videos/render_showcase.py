# Renders the scroll-scrubbed showcase video frames from the site's own artwork.
import sys, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT, OUT, W, H, FRAMES = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
os.makedirs(OUT, exist_ok=True)
portrait = H > W
u = min(W, H)

def rounded(img, r):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), r, fill=255)
    img = img.convert('RGBA'); img.putalpha(m); return img

def poster(path):
    im = Image.open(os.path.join(ROOT, path)).convert('RGB')
    im = im.resize((int(im.width * 1100 / im.height), 1100), Image.LANCZOS)
    im = rounded(im, 60)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1, 1, im.width - 2, im.height - 2), 60, outline=(70, 70, 74, 255), width=4)
    return im

def icon(path):
    im = Image.open(os.path.join(ROOT, path)).convert('RGB').resize((900, 900), Image.LANCZOS)
    return rounded(im, 200)

# Left to right in the final row
ICONS = [icon('images/lastbrick_icon.jpg'), icon('images/mindolock_icon.jpg'), icon('images/killcode_icon.webp'), icon('images/arrowescape_icon.jpg')]
SLOTS = [-1.5, -0.5, 0.5, 1.5]
POSTERS = [poster('images/lastbrick_ss1.jpg'), poster('images/mindolock_ss1.jpg'), poster('images/screenshot3.jpg')]

def glow(color, size=600):
    g = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse((size * .25, size * .25, size * .75, size * .75), fill=color + (255,))
    return g.filter(ImageFilter.GaussianBlur(size * .12))
GLOWS = [glow((255, 122, 47)), glow((34, 211, 166)), glow((245, 165, 36))]

def ease(t): return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def seg(t, a, b): return ease(min(1, max(0, (t - a) / (b - a))))
def lerp(a, b, k): return a + (b - a) * k

def place(canvas, img, cx, cy, h, rot=0, alpha=1.0, bright=1.0):
    if alpha <= 0.01 or h < 2: return
    w = img.width * h / img.height
    if w > W * 8: return
    im = img.resize((max(1, int(w)), max(1, int(h))), Image.LANCZOS)
    if bright < 0.999:
        a = im.getchannel('A'); im = ImageEnhance.Brightness(im.convert('RGB')).enhance(bright).convert('RGBA'); im.putalpha(a)
    if rot: im = im.rotate(rot, Image.BICUBIC, expand=True)
    if alpha < 1: im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

# Layout keyframes, in units of u (shorter side)
if portrait:
    L = dict(row_y=.5, row_gap=.25, row_size=.2, top_y=.085 * H / u, top_gap=.17, top_size=.12, start_size=.78,
             post_y=.56 * H / u, post_c=1.02, post_s=.86, side_x1=.40, side_x2=.50, rot1=6, rot2=9)
else:
    L = dict(row_y=.5, row_gap=.3, row_size=.24, top_y=.12, top_gap=.15, top_size=.11, start_size=.78,
             post_y=.6, post_c=.68, post_s=.58, side_x1=.44, side_x2=.62, rot1=6, rot2=10)

for f in range(FRAMES):
    t = f / (FRAMES - 1)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    k1, k2, k3 = seg(t, 0, .32), seg(t, .36, .6), seg(t, .62, .92)
    cam = 1 + .06 * seg(t, .55, 1)
    cx0, cy0 = W / 2, H / 2
    def C(x, y): return cx0 + (x - cx0) * cam, cy0 + (y - cy0) * cam

    # Glows behind the icons / posters
    gk = lerp(.45, 1, k1) * (1 - .4 * k2)
    for i, g in enumerate(GLOWS):
        off = (i - 1) * lerp(L['row_gap'], L['side_x2'], k2) * u
        gy = lerp(L['row_y'] * u if not portrait else H / 2, L['post_y'] * u, k2)
        place(canvas, g, *C(cx0 + off, gy), u * lerp(.9, 1.3, k2) * cam, alpha=gk * (.55 if i != 1 else .7))

    # Posters rise and fan out
    for i in (0, 2, 1):
        side = i - 1
        y = lerp(L['post_y'] * u + u * .9, L['post_y'] * u, k2)
        if side == 0:
            h, x, rot, br = lerp(L['post_c'] * .9, L['post_c'], k2) * u + .04 * u * k3, cx0, 0, 1
        else:
            x = cx0 + side * lerp(L['side_x1'] * .6, L['side_x1'], k2) * u + side * (L['side_x2'] - L['side_x1']) * u * k3
            h = lerp(L['post_s'], L['post_s'] * 1.08, k3) * u
            rot = -side * lerp(L['rot1'], L['rot2'], k3)
            br = lerp(.55, .85, k3)
        place(canvas, POSTERS[i], *C(x, y), h * cam, rot, alpha=k2, bright=br)

    # Icons: Mindolock starts large with its neighbours peeking in, then all
    # four settle into a row, then move up to the top
    for i in (3, 0, 2, 1):
        slot = SLOTS[i]
        y = L['row_y'] * u if not portrait else H / 2
        if i == 1:    # Mindolock
            size = lerp(L['start_size'], L['row_size'], k1) * u
            x0, a = cx0, 1
        elif i == 2:  # Kill Code slides out from behind Mindolock
            size = L['row_size'] * u
            x0, a = cx0, k1
        else:         # Last Brick / Arrow Escape start at the edges
            size = L['row_size'] * u
            x0, a = cx0 + (1 if slot > 0 else -1) * .46 * W, 1
        x = lerp(x0, cx0 + slot * L['row_gap'] * u, k1)
        size = lerp(size, L['top_size'] * u, k2)
        x = lerp(x, cx0 + slot * L['top_gap'] * u, k2)
        y = lerp(y, L['top_y'] * u, k2)
        place(canvas, ICONS[i], *C(x, y), size * cam, alpha=a)

    canvas.convert('RGB').save(f'{OUT}/f{f:04d}.jpg', quality=92)
print('done', FRAMES)
