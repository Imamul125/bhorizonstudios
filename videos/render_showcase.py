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

def icon(path):
    im = Image.open(os.path.join(ROOT, path)).convert('RGB').resize((900, 900), Image.LANCZOS)
    return rounded(im, 200)

# Left to right in the final row
ICONS = [icon('images/lastbrick_icon.jpg'), icon('images/mindolock_icon.jpg'), icon('images/killcode_icon.webp'), icon('images/arrowescape_icon.jpg')]
SLOTS = [-1.5, -0.5, 0.5, 1.5]

def glow(color, size=600):
    g = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse((size * .25, size * .25, size * .75, size * .75), fill=color + (255,))
    return g.filter(ImageFilter.GaussianBlur(size * .12))

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

# Layout keyframes, in units of u (shorter side). Final layout: a row on wide
# screens, a 2x2 grid on tall ones.
if portrait:
    L = dict(row_gap=.25, row_size=.2, start_size=.78, final_size=.36)
    FINAL = [(-.23, -.23), (.23, -.23), (-.23, .23), (.23, .23)]
else:
    L = dict(row_gap=.3, row_size=.24, start_size=.78, final_size=.3)
    FINAL = [(slot * .36, 0) for slot in SLOTS]

GLOW4 = [glow((255, 122, 47)), glow((34, 211, 166)), glow((70, 110, 255)), glow((245, 165, 36))]

for f in range(FRAMES):
    t = f / (FRAMES - 1)
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    k1, k2 = seg(t, 0, .4), seg(t, .45, .78)
    cam = 1 + .05 * seg(t, .7, 1)
    cx0, cy0 = W / 2, H / 2
    def C(x, y): return cx0 + (x - cx0) * cam, cy0 + (y - cy0) * cam

    # Mindolock starts large with its neighbours peeking in, all four settle
    # into a row, then spread into the final layout with a glow behind each
    spots = []
    for i in range(4):
        slot = SLOTS[i]
        if i == 1:    # Mindolock
            size, x0, a = lerp(L['start_size'], L['row_size'], k1) * u, cx0, 1
        elif i == 2:  # Kill Code slides out from behind Mindolock
            size, x0, a = L['row_size'] * u, cx0, k1
        else:         # Last Brick / Arrow Escape start at the edges
            size, x0, a = L['row_size'] * u, cx0 + (1 if slot > 0 else -1) * .46 * W, 1
        x, y = lerp(x0, cx0 + slot * L['row_gap'] * u, k1), cy0
        fx, fy = FINAL[i]
        x, y = lerp(x, cx0 + fx * u, k2), lerp(y, cy0 + fy * u, k2)
        size = lerp(size, L['final_size'] * u, k2)
        spots.append((x, y, size, a))

    for i, (x, y, size, a) in enumerate(spots):
        glow_alpha = lerp(.35, .55, k1) + .35 * k2
        place(canvas, GLOW4[i], *C(x, y), size * 3.2 * cam, alpha=glow_alpha * a)
    for i in (3, 0, 2, 1):
        x, y, size, a = spots[i]
        place(canvas, ICONS[i], *C(x, y), size * cam, alpha=a)

    canvas.convert('RGB').save(f'{OUT}/f{f:04d}.jpg', quality=92)
print('done', FRAMES)
