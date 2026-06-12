#!/usr/bin/env python3
"""去除透明素材的白色毛边（alpha fringe）。

原理：rembg 的 matte 没做颜色去污染，半透明边缘像素的 RGB 仍混着原白底。
对每个像素做白底反解 fg = (obs - (1-a)*255) / a，再把 alpha 轻微收缩，
低透明度游离像素直接置 0。

用法：
  python3 defringe.py            # 重处理全部宠物（webp 源优先，否则解码 mov）
"""
import subprocess, tempfile, glob, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

FF = "/opt/homebrew/bin/ffmpeg"
ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets/pets"
IOS_MEDIA = ROOT / "ios/Resources/PetMedia"
IOS_FRAMES = ROOT / "ios/Resources/PetFrames"
SRC = Path("/Users/kotoko/clawd/projects/pet-demo/videos")

WIDGET_FRAME_POS = 0.45
WIDGET_SIZE = 600


def defringe(im: Image.Image) -> Image.Image:
    """白底反解 + alpha 清理"""
    arr = np.asarray(im.convert("RGBA")).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0

    # 1) 白底反解：obs = fg*a + 255*(1-a)  =>  fg = (obs - 255*(1-a)) / a
    safe_a = np.clip(a, 1e-3, 1.0)
    fg = (rgb - 255.0 * (1.0 - a)) / safe_a
    fg = np.clip(fg, 0, 255)
    # 完全不透明的像素保持原色（避免数值噪声）
    fg = np.where(a >= 0.999, rgb, fg)

    # 2) 低透明度游离像素直接置 0（亮点毛刺）
    a2 = np.where(a < 0.06, 0.0, a)

    out = np.concatenate([fg, a2 * 255.0], axis=-1).astype(np.uint8)
    res = Image.fromarray(out, "RGBA")

    # 3) alpha 收缩 1px（MinFilter）再 0.5px 软化，边界更"实"
    alpha = res.getchannel("A").filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.5))
    res.putalpha(alpha)
    return res


def webp_frames(p: Path):
    im = Image.open(p)
    frames = []
    try:
        i = 0
        while True:
            im.seek(i)
            frames.append(im.convert("RGBA").copy())
            i += 1
    except EOFError:
        pass
    return frames


def mov_frames(p: Path):
    with tempfile.TemporaryDirectory() as td:
        subprocess.run([FF, "-y", "-v", "error", "-i", str(p),
                        str(Path(td) / "f_%04d.png")], check=True)
        return [Image.open(f).convert("RGBA") for f in sorted(glob.glob(f"{td}/f_*.png"))]


def encode(frames, out_mov: Path, fps=10):
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        for i, f in enumerate(frames):
            f.save(td / f"f_{i:04d}.png")
        subprocess.run([FF, "-y", "-v", "error", "-framerate", str(fps),
                        "-i", str(td / "f_%04d.png"),
                        "-c:v", "hevc_videotoolbox", "-alpha_quality", "0.75",
                        "-q:v", "60", "-tag:v", "hvc1", "-pix_fmt", "bgra",
                        str(out_mov)], check=True)


def widget_frame(frames, out_png: Path):
    im = frames[min(len(frames) - 1, int(len(frames) * WIDGET_FRAME_POS))]
    bbox = im.getchannel("A").getbbox()
    if bbox:
        l, t, r, b = bbox
        im = im.crop((max(0, l - 12), max(0, t - 12),
                      min(im.width, r + 12), min(im.height, b + 12)))
    im = im.copy()
    im.thumbnail((WIDGET_SIZE, WIDGET_SIZE), Image.LANCZOS)
    im.save(out_png)


# webp 源映射（无源的用现有 mov 解码）
WEBP_DIR = {"juju": SRC, "dollar": SRC / "dollar", "mixian": SRC / "mixian"}

for pet_dir in sorted(ASSETS.iterdir()):
    if not pet_dir.is_dir():
        continue
    pet = pet_dir.name
    for mov in sorted((pet_dir / "videos").glob("*.mov")):
        action = mov.stem
        webp = WEBP_DIR.get(pet, Path("/nonexistent")) / f"{action}_nobg.webp"
        frames = webp_frames(webp) if webp.exists() else mov_frames(mov)
        frames = [defringe(f) for f in frames]
        encode(frames, mov)
        fpng = pet_dir / "frames" / f"{action}.png"
        if fpng.parent.exists():
            widget_frame(frames, fpng)
        # 同步到 iOS 工程
        dst_mov = IOS_MEDIA / pet / "videos" / mov.name
        if dst_mov.parent.exists():
            import shutil
            shutil.copy(mov, dst_mov)
        dst_png = IOS_FRAMES / pet / f"{action}.png"
        if dst_png.parent.exists() and fpng.exists():
            import shutil
            shutil.copy(fpng, dst_png)
        print(f"[{pet}/{action}] defringed ({len(frames)}f, {mov.stat().st_size//1024}KB)")

# 独角兽角色图也处理（PNG 直出）
uni_char = ASSETS / "uni/character.png"
if uni_char.exists():
    defringe(Image.open(uni_char)).save(uni_char)
    # uni 的组件帧
    src = Image.open(uni_char).convert("RGBA")
    bbox = src.getchannel("A").getbbox()
    if bbox:
        src = src.crop(bbox)
    src.thumbnail((WIDGET_SIZE, WIDGET_SIZE), Image.LANCZOS)
    src.save(ASSETS / "uni/frames/idle.png")
    import shutil
    shutil.copy(ASSETS / "uni/frames/idle.png", IOS_FRAMES / "uni/idle.png")
    print("[uni/character] defringed")

print("done")
