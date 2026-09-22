"""
Build the short, silent, looping clips that sit on a service card.

Run from `frontend/`, with the static export served locally so the page can
reach the bundled font:

    npm run build
    (cd out && python -m http.server 3399)
    python scripts/make_service_clips.py            # all of them
    python scripts/make_service_clips.py ac-service # or just one, while tuning

It needs two things that are deliberately not project dependencies — this
runs when somebody changes a clip, not on every install:

    Chrome    draws the frames. CHROME below, or the env var.
    ffmpeg    encodes them. `npx ffmpeg-static` in a scratch folder is
              enough; point FFMPEG at wherever it landed.

These are drawn, not shot, and that was a decision rather than an accident:
there is no footage of this business's work, and the free stock libraries have
none either — searched wide, and what comes back for "washing machine repair"
is laundromats, tidy kitchens and car garages. A stranger's hands in a foreign
kitchen would be a picture of somebody else's business. So each clip animates
the app's own drawing of the appliance doing the thing the service actually
does: a jet crossing a coil and the grime going with it, a gauge filling, a
bolt turning, a diagnostic settling from red to green. Swap any of them for
real footage the day it exists — nothing downstream cares which it is.

Everything animated is periodic in `t`: sin and cos over whole turns, sweeps
that leave the frame exactly as they re-enter, and dash offsets that advance by
a whole pattern. So the last frame hands back to the first with no jump, which
matters because these loop forever on a card. A loop with a seam is worse than
a still.

Each frame is the scene at one value of `t`, rendered as one row of a tall
filmstrip, so a whole clip costs one browser launch instead of a hundred. PIL
slices the strip; ffmpeg encodes the frames.
"""
import base64
import io
import math
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.dirname(HERE)

# Both are machine-local and neither is installed by this repo. Override with
# the environment rather than editing the file.
FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')
CHROME = os.environ.get(
    'CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
SERVE_URL = os.environ.get('SERVE_URL', 'http://localhost:3399')

SERVE_ROOT = os.path.join(FRONTEND, 'out')
ART_DIR = os.path.join(FRONTEND, 'public', 'appliances')
OUT_DIR = os.path.join(FRONTEND, 'public', 'services')
WORK = os.path.join(FRONTEND, '.clip-frames')

W, H = 640, 360          # 16:9, plenty for a card that is never full width
FPS = 25
SECONDS = 4
FRAMES = FPS * SECONDS
ROWS = 20                # frames per filmstrip, so no image is absurdly tall

# Where the appliance sits in the frame, so an effect can aim at it rather than
# at the middle of nowhere. Kept in frame pixels; the CSS below places the
# drawing to match.
ART_CX, ART_CY = 442.0, 158.0
ART_RX, ART_RY = 152.0, 138.0

# The drawing's own accent, used for the one soft blob that tints the scene
# towards the appliance being sold. The base gradient stays brand for all of
# them — six cards on one page want one background, not six.
ACCENT = {
    'washing-machine': '#2547D0',
    'air-conditioner': '#59C6E8',
    'refrigerator': '#0B9A63',
    'geyser': '#D9821B',
    'microwave': '#4A3FB5',
}

# (file name, appliance, effect, headline, the line under it)
#
# Every service gets one. A page where some cards move and some do not does not
# read as "these two are special", it reads as "the rest failed to load".
CLIPS = [
    ('washing-machine-repair', 'washing-machine', 'repair',
     'Quoted before we open it', 'Drain · Spin · Error codes'),
    ('washing-machine-service', 'washing-machine', 'wash',
     'Drum, filter, drain line', 'Clean · Flush · Test wash'),
    ('washing-machine-installation', 'washing-machine', 'install',
     'Levelled and test run', 'Inlet · Drain · Transit bolts'),
    ('washing-machine-uninstallation', 'washing-machine', 'uninstall',
     'Packed for the move', 'Disconnect · Bolts · Pack'),

    ('ac-service', 'air-conditioner', 'wash',
     'Cleaned, checked, cooled', 'Filter · Coil · Drain · Gas'),
    ('ac-repair', 'air-conditioner', 'repair',
     'Diagnosed before repair', 'Cooling · Leak · Tripping'),
    ('ac-deep-clean', 'air-conditioner', 'jet',
     'Jet wash, coil to drain', 'Filters · Coil · Drain line'),
    ('ac-gas-refill', 'air-conditioner', 'gas',
     'Leak found, then filled', 'Leak test · Vacuum · Charge'),
    ('ac-installation', 'air-conditioner', 'install',
     'Mounted and cooling', 'Piping · Drain · Vacuum'),
    ('ac-uninstallation', 'air-conditioner', 'uninstall',
     'Gas saved, units down', 'Recover · Dismount · Pack'),

    ('refrigerator-repair', 'refrigerator', 'repair',
     'Cooling checked on site', 'Thermostat · Gas · Compressor'),
    ('refrigerator-service', 'refrigerator', 'wash',
     'Defrost to door seal', 'Coils · Drain · Temperature'),
    ('refrigerator-gas-refill', 'refrigerator', 'gas',
     'Leak traced and sealed', 'Repair · Vacuum · Charge'),
    ('refrigerator-installation', 'refrigerator', 'install',
     'Placed, levelled, started', 'Level · Doors · First start'),

    ('geyser-service', 'geyser', 'wash',
     'Descaled and flushed', 'Element · Thermostat · Valve'),
    ('geyser-repair', 'geyser', 'repair',
     'Hot water, back on', 'Element · Leak · Tripping'),
    ('geyser-installation', 'geyser', 'install',
     'Mounted and heating', 'Inlet · Outlet · Safety valve'),
    ('geyser-uninstallation', 'geyser', 'uninstall',
     'Drained and dismounted', 'Drain · Disconnect · Pack'),

    ('microwave-repair', 'microwave', 'repair',
     'Opened, then quoted', 'Heating · Panel · Turntable'),
    ('microwave-service', 'microwave', 'wash',
     'Cavity clean, heat test', 'Magnetron · Interlock · Test'),
    ('microwave-installation', 'microwave', 'install',
     'Fitted and first heat', 'Placement · Power · Test'),
]


# ---------------------------------------------------------------------------
# The drawing
# ---------------------------------------------------------------------------

# Every appliance drawing opens with a pale disc behind the appliance, sized
# for a round slot on a white card. On a gradient it reads as a sticker
# somebody pasted on, so it comes off here — the appliance is meant to be in
# the scene, not on a badge inside it.
BACKDROP = re.compile(r'<circle[^>]*\br="8[0-9]"[^>]*/>\s*')


def art_data_uri(appliance: str) -> str:
    """The appliance drawing, minus its disc, inline so nothing has to serve it."""
    path = os.path.join(ART_DIR, '%s.svg' % appliance)
    svg = io.open(path, encoding='utf-8').read()
    svg, n = BACKDROP.subn('', svg, count=1)
    if n != 1:
        raise SystemExit('%s: expected one backdrop circle to strip' % path)
    return 'data:image/svg+xml;base64,' + base64.b64encode(
        svg.encode('utf-8')).decode('ascii')


# ---------------------------------------------------------------------------
# Small periodic helpers
#
# `t` runs [0, 1) across the clip. Anything built only from these comes back to
# where it started, which is what makes the loop seamless.
# ---------------------------------------------------------------------------

def wave(t: float, phase: float = 0.0) -> float:
    """-1 → 1 → -1 over one turn."""
    return math.sin(2 * math.pi * (t + phase))


def bump(t: float, start: float, width: float) -> float:
    """0 → 1 → 0 across a window of the clip, and 0 everywhere else."""
    x = ((t - start) % 1.0) / width
    if x > 1:
        return 0.0
    return math.sin(math.pi * x) ** 2


def ease(x: float) -> float:
    return x * x * (3 - 2 * x)


# ---------------------------------------------------------------------------
# The effects
#
# Each returns SVG drawn on a 640x360 canvas over the appliance. They are what
# makes a clip a clip: the one thing the service actually does to the machine,
# happening, rather than a light drifting past a picture of it.
# ---------------------------------------------------------------------------

# The appliance's own body inside its 220x200 drawing: the rectangle the unit
# actually occupies, which is not the same as the drawing's box. Without it a
# levelling foot lands beside the washing machine instead of under it, because
# the machine is barely half as wide as the artboard it is drawn on.
BODY = {
    'washing-machine': (54, 28, 112, 148),
    'air-conditioner': (34, 46, 152, 52),
    'refrigerator': (62, 20, 96, 164),
    'geyser': (58, 26, 104, 124),
    'microwave': (24, 56, 172, 90),
}

# Hung on a wall, or stood on a floor. It decides what "installed" looks like:
# a bracket and two bolts over the unit, or a levelling foot under each corner.
WALL_MOUNTED = {'air-conditioner', 'geyser'}


class Scene:
    """Everything an effect needs to draw on top of one frame.

    The body box and the transform are the two things that keep hardware stuck
    to the machine. The drawing breathes — a slow push in and a drift — and
    anything bolted to it has to breathe with it, or a bolt that should be in
    the bracket floats a centimetre off it half the time.
    """

    def __init__(self, t, accent, appliance, drift_x, drift_y, scale):
        self.t = t
        self.accent = accent
        self.appliance = appliance
        self.wall = appliance in WALL_MOUNTED

        x, y, w, h = BODY[appliance]
        sx, sy = 2 * ART_RX / 220.0, 2 * ART_RY / 200.0
        self.bx = ART_CX - ART_RX + x * sx
        self.by = ART_CY - ART_RY + y * sy
        self.bw, self.bh = w * sx, h * sy

        # The art's CSS transform, written the way SVG wants it.
        self.xform = (
            'translate(%.2f %.2f) translate(%.1f %.1f) scale(%.4f) '
            'translate(%.1f %.1f)'
            % (drift_x, drift_y, ART_CX, ART_CY, scale, -ART_CX, -ART_CY))

    @property
    def bx1(self):
        return self.bx + self.bw

    @property
    def by1(self):
        return self.by + self.bh

    @property
    def cx(self):
        return self.bx + self.bw / 2

    @property
    def cy(self):
        return self.by + self.bh / 2

    def stuck(self, body: str) -> str:
        """Wrap drawing that belongs to the machine, so it moves with it."""
        return '<g transform="%s">%s</g>' % (self.xform, body)


def panel(x: float, y: float, w: float, h: float, body: str) -> str:
    """The one piece of chrome these clips allow themselves.

    An instrument reading — a trace, a level — needs something to be drawn on,
    or it is a scribble floating over a picture. One translucent card, the same
    card every time, is the difference between "diagnostic" and "marks".
    """
    return (
        '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="16" '
        'fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.30)" '
        'stroke-width="1.4"/>%s' % (x, y, w, h, body)
    )


def nut(cx: float, cy: float, r: float, turns: float) -> str:
    """A hex nut, turned a whole number of times across the clip."""
    pts = []
    for j in range(6):
        a = 2 * math.pi * (j / 6.0 + turns)
        pts.append('%.1f,%.1f' % (cx + r * math.cos(a), cy + r * math.sin(a)))
    return ('<polygon points="%s" fill="rgba(255,255,255,.14)" stroke="#fff" '
            'stroke-width="2.4" stroke-linejoin="round" opacity=".9"/>'
            % ' '.join(pts))


def fx_jet(sc) -> str:
    """A pressure jet crossing the unit, and the dirt leaving with it."""
    t = sc.t
    # The nozzle tracks up and down the left of the unit; the fan reaches it.
    ny = sc.by + sc.bh * (0.18 + 0.64 * (0.5 + 0.5 * wave(t)))
    nx = max(46.0, sc.bx - 86)
    reach = sc.bx + sc.bw * 0.35
    spread = max(26.0, sc.bh * 0.30)
    fan = (
        '<path d="M%.1f %.1f L%.1f %.1f L%.1f %.1f Z" fill="url(#fan)"/>'
        '<rect x="%.1f" y="%.1f" width="26" height="9" rx="4.5" fill="#fff" '
        'opacity=".85"/>'
        % (nx, ny, reach, ny - spread, reach, ny + spread, nx - 24, ny - 4.5)
    )

    # Dirt: specks that lift off wherever the fan is landing and fall away to
    # the left. There is no grime layer fading in and out — a brown rectangle
    # over the drawing looked like exactly that, a brown rectangle.
    specks = []
    for i in range(26):
        k = (t * 1.5 + i / 26.0) % 1.0
        ox = sc.bx + (i * 53) % max(1, int(sc.bw * 0.7))
        oy = ny + (i % 9 - 4) * 11
        specks.append(
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#c9b184" opacity="%.3f"/>'
            % (ox - 150 * k * k, oy + 120 * k * k - 26 * k,
               1.3 + 2.4 * (1 - k), 0.75 * (1 - k) ** 1.4))

    # Spray, thrown back off the surface the jet is hitting.
    drops = []
    for i in range(16):
        k = (t * 2.0 + i / 16.0) % 1.0
        drops.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="#fff" '
                     'opacity="%.3f"/>'
                     % (sc.bx + 16 - 92 * k, ny + (i % 5 - 2) * 16 + 70 * k * k,
                        1.4 + 1.8 * (1 - k), 0.5 * (1 - k)))

    # The wet shine following the pass across the unit, stuck to the unit.
    shine = sc.stuck(
        '<rect x="%.1f" y="%.1f" width="30" height="%.1f" fill="url(#shine)" '
        'opacity=".45" transform="skewX(-12)"/>'
        % (sc.bx + sc.bw * (t % 1.0) - 15, sc.by, sc.bh))
    return fan + shine + ''.join(specks) + ''.join(drops)


def fx_wash(sc) -> str:
    """Foam rising off the unit and a clean pass crossing it."""
    t = sc.t
    bubbles = []
    for i in range(14):
        phase = i / 14.0
        k = (t + phase) % 1.0
        b_x = sc.bx + (i * 61) % max(1, int(sc.bw)) + 10 * wave(t, phase)
        bubbles.append(
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="rgba(255,255,255,.14)" '
            'stroke="#fff" stroke-width="2" opacity="%.3f"/>'
            % (b_x, sc.by1 - 10 - (sc.bh + 40) * k,
               6 + 10 * ((i % 5) / 4.0), 0.72 * math.sin(math.pi * k)))

    # Three sparkles, each popping in its own third of the clip, so something
    # is always just appearing without all three ever firing together.
    sparks = []
    spots = ((0.16, 0.20), (0.78, 0.36), (0.44, 0.82))
    for i, (fx_, fy_) in enumerate(spots):
        a = bump(t, i / 3.0, 0.4)
        if a <= 0.02:
            continue
        s = 8 + 8 * a
        x, y = sc.bx + sc.bw * fx_, sc.by + sc.bh * fy_
        sparks.append(
            '<path d="M%.1f %.1f L%.1f %.1f M%.1f %.1f L%.1f %.1f" stroke="#fff" '
            'stroke-width="2.2" stroke-linecap="round" opacity="%.2f"/>'
            % (x - s, y, x + s, y, x, y - s, x, y + s, a))

    band = ('<rect x="%.1f" y="-30" width="76" height="420" fill="url(#shine)" '
            'opacity=".38" transform="skewX(-14)"/>' % (-120 + 900 * t))
    # A second, tighter pass that stays on the machine, so the clean reads as
    # something happening to the unit rather than a light crossing the room.
    wipe = sc.stuck(
        '<rect x="%.1f" y="%.1f" width="34" height="%.1f" fill="url(#shine)" '
        'opacity=".55" transform="skewX(-10)"/>'
        % (sc.bx - 24 + (sc.bw + 48) * t, sc.by, sc.bh))
    return band + wipe + ''.join(bubbles) + ''.join(sparks)


def fx_repair(sc) -> str:
    """A reading settling from fault to clear, on an instrument that exists."""
    t = sc.t
    calm = ease(min(1.0, t / 0.78))
    colour = '#d64545' if calm < 0.45 else ('#d9821b' if calm < 0.8 else '#0b9a63')

    px, py, pw, ph = 40.0, 126.0, 190.0, 88.0
    mid = py + ph / 2 + 10
    pts = []
    for i in range(34):
        x = px + 16 + i * (pw - 32) / 33.0
        wobble = (1 - calm) * 19 * math.sin(2 * math.pi * (i / 5.0 + t * 3))
        pts.append('%.1f,%.1f' % (x, mid + wobble + 4 * wave(t, i / 34.0)))
    trace = ('<polyline points="%s" fill="none" stroke="%s" stroke-width="2.6" '
             'stroke-linecap="round" stroke-linejoin="round"/>'
             % (' '.join(pts), colour))
    lamp = ('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" opacity=".30"/>'
            '<circle cx="%.1f" cy="%.1f" r="5.5" fill="%s"/>'
            '<rect x="%.1f" y="%.1f" width="%.1f" height="5" rx="2.5" '
            'fill="#fff" opacity=".45"/>'
            % (px + 20, py + 24, 8 + 4 * abs(wave(t)), colour,
               px + 20, py + 24, colour,
               px + 34, py + 21.5, 48 + 36 * calm))

    # A scan running down the unit while the reading is still unsettled.
    scan = sc.stuck(
        '<rect x="%.1f" y="%.1f" width="%.1f" height="2.5" fill="#fff" '
        'opacity="%.2f"/>'
        % (sc.bx, sc.by + sc.bh * ((t * 2) % 1.0), sc.bw, 0.45 * (1 - calm)))
    return scan + panel(px, py, pw, ph, trace + lamp)


def fx_gas(sc) -> str:
    """A gauge filling, and charge travelling up the line into the unit."""
    t = sc.t
    gx, gy, gr = 112.0, 164.0, 52.0
    # The needle sweeps up and back — a triangle in `t`, so it returns cleanly.
    fill = 1 - abs(2 * t - 1)
    a0, a1 = math.radians(150), math.radians(390)
    ang = a0 + (a1 - a0) * ease(fill)

    def arc(frac, colour, width, opacity):
        end = a0 + (a1 - a0) * frac
        large = 1 if (end - a0) > math.pi else 0
        return ('<path d="M%.1f %.1f A%.1f %.1f 0 %d 1 %.1f %.1f" fill="none" '
                'stroke="%s" stroke-width="%.1f" stroke-linecap="round" '
                'opacity="%.2f"/>'
                % (gx + gr * math.cos(a0), gy + gr * math.sin(a0), gr, gr, large,
                   gx + gr * math.cos(end), gy + gr * math.sin(end), colour,
                   width, opacity))

    ticks = []
    for i in range(9):
        a = a0 + (a1 - a0) * i / 8.0
        ticks.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
                     'stroke-width="1.6" opacity=".45"/>'
                     % (gx + (gr - 14) * math.cos(a), gy + (gr - 14) * math.sin(a),
                        gx + (gr - 20) * math.cos(a), gy + (gr - 20) * math.sin(a)))
    gauge = (arc(1.0, '#ffffff', 6, 0.20)
             + arc(max(0.001, ease(fill)), '#fff', 6, 0.95) + ''.join(ticks))
    needle = ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
              'stroke-width="3.2" stroke-linecap="round"/>'
              '<circle cx="%.1f" cy="%.1f" r="5.5" fill="#fff"/>'
              % (gx, gy, gx + (gr - 24) * math.cos(ang),
                 gy + (gr - 24) * math.sin(ang), gx, gy))

    # The charge line, and pips running along it towards the unit.
    x0, y0 = gx + gr + 4, gy
    x1, y1 = sc.bx + 6, sc.by + sc.bh * 0.66
    c0x, c0y, c1x, c1y = x0 + 60, y0 - 26, x1 - 60, y1 + 30
    line = ('<path d="M%.1f %.1f C%.1f %.1f %.1f %.1f %.1f %.1f" fill="none" '
            'stroke="#fff" stroke-width="2" opacity=".30"/>'
            % (x0, y0, c0x, c0y, c1x, c1y, x1, y1))
    pips = []
    for i in range(6):
        k = (t + i / 6.0) % 1.0
        # The same cubic, evaluated by hand so a pip sits on the drawn line.
        m = 1 - k
        pip_x = m ** 3 * x0 + 3 * m * m * k * c0x + 3 * m * k * k * c1x + k ** 3 * x1
        pip_y = m ** 3 * y0 + 3 * m * m * k * c0y + 3 * m * k * k * c1y + k ** 3 * y1
        pips.append('<circle cx="%.1f" cy="%.1f" r="4.2" fill="%s" opacity="%.2f"/>'
                    % (pip_x, pip_y, sc.accent, 0.9 * math.sin(math.pi * k) + 0.1))
    return line + ''.join(pips) + gauge + needle


def fx_install(sc) -> str:
    """A bracket up, or a foot down, and a level finding centre."""
    t = sc.t
    a = 0.26 + 0.26 * abs(wave(t))
    guides = (
        '<line x1="%.1f" y1="18" x2="%.1f" y2="330" stroke="#fff" stroke-width="1.5" '
        'stroke-dasharray="7 9" stroke-dashoffset="%.1f" opacity="%.2f"/>'
        '<line x1="%.1f" y1="%.1f" x2="628" y2="%.1f" stroke="#fff" '
        'stroke-width="1.5" stroke-dasharray="7 9" stroke-dashoffset="%.1f" '
        'opacity="%.2f"/>'
        % (sc.cx, sc.cx, -32 * t, a, max(176.0, sc.bx - 90), sc.cy, sc.cy, 32 * t, a)
    )

    # What the unit is being fixed to. A wall bracket over a washing machine
    # would be a drawing of the wrong job.
    inset = min(26.0, sc.bw * 0.16)
    if sc.wall:
        hy = sc.by - 8
        rail = ('<rect x="%.1f" y="%.1f" width="%.1f" height="7" rx="3.5" '
                'fill="#fff" opacity=".40"/>' % (sc.bx, hy - 3.5, sc.bw))
    else:
        hy = sc.by1 - 2
        rail = ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
                'stroke-width="3" opacity=".40"/>'
                % (sc.bx - 26, hy + 14, sc.bx1 + 26, hy + 14))
    hardware = sc.stuck(rail
                        + nut(sc.bx + inset, hy, 12.0, 2 * t)
                        + nut(sc.bx1 - inset, hy, 12.0, -2 * t))

    # A spirit level that stops wandering as the clip runs on.
    lx, ly, lw, lh = 52.0, 182.0, 152.0, 32.0
    off = (1 - ease(min(1.0, t / 0.85))) * 40 * wave(t * 3)
    bubble_x = lx + lw / 2 + max(-lw / 2 + 16, min(lw / 2 - 16, off))
    level = panel(lx, ly, lw, lh, (
        '<circle cx="%.1f" cy="%.1f" r="9.5" fill="#fff" opacity=".92"/>'
        '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
        'stroke-width="1.5" opacity=".5"/>'
        '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
        'stroke-width="1.5" opacity=".5"/>'
        % (bubble_x, ly + lh / 2,
           lx + lw / 2 - 14, ly + 5, lx + lw / 2 - 14, ly + lh - 5,
           lx + lw / 2 + 14, ly + 5, lx + lw / 2 + 14, ly + lh - 5)))
    return guides + hardware + level


def fx_uninstall(sc) -> str:
    """A packing outline drawing itself around the unit, and the unit coming off."""
    t = sc.t
    pad = 14.0
    x, y = sc.bx - pad, sc.by - pad
    w = sc.bw + 2 * pad
    # Stopped short of the caption. A packing box that runs under the words is
    # a line through them, not a box around the unit.
    h = min(sc.bh + 2 * pad, 272.0 - y)
    peri = 2 * (w + h)
    ghost = ('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="16" fill="none" '
             'stroke="#fff" stroke-width="1.4" opacity=".18"/>' % (x, y, w, h))
    box = ('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="16" fill="none" '
           'stroke="#fff" stroke-width="2.6" stroke-dasharray="%.1f %.1f" '
           'stroke-dashoffset="%.1f" opacity=".9"/>'
           % (x, y, w, h, peri * 0.5, peri * 0.5, -peri * t))
    tape = ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
            'stroke-width="2.4" opacity="%.2f"/>'
            % (x, y + h / 2, x + w, y + h / 2, 0.12 + 0.34 * bump(t, 0.55, 0.4)))
    packing = sc.stuck(ghost + box + tape)

    if sc.wall:
        # The hoist it comes down on, breathing rather than travelling: a hook
        # that actually descended would have nowhere to be on the next loop.
        hx = max(112.0, sc.bx - 120)
        hook_y = 150.0 + 14 * (0.5 + 0.5 * wave(t))
        lift = ('<line x1="%.1f" y1="24" x2="%.1f" y2="%.1f" stroke="#fff" '
                'stroke-width="2" opacity=".45"/>'
                '<path d="M%.1f %.1f a10 10 0 0 0 20 0 l0 -12" fill="none" '
                'stroke="#fff" stroke-width="3" stroke-linecap="round" '
                'stroke-linejoin="round" opacity=".85"/>'
                % (hx, hx, hook_y, hx, hook_y))
    else:
        # Nothing to hoist: it comes off its feet, onto the floor line.
        fy = sc.by1 - 2
        inset = min(26.0, sc.bw * 0.16)
        lift = sc.stuck(
            '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="#fff" '
            'stroke-width="3" opacity=".40"/>%s%s'
            % (sc.bx - 26, fy + 14, sc.bx1 + 26, fy + 14,
               nut(sc.bx + inset, fy, 11.0, -2 * t),
               nut(sc.bx1 - inset, fy, 11.0, 2 * t)))
    return packing + lift


EFFECTS = {
    'jet': fx_jet,
    'wash': fx_wash,
    'repair': fx_repair,
    'gas': fx_gas,
    'install': fx_install,
    'uninstall': fx_uninstall,
}


# ---------------------------------------------------------------------------
# The frame
# ---------------------------------------------------------------------------

def frame_html(clip, art: str, t: float) -> str:
    """One frame of the scene at progress t in [0, 1)."""
    _, appliance, effect, headline, sub = clip
    accent = ACCENT[appliance]

    # A slow push in and a little drift: the difference between a picture with
    # something moving on it and a shot of something.
    scale = 1.0 + 0.035 * (0.5 + 0.5 * wave(t, -0.25))
    drift_x = 5 * wave(t, 0.1)
    drift_y = 6 * wave(t)

    blob_x = 62 + 8 * wave(t, 0.33)
    blob_y = 18 + 10 * wave(t, 0.66)

    overlay = EFFECTS[effect](
        Scene(t, accent, appliance, drift_x, drift_y, scale))

    return f'''
<div class="frame">
  <div class="tint" style="background:radial-gradient(60% 70% at {blob_x:.1f}% {blob_y:.1f}%,{accent} 0%,transparent 70%)"></div>
  <div class="vignette"></div>
  <img class="art" src="{art}"
       style="transform:translateY(-50%) translate({drift_x:.2f}px,{drift_y:.2f}px) scale({scale:.4f})">
  <svg class="fx" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fan" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#ffffff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    {overlay}
  </svg>
  <div class="scrim"></div>
  <div class="caption">
    <p class="head">{headline}</p>
    <p class="sub">{sub}</p>
  </div>
</div>'''


def strip_html(clip, art: str, start: int, count: int) -> str:
    frames = ''.join(
        frame_html(clip, art, (start + i) / FRAMES) for i in range(count)
    )
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
  * {{ margin:0; padding:0; box-sizing:border-box }}
  body {{ background:#000 }}
  @font-face {{
    font-family:'Manrope'; font-style:normal; font-weight:200 800;
    src:url('/fonts/manrope-latin.woff2') format('woff2');
  }}
  .frame {{
    position:relative; width:{W}px; height:{H}px; overflow:hidden;
    background:linear-gradient(135deg,#131c46 0%,#1e3a8a 42%,#2547d0 100%);
    font-family:'Manrope',sans-serif;
  }}
  .tint {{ position:absolute; inset:0; opacity:.30; mix-blend-mode:screen }}
  /* Darker at the edges than the middle, which is what stops a flat gradient
     reading as a slide background. */
  .vignette {{
    position:absolute; inset:0;
    background:radial-gradient(78% 88% at 52% 44%,transparent 40%,rgba(6,9,30,.55) 100%);
  }}
  /* Centred with a transform, not a negative margin: a percentage margin
     resolves against the parent's WIDTH, so on a 16:9 frame it lifted the
     drawing clean off the top edge. */
  .art {{
    position:absolute; left:{ART_CX:.1f}px; top:{ART_CY:.1f}px;
    width:{2 * ART_RX:.1f}px; margin-left:{-ART_RX:.1f}px;
    filter:drop-shadow(0 22px 34px rgba(6,9,30,.45));
  }}
  .fx {{ position:absolute; inset:0; width:{W}px; height:{H}px }}
  /* The reason a caption stays readable over whatever the clip is doing. */
  .scrim {{
    position:absolute; left:0; right:0; bottom:0; height:52%;
    background:linear-gradient(180deg,rgba(6,9,30,0) 0%,rgba(6,9,30,.55) 62%,rgba(6,9,30,.78) 100%);
  }}
  .caption {{ position:absolute; left:32px; bottom:26px; max-width:62% }}
  .head {{
    color:#fff; font-size:27px; line-height:1.18; font-weight:800;
    letter-spacing:-.3px; text-shadow:0 2px 12px rgba(6,9,30,.5);
  }}
  .sub {{
    margin-top:7px; color:rgba(255,255,255,.78); font-size:14px; font-weight:600;
    letter-spacing:.35px;
  }}
</style></head><body>{frames}</body></html>'''


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------

def main(argv) -> int:
    try:
        from PIL import Image
    except ImportError:
        print('This needs Pillow: pip install Pillow', file=sys.stderr)
        return 1

    if not os.path.isdir(SERVE_ROOT):
        print(f'No static export at {SERVE_ROOT}. Run `npm run build` first.',
              file=sys.stderr)
        return 1

    wanted = set(argv[1:])
    clips = [c for c in CLIPS if not wanted or c[0] in wanted]
    unknown = wanted - {c[0] for c in CLIPS}
    if unknown:
        print('No such clip: %s' % ', '.join(sorted(unknown)), file=sys.stderr)
        return 1

    frames_dir = os.path.join(WORK, 'frames')
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    # The page has to be served rather than opened from disk: it pulls the
    # bundled font by absolute path, which file:// cannot resolve.
    page = os.path.join(SERVE_ROOT, '_strip.html')

    art_cache = {}
    for clip in clips:
        name, appliance = clip[0], clip[1]
        art = art_cache.setdefault(appliance, art_data_uri(appliance))
        for stale in os.listdir(frames_dir):
            os.remove(os.path.join(frames_dir, stale))

        index = 0
        for start in range(0, FRAMES, ROWS):
            count = min(ROWS, FRAMES - start)
            io.open(page, 'w', encoding='utf-8', newline='').write(
                strip_html(clip, art, start, count))

            shot = os.path.join(WORK, 'strip.png')
            subprocess.run([
                CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                '--force-device-scale-factor=1',
                f'--window-size={W},{H * count}',
                '--virtual-time-budget=5000',
                f'--screenshot={shot}',
                f'{SERVE_URL}/_strip.html',
            ], check=True, capture_output=True)

            strip = Image.open(shot).convert('RGB')
            for i in range(count):
                strip.crop((0, i * H, W, (i + 1) * H)).save(
                    os.path.join(frames_dir, f'f{index:04d}.png'))
                index += 1

        mp4 = os.path.join(OUT_DIR, f'{name}.mp4')
        subprocess.run([
            FFMPEG, '-y', '-framerate', str(FPS),
            '-i', os.path.join(frames_dir, 'f%04d.png'),
            # Silent, because a card clip autoplays and a card clip that makes
            # noise is a card clip somebody mutes the whole site over.
            '-an',
            '-c:v', 'libx264', '-profile:v', 'high', '-crf', '26',
            # The one pixel format every phone decodes in hardware.
            '-pix_fmt', 'yuv420p',
            # First frame without waiting for the whole file.
            '-movflags', '+faststart',
            mp4,
        ], check=True, capture_output=True)
        print(f'{name}.mp4  {os.path.getsize(mp4) // 1024} KB  {index} frames',
              flush=True)

    if os.path.exists(page):
        os.remove(page)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
