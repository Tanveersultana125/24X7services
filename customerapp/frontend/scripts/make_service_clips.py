"""
Build the short, silent, looping clips that sit on a service card.

Run from `frontend/`, with the static export served locally so the page can
reach the appliance drawings and the bundled font:

    npm run build
    (cd out && python -m http.server 3399)
    python scripts/make_service_clips.py

It needs two things that are deliberately not project dependencies — this
runs when somebody adds a clip, not on every install:

    Chrome    draws the frames. CHROME below, or the env var.
    ffmpeg    encodes them. `npx ffmpeg-static` in a scratch folder is
              enough; point FFMPEG at wherever it landed.

Why drawn rather than shot: there is no footage, and a stock clip of a
stranger's hands is worse than nothing. These are the app's own gradient and
the appliance's own drawing, which at least tell the truth about what is
being sold. Replace any of them with real footage of real work the day it
exists — nothing downstream cares which it is.

Everything animated is periodic in `t`: sin and cos over a whole turn, and a
sweep that leaves the frame exactly as it re-enters. So the last frame hands
back to the first with no jump, which matters because these loop forever on
a card. A loop with a seam is worse than a still.

Each frame is the scene at one value of `t`, rendered as one row of a tall
filmstrip, so a whole clip costs one browser launch instead of a hundred.
PIL slices the strip; ffmpeg encodes the frames.
"""
import io
import math
import os
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
OUT_DIR = os.path.join(FRONTEND, 'public', 'services')
WORK = os.path.join(FRONTEND, '.clip-frames')

W, H = 640, 360          # 16:9, plenty for a card that is never full width
FPS = 25
SECONDS = 4
FRAMES = FPS * SECONDS
ROWS = 20                # frames per filmstrip, so no image is absurdly tall

# (file name, appliance drawing, headline, the line under it)
CLIPS = [
    ('refrigerator-repair', '/appliances/refrigerator.svg',
     'Cooling checked on site', 'Thermostat · Gas · Compressor'),
    ('ac-deep-clean', '/appliances/air-conditioner.svg',
     'Jet wash, coil to drain', 'Filters · Coil · Drain line'),
]


def frame_html(svg: str, headline: str, sub: str, t: float) -> str:
    """One frame of the scene at progress t in [0, 1)."""
    turn = 2 * math.pi * t
    bob = math.sin(turn) * 10                     # the drawing breathing
    glow = 0.45 + 0.15 * math.cos(turn)           # the halo behind it
    sweep = -40 + 180 * t                         # light crossing left to right
    return f'''
<div class="frame">
  <div class="glow" style="opacity:{glow:.3f}"></div>
  <div class="sweep" style="left:{sweep:.1f}%"></div>
  <img class="art" src="{svg}" style="transform:translateY(calc(-50% + {bob:.2f}px))">
  <div class="caption">
    <p class="head">{headline}</p>
    <p class="sub">{sub}</p>
  </div>
</div>'''


def strip_html(clip, start: int, count: int) -> str:
    _, svg, headline, sub = clip
    frames = ''.join(
        frame_html(svg, headline, sub, (start + i) / FRAMES) for i in range(count)
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
    background:linear-gradient(135deg,#1e3a8a 0%,#2547d0 55%,#4AA8DC 100%);
    font-family:'Manrope',sans-serif;
  }}
  .glow {{
    position:absolute; right:8%; top:50%; width:{int(H * 0.95)}px; height:{int(H * 0.95)}px;
    transform:translateY(-50%); border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.55) 0%,rgba(255,255,255,0) 68%);
  }}
  .sweep {{
    position:absolute; top:-30%; width:22%; height:160%;
    transform:skewX(-18deg);
    background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.16) 50%,rgba(255,255,255,0) 100%);
  }}
  /* Centred with a transform, not a negative margin: a percentage margin
     resolves against the parent's WIDTH, so on a 16:9 frame it lifted the
     drawing clean off the top edge. */
  .art {{
    position:absolute; right:9%; top:50%; height:58%;
    filter:drop-shadow(0 18px 28px rgba(10,12,40,.35));
  }}
  .caption {{ position:absolute; left:7%; bottom:12%; max-width:56% }}
  .head {{
    color:#fff; font-size:34px; line-height:1.15; font-weight:800;
    letter-spacing:-.4px; text-shadow:0 2px 10px rgba(10,12,40,.35);
  }}
  .sub {{
    margin-top:10px; color:rgba(255,255,255,.82); font-size:16px; font-weight:600;
    letter-spacing:.3px;
  }}
</style></head><body>{frames}</body></html>'''


def main() -> int:
    try:
        from PIL import Image
    except ImportError:
        print('This needs Pillow: pip install Pillow', file=sys.stderr)
        return 1

    if not os.path.isdir(SERVE_ROOT):
        print(f'No static export at {SERVE_ROOT}. Run `npm run build` first.',
              file=sys.stderr)
        return 1

    frames_dir = os.path.join(WORK, 'frames')
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    # The page has to be served rather than opened from disk: it pulls the
    # drawings and the font by absolute path, which file:// cannot resolve.
    page = os.path.join(SERVE_ROOT, '_strip.html')

    for clip in CLIPS:
        name = clip[0]
        for stale in os.listdir(frames_dir):
            os.remove(os.path.join(frames_dir, stale))

        index = 0
        for start in range(0, FRAMES, ROWS):
            count = min(ROWS, FRAMES - start)
            io.open(page, 'w', encoding='utf-8', newline='').write(
                strip_html(clip, start, count))

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
        print(f'{name}.mp4  {os.path.getsize(mp4) // 1024} KB  {index} frames')

    if os.path.exists(page):
        os.remove(page)
    return 0


if __name__ == '__main__':
    sys.exit(main())
