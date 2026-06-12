#!/usr/bin/env python3
"""把 pet-demo 的透明 webp 动画批量转成 iOS 可播的 HEVC alpha .mov，
并为 WidgetKit 提取关键姿势 PNG 帧。

用法: python3 convert_assets.py
"""
import os, sys, glob, shutil, subprocess, tempfile
from pathlib import Path
from PIL import Image

FFMPEG = "/opt/homebrew/bin/ffmpeg"
SRC = Path("/Users/kotoko/clawd/projects/pet-demo/videos")
OUT = Path(__file__).resolve().parent.parent / "assets"

# petKey -> (源目录, 已有 hevc-alpha mov 的动作列表)
PETS = {
    "juju":   {"dir": SRC,             "movs": ["idle", "yawn", "lick", "walk", "sleep", "happy"],
               "mov_suffix": ""},      # 小橘猫，根目录；happy.mov/idle.mov... + *_alpha.mov 混杂，用无后缀优先
    "dollar": {"dir": SRC / "dollar",  "movs": [], "mov_suffix": ""},
    "mixian": {"dir": SRC / "mixian",  "movs": [], "mov_suffix": ""},
}
ACTIONS = ["idle", "yawn", "lick", "walk", "sleep", "happy", "eat", "belly"]
WIDGET_FRAME_POS = 0.45   # 取动画 45% 处的帧做组件姿势图
WIDGET_SIZE = 600


def webp_frames(webp_path: Path):
    im = Image.open(webp_path)
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


def encode_hevc_alpha(frames_dir: Path, out_mov: Path, fps: int = 10):
    cmd = [FFMPEG, "-y", "-v", "error",
           "-framerate", str(fps), "-i", str(frames_dir / "f_%04d.png"),
           "-c:v", "hevc_videotoolbox", "-alpha_quality", "0.75",
           "-q:v", "60", "-tag:v", "hvc1", "-pix_fmt", "bgra",
           str(out_mov)]
    subprocess.run(cmd, check=True)


def trim_alpha(im: Image.Image, pad: int = 12) -> Image.Image:
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l, t = max(0, l - pad), max(0, t - pad)
    r, b = min(im.width, r + pad), min(im.height, b + pad)
    return im.crop((l, t, r, b))


def save_widget_frame(frames, out_png: Path):
    idx = min(len(frames) - 1, int(len(frames) * WIDGET_FRAME_POS))
    im = trim_alpha(frames[idx])
    im.thumbnail((WIDGET_SIZE, WIDGET_SIZE), Image.LANCZOS)
    im.save(out_png)


def main():
    for pet, cfg in PETS.items():
        src: Path = cfg["dir"]
        vid_out = OUT / "pets" / pet / "videos"
        frame_out = OUT / "pets" / pet / "frames"
        vid_out.mkdir(parents=True, exist_ok=True)
        frame_out.mkdir(parents=True, exist_ok=True)

        # 角色图
        char = src / "character.jpg"
        if not char.exists():
            char = src.parent / "character.jpg"  # 小橘的在 pet-demo 根目录
        if char.exists():
            shutil.copy(char, OUT / "pets" / pet / "character.jpg")

        for action in ACTIONS:
            webp = src / f"{action}_nobg.webp"
            mov_dst = vid_out / f"{action}.mov"

            # 1) 已有验证过的 hevc alpha mov 直接复用
            src_mov = src / f"{action}.mov"
            if action in cfg["movs"] and src_mov.exists():
                shutil.copy(src_mov, mov_dst)
                print(f"[{pet}/{action}] copied existing mov")
            elif webp.exists():
                frames = webp_frames(webp)
                with tempfile.TemporaryDirectory() as td:
                    td = Path(td)
                    for i, f in enumerate(frames):
                        f.save(td / f"f_{i:04d}.png")
                    encode_hevc_alpha(td, mov_dst)
                print(f"[{pet}/{action}] webp({len(frames)}f) -> hevc alpha mov "
                      f"({mov_dst.stat().st_size//1024}KB)")
            else:
                print(f"[{pet}/{action}] SKIP (no source)")
                continue

            # 2) 组件姿势帧
            if webp.exists():
                save_widget_frame(webp_frames(webp), frame_out / f"{action}.png")

            # 3) 音效
            mp3 = src / f"{action}.mp3"
            if mp3.exists():
                snd_out = OUT / "pets" / pet / "sounds"
                snd_out.mkdir(exist_ok=True)
                shutil.copy(mp3, snd_out / f"{action}.mp3")

    print("done ->", OUT)


if __name__ == "__main__":
    main()
