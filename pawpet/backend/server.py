#!/usr/bin/env python3
"""爪爪桌宠 (PawPet) Backend — 上传宠物照片 → Seedream 角色设定图 → Seedance 动作视频
→ rembg 逐帧抠图 → HEVC alpha .mov (iOS) + WidgetKit 姿势 PNG 帧。

升级自 pet-demo/backend/server.py：
- 新增 stretch 动作
- 每个动作额外输出 HEVC alpha .mov（hevc_videotoolbox）+ 组件姿势帧 PNG
- 每日免费额度（按设备，Asia/Shanghai 本地日期），/api/quota 查询
- pets_db / 额度计数 持久化到磁盘 JSON
- GET /api/pet/{id}/bundle.zip 整包下发客户端
"""
import os
import sys
import json
import time
import uuid
import base64
import asyncio
import tempfile
import glob
import shutil
import subprocess
import zipfile
import threading
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
from io import BytesIO

import httpx
from fastapi import FastAPI, UploadFile, File, Form, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from PIL import Image
from dotenv import load_dotenv
from rembg import remove as rembg_remove

load_dotenv()

ARK_API_KEY = os.getenv("ARK_API_KEY")
ARK_BASE_URL = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
SEEDREAM_MODEL = os.getenv("SEEDREAM_MODEL", "doubao-seedream-4-5-251128")
SEEDANCE_MODEL = os.getenv("SEEDANCE_MODEL", "doubao-seedance-1-5-pro-251215")
GENERATED_DIR = Path(os.getenv("GENERATED_DIR", "./generated"))
DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))
FFMPEG = os.getenv("FFMPEG_PATH", "/opt/homebrew/bin/ffmpeg")

FREE_DAILY_LIMIT = int(os.getenv("FREE_DAILY_LIMIT", "5"))
LOCAL_TZ = ZoneInfo("Asia/Shanghai")

PETS_DB_FILE = DATA_DIR / "pets_db.json"
QUOTA_FILE = DATA_DIR / "quota.json"

app = FastAPI(title="PawPet 爪爪桌宠 Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 静态文件服务
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")

# ===== 持久化：pets_db + 每日额度（重启不丢） =====
_db_lock = threading.Lock()

def _load_json(path: Path, default):
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Failed to load {path}: {e}", file=sys.stderr)
    return default

def _atomic_save_json(path: Path, data):
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)

pets_db: dict = _load_json(PETS_DB_FILE, {})

def save_pets_db():
    with _db_lock:
        _atomic_save_json(PETS_DB_FILE, pets_db)

def today_str() -> str:
    """本地日期（Asia/Shanghai）"""
    return datetime.now(LOCAL_TZ).strftime("%Y-%m-%d")

def _load_quota() -> dict:
    """{"date": "YYYY-MM-DD", "devices": [device_id, ...]}，跨天自动重置"""
    quota = _load_json(QUOTA_FILE, {"date": today_str(), "devices": []})
    if quota.get("date") != today_str():
        quota = {"date": today_str(), "devices": []}
    return quota

def _save_quota(quota: dict):
    with _db_lock:
        _atomic_save_json(QUOTA_FILE, quota)

def claim_free_slot(device_id: str) -> bool:
    """尝试为设备占用/复用今天的免费名额。返回是否免费。"""
    if not device_id:
        return False
    quota = _load_quota()
    if device_id in quota["devices"]:
        return True  # 今天已占名额，本日内继续免费
    if len(quota["devices"]) < FREE_DAILY_LIMIT:
        quota["devices"].append(device_id)
        _save_quota(quota)
        return True
    return False

def verify_receipt(receipt: str) -> bool:
    """内购收据占位校验。
    TODO: 接 StoreKit 2 server 校验（App Store Server API verifyTransaction），
    校验 bundle_id / product_id / 交易未被复用，并落盘已消耗的 transaction_id 防重放。
    """
    return bool(receipt and receipt.strip())

# ===== Prompts =====
CHARACTER_PROMPT = """以参考照片中的真实宠物为原型，生成一张干净的角色设定图。

要求：
- 完全保留原宠物的毛色、花纹、体型、面部特征，让认识它的人一眼能认出
- 正面端坐，面朝镜头，姿态自然放松
- 纯白色背景，无阴影无装饰
- 全身像，从头到尾巴完整展示
- 高清写实风格，像专业宠物摄影棚照片
- 光线柔和均匀，毛发纹理清晰
- 这是一张角色参考图，后续会用来生成各种动画"""

ACTION_PROMPTS = {
    "idle": "这只宠物趴在地上，眼睛缓慢眨动，尾巴轻轻摇晃，耳朵偶尔转动，呼吸起伏自然，安静慵懒。保持宠物外观完全不变。镜头固定不动。",
    "yawn": "这只宠物张大嘴巴打了一个大哈欠，露出粉色小舌头，然后慢慢眯起眼睛，很困的样子。保持宠物外观完全不变。镜头固定不动。",
    "lick": "这只宠物低头舔自己的前爪，然后用爪子擦脸，认真地给自己洗脸，动作自然流畅。保持宠物外观完全不变。镜头固定不动。",
    "walk": "这只宠物站在画面正中央原地踏步，四只爪子交替抬起放下，尾巴高高竖起轻轻摇晃，身体保持在画面中心不移动位置，步态可爱自然。保持宠物外观完全不变。镜头固定不动。",
    "sleep": "这只宠物蜷缩成一团，闭着眼睛安静地睡觉，身体随呼吸微微起伏，偶尔耳朵轻微抖动，非常安详。保持宠物外观完全不变。镜头固定不动。",
    "happy": "这只宠物突然眯起眼睛，露出超满足的表情，身体微微扭动蹭来蹭去，尾巴开心地快速摇晃，整只宠物看起来非常幸福。保持宠物外观完全不变。镜头固定不动。",
    "eat": "这只宠物面前放着一个小碗，正低头认真吃东西，嘴巴快速咀嚼，偶尔抬头舔舔嘴，尾巴满足地轻摇，吃得很香很专注。保持宠物外观完全不变。镜头固定不动。",
    "belly": "这只宠物突然翻身仰躺，四脚朝天露出毛茸茸的肚皮，前爪微微卷曲，后腿放松张开，一副撒娇求摸的样子，偶尔身体扭动几下，非常可爱。保持宠物外观完全不变。镜头固定不动。",
    "stretch": "这只宠物站起身体前倾下压，前爪向前伸直贴地，背部拉成一道弧线，伸了一个大大的懒腰，然后慢慢坐下，舒服惬意。四肢与地面接触自然、不穿模、轮廓边界真实。保持宠物外观完全不变。镜头固定不动。",
}

ACTIONS = list(ACTION_PROMPTS.keys())
# 可用 env 限制生成动作（控制成本），如 PIPELINE_ACTIONS=idle,happy,eat,sleep
_actions_env = os.getenv("PIPELINE_ACTIONS", "").strip()
if _actions_env:
    ACTIONS = [a.strip() for a in _actions_env.split(",") if a.strip() in ACTION_PROMPTS]


# ===== API Helpers =====
async def ark_request(method: str, path: str, **kwargs) -> dict:
    """Call Ark API"""
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.request(
            method,
            f"{ARK_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {ARK_API_KEY}", "Content-Type": "application/json"},
            **kwargs,
        )
        resp.raise_for_status()
        return resp.json()


async def generate_character_image(photo_base64: str) -> str:
    """Step 1: Seedream 生成角色设定图，返回 URL"""
    data = {
        "model": SEEDREAM_MODEL,
        "prompt": CHARACTER_PROMPT,
        "image": f"data:image/jpeg;base64,{photo_base64}",
        "response_format": "url",
        "watermark": False,
        "size": "1920x1920",
    }
    result = await ark_request("POST", "/images/generations", json=data)
    return result["data"][0]["url"]


async def submit_video_task(character_url: str, action: str) -> str:
    """Step 2: Seedance 提交视频生成任务，返回 task_id"""
    prompt = ACTION_PROMPTS[action]
    data = {
        "model": SEEDANCE_MODEL,
        "content": [
            {"type": "text", "text": f"{prompt} --duration 5 --camerafixed true --aspectratio 1:1 --watermark false"},
            {"type": "image_url", "image_url": {"url": character_url}},
        ],
    }
    result = await ark_request("POST", "/contents/generations/tasks", json=data)
    return result["id"]


async def poll_video_task(task_id: str, timeout: int = 300) -> str:
    """轮询视频生成任务直到完成，返回 video_url"""
    start = time.time()
    while time.time() - start < timeout:
        result = await ark_request("GET", f"/contents/generations/tasks/{task_id}")
        status = result.get("status", "")
        if status == "succeeded":
            content = result.get("content", {})
            # content 可能是 dict（直接含 video_url）或 list
            if isinstance(content, dict):
                url = content.get("video_url", "")
                if isinstance(url, str) and url:
                    return url
                if isinstance(url, dict):
                    return url.get("url", "")
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "video_url":
                        return item["video_url"]["url"]
            raise Exception(f"No video_url in succeeded task: {json.dumps(content)[:200]}")
        elif status == "failed":
            raise Exception(f"Video generation failed: {result.get('error', 'unknown')}")
        await asyncio.sleep(5)
    raise Exception(f"Video generation timeout after {timeout}s")


async def download_file(url: str, dest: str):
    """下载文件"""
    async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        with open(dest, "wb") as f:
            f.write(resp.content)


def extract_audio(mp4_path: str, audio_path: str):
    """提取音频为 mp3"""
    result = subprocess.run(
        [FFMPEG, "-y", "-i", mp4_path, "-vn", "-acodec", "libmp3lame", "-q:a", "4", audio_path],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"Audio extraction failed: {result.stderr}")


def defringe(im: Image.Image) -> Image.Image:
    """去白色毛边：rembg matte 的半透明边缘像素残留白底颜色，
    白底反解 fg=(obs-(1-α)·255)/α + 低 α 置零 + 边缘收缩 1px 软化"""
    import numpy as np
    from PIL import ImageFilter

    arr = np.asarray(im.convert("RGBA")).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4] / 255.0
    safe_a = np.clip(a, 1e-3, 1.0)
    fg = np.clip((rgb - 255.0 * (1.0 - a)) / safe_a, 0, 255)
    fg = np.where(a >= 0.999, rgb, fg)
    a2 = np.where(a < 0.06, 0.0, a)
    res = Image.fromarray(
        np.concatenate([fg, a2 * 255.0], axis=-1).astype(np.uint8), "RGBA")
    alpha = res.getchannel("A").filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.5))
    res.putalpha(alpha)
    return res


def frames_to_hevc_alpha_mov(nobg_dir: str, mov_path: str):
    """抠图 PNG 序列帧 → iOS 可用的 HEVC alpha 透明 .mov（hevc_videotoolbox，验证过的参数）"""
    result = subprocess.run(
        [
            FFMPEG, "-y",
            "-framerate", "10",
            "-i", os.path.join(nobg_dir, "f_%04d.png"),
            "-c:v", "hevc_videotoolbox",
            "-alpha_quality", "0.75",
            "-q:v", "60",
            "-tag:v", "hvc1",
            "-pix_fmt", "bgra",
            mov_path,
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise Exception(f"HEVC alpha mov encode failed: {result.stderr[-500:]}")
    print(f"  ✅ {mov_path} ({os.path.getsize(mov_path) / 1024:.0f}KB)")


def make_pose_frame(rgba_frames: list, pose_path: str, margin: int = 12, long_edge: int = 600):
    """WidgetKit 组件姿势帧：取 45% 处帧，按 alpha bbox 裁剪留 margin 边，长边缩放到 long_edge"""
    idx = min(int(len(rgba_frames) * 0.45), len(rgba_frames) - 1)
    img = rgba_frames[idx]
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        left = max(0, bbox[0] - margin)
        top = max(0, bbox[1] - margin)
        right = min(img.width, bbox[2] + margin)
        bottom = min(img.height, bbox[3] + margin)
        img = img.crop((left, top, right, bottom))
    ratio = long_edge / max(img.size)
    img = img.resize((max(1, int(img.width * ratio)), max(1, int(img.height * ratio))), Image.LANCZOS)
    img.save(pose_path, format="PNG")
    print(f"  ✅ {pose_path} ({img.width}x{img.height})")


def process_action_video(mp4_path: str, webp_path: str, mov_path: str, pose_path: str):
    """MP4 → 逐帧 rembg 抠图 → animated WebP + HEVC alpha .mov + 姿势帧 PNG"""
    with tempfile.TemporaryDirectory() as tmpdir:
        frames_dir = os.path.join(tmpdir, "frames")
        nobg_dir = os.path.join(tmpdir, "nobg")
        os.makedirs(frames_dir)
        os.makedirs(nobg_dir)

        # 提取帧 10fps
        subprocess.run(
            [FFMPEG, "-i", mp4_path, "-vf", "fps=10", os.path.join(frames_dir, "f_%04d.png")],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
        )

        frame_paths = sorted(glob.glob(os.path.join(frames_dir, "f_*.png")))
        total = len(frame_paths)
        print(f"  Processing {total} frames for {os.path.basename(mp4_path)}...")

        rgba_frames = []
        for i, fp in enumerate(frame_paths):
            img = Image.open(fp)
            result = defringe(rembg_remove(img))
            rgba_frames.append(result)
            # 抠图帧落盘，供 ffmpeg 编码 HEVC alpha mov
            result.save(os.path.join(nobg_dir, f"f_{i + 1:04d}.png"))
            if (i + 1) % 10 == 0 or i == total - 1:
                print(f"    {i + 1}/{total}")

        # 1) animated WebP (真 alpha)
        rgba_frames[0].save(
            webp_path,
            save_all=True,
            append_images=rgba_frames[1:],
            duration=100,  # 10fps
            loop=0,
            lossless=False,
            quality=80,
        )
        print(f"  ✅ {webp_path} ({os.path.getsize(webp_path) / 1024:.0f}KB)")

        # 2) HEVC alpha 透明 .mov（iOS 桌宠播放）
        frames_to_hevc_alpha_mov(nobg_dir, mov_path)

        # 3) WidgetKit 姿势帧 PNG
        make_pose_frame(rgba_frames, pose_path)


# ===== Background Generation Pipeline =====
async def generate_pet_pipeline(pet_id: str, photo_base64: str):
    """完整的宠物生成流水线"""
    pet_dir = GENERATED_DIR / pet_id
    pet_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Step 1: 生成角色设定图
        pets_db[pet_id]["status"] = "character"
        pets_db[pet_id]["step"] = 1
        pets_db[pet_id]["message"] = "正在生成角色设定图..."
        save_pets_db()
        print(f"[{pet_id}] Step 1: Generating character image...")

        char_url = await generate_character_image(photo_base64)
        char_path = str(pet_dir / "character.jpg")
        await download_file(char_url, char_path)
        pets_db[pet_id]["characterImage"] = f"/generated/{pet_id}/character.jpg"
        save_pets_db()
        print(f"[{pet_id}] Character image saved: {char_path}")

        # Step 2: 提交所有视频生成任务（并行）
        pets_db[pet_id]["status"] = "videos"
        pets_db[pet_id]["step"] = 2
        pets_db[pet_id]["message"] = f"正在生成动画视频 (0/{len(ACTIONS)})..."
        save_pets_db()
        print(f"[{pet_id}] Step 2: Submitting {len(ACTIONS)} video tasks...")

        task_ids = {}
        for action in ACTIONS:
            task_id = await submit_video_task(char_url, action)
            task_ids[action] = task_id
            print(f"  Submitted {action}: {task_id}")
            await asyncio.sleep(1)  # 避免限流

        # Step 3: 等待所有视频完成
        pets_db[pet_id]["step"] = 3
        save_pets_db()
        completed = 0
        video_urls = {}

        async def wait_and_download(action: str, task_id: str):
            nonlocal completed
            url = await poll_video_task(task_id, timeout=600)
            mp4_path = str(pet_dir / f"{action}.mp4")
            await download_file(url, mp4_path)
            video_urls[action] = url
            completed += 1
            pets_db[pet_id]["message"] = f"视频下载中 ({completed}/{len(ACTIONS)})..."
            print(f"  [{pet_id}] {action} downloaded: {mp4_path}")

        # 并行等待所有视频
        await asyncio.gather(*[wait_and_download(a, t) for a, t in task_ids.items()])

        # Step 4: 去背景 + HEVC alpha mov + 姿势帧 + 提取音频（串行，CPU 密集）
        pets_db[pet_id]["status"] = "processing"
        pets_db[pet_id]["step"] = 4
        pets_db[pet_id]["message"] = "正在去除背景..."
        save_pets_db()
        print(f"[{pet_id}] Step 4: Removing backgrounds, encoding alpha mov & extracting audio...")

        videos_result = {}
        for i, action in enumerate(ACTIONS):
            mp4_path = str(pet_dir / f"{action}.mp4")
            webp_path = str(pet_dir / f"{action}_nobg.webp")
            mov_path = str(pet_dir / f"{action}.mov")
            pose_path = str(pet_dir / f"{action}_pose.png")
            audio_path = str(pet_dir / f"{action}.mp3")

            pets_db[pet_id]["message"] = f"处理动画 ({i + 1}/{len(ACTIONS)}): {action}..."
            save_pets_db()

            # 去背景 → WebP + HEVC alpha mov + 姿势帧（这个最耗时）
            await asyncio.to_thread(process_action_video, mp4_path, webp_path, mov_path, pose_path)

            # 提取音频
            await asyncio.to_thread(extract_audio, mp4_path, audio_path)

            videos_result[action] = {
                "webp": f"/generated/{pet_id}/{action}_nobg.webp",
                "mov": f"/generated/{pet_id}/{action}.mov",
                "pose": f"/generated/{pet_id}/{action}_pose.png",
                "audio": f"/generated/{pet_id}/{action}.mp3",
                "mp4": f"/generated/{pet_id}/{action}.mp4",
            }

        pets_db[pet_id]["videos"] = videos_result
        pets_db[pet_id]["status"] = "ready"
        pets_db[pet_id]["step"] = 5
        pets_db[pet_id]["message"] = "生成完成！"
        save_pets_db()
        print(f"[{pet_id}] ✅ All done!")

    except Exception as e:
        pets_db[pet_id]["status"] = "failed"
        pets_db[pet_id]["error"] = str(e)
        pets_db[pet_id]["message"] = f"生成失败: {str(e)[:100]}"
        save_pets_db()
        print(f"[{pet_id}] ❌ Error: {e}", file=sys.stderr)


# ===== API Routes =====
@app.get("/api/quota")
async def get_quota(x_device_id: str = Header(None, alias="X-Device-Id")):
    """查询今日免费额度（每天前 N 个不同设备免费，按 Asia/Shanghai 日期重置）"""
    quota = _load_quota()
    free_remaining = max(0, FREE_DAILY_LIMIT - len(quota["devices"]))
    is_free_for_me = bool(x_device_id) and (x_device_id in quota["devices"] or free_remaining > 0)
    return {"free_remaining": free_remaining, "is_free_for_me": is_free_for_me}


@app.post("/api/pet/create")
async def create_pet(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    name: str = Form("小可爱"),
    receipt: str = Form(None),
    x_device_id: str = Header(None, alias="X-Device-Id"),
):
    """上传照片，开始生成宠物。需在当日免费名额内（X-Device-Id），或携带内购 receipt。"""
    if not x_device_id and not receipt:
        return JSONResponse({"error": "Missing X-Device-Id header or receipt"}, status_code=400)

    # 付费/额度校验：先尝试免费名额，再退回收据校验
    if not claim_free_slot(x_device_id):
        if not verify_receipt(receipt):
            return JSONResponse(
                {"error": "Daily free quota exhausted, valid purchase receipt required"},
                status_code=402,
            )

    pet_id = str(uuid.uuid4())[:8]

    # 读取照片 + 压缩
    photo_data = await photo.read()
    img = Image.open(BytesIO(photo_data))
    img = img.convert("RGB")
    # 压缩到 1024px
    if max(img.size) > 1024:
        ratio = 1024 / max(img.size)
        img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=85)
    photo_b64 = base64.b64encode(buf.getvalue()).decode()

    # 保存原图
    pet_dir = GENERATED_DIR / pet_id
    pet_dir.mkdir(parents=True, exist_ok=True)
    img.save(str(pet_dir / "original.jpg"))

    # 初始化状态
    pets_db[pet_id] = {
        "petId": pet_id,
        "name": name,
        "deviceId": x_device_id,
        "status": "queued",
        "step": 0,
        "message": "排队中...",
        "originalPhoto": f"/generated/{pet_id}/original.jpg",
        "characterImage": None,
        "videos": None,
        "createdAt": time.time(),
    }
    save_pets_db()

    # 后台生成
    background_tasks.add_task(generate_pet_pipeline, pet_id, photo_b64)

    return {"petId": pet_id, "status": "queued"}


@app.get("/api/pet/{pet_id}/status")
async def get_pet_status(pet_id: str):
    """查询生成进度"""
    if pet_id not in pets_db:
        return JSONResponse({"error": "Pet not found"}, status_code=404)
    pet = pets_db[pet_id]
    return {
        "petId": pet_id,
        "name": pet.get("name"),
        "status": pet["status"],
        "step": pet.get("step", 0),
        "message": pet.get("message", ""),
        "characterImage": pet.get("characterImage"),
        "videos": pet.get("videos"),
        "error": pet.get("error"),
    }


@app.get("/api/pet/{pet_id}/bundle.zip")
async def get_pet_bundle(pet_id: str):
    """打包该宠物全部产物（HEVC alpha mov + 姿势帧 PNG + 角色图 + manifest）下发客户端"""
    if pet_id not in pets_db:
        return JSONResponse({"error": "Pet not found"}, status_code=404)
    pet = pets_db[pet_id]
    if pet.get("status") != "ready":
        return JSONResponse({"error": f"Pet not ready (status={pet.get('status')})"}, status_code=409)

    pet_dir = GENERATED_DIR / pet_id
    bundle_path = pet_dir / "bundle.zip"

    def build_bundle():
        tmp_path = str(bundle_path) + ".tmp"
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zf:
            char_file = pet_dir / "character.jpg"
            if char_file.exists():
                zf.write(char_file, "character.jpg")
            # 目录结构与客户端 App Group 容器约定一致：videos/<action>.mov + frames/<action>.png
            # 遍历全部动作而非当前 ACTIONS 配置：打包磁盘上实际存在的产物
            for action in ACTION_PROMPTS:
                mov = pet_dir / f"{action}.mov"
                if mov.exists():
                    zf.write(mov, f"videos/{action}.mov")
                pose = pet_dir / f"{action}_pose.png"
                if pose.exists():
                    zf.write(pose, f"frames/{action}.png")
            manifest = {
                "petId": pet_id,
                "name": pet.get("name"),
                "actions": ACTIONS,
                "format": {"video": "hevc-alpha-mov", "pose": "png"},
                "createdAt": pet.get("createdAt"),
            }
            zf.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        os.replace(tmp_path, str(bundle_path))

    if not bundle_path.exists():
        await asyncio.to_thread(build_bundle)

    return FileResponse(
        str(bundle_path),
        media_type="application/zip",
        filename=f"{pet_id}_bundle.zip",
    )


@app.get("/api/pet/{pet_id}")
async def get_pet(pet_id: str):
    """获取宠物完整数据"""
    if pet_id not in pets_db:
        return JSONResponse({"error": "Pet not found"}, status_code=404)
    return pets_db[pet_id]


@app.get("/api/pets")
async def list_pets():
    """列出所有宠物"""
    return [
        {"petId": k, "name": v.get("name"), "status": v["status"], "characterImage": v.get("characterImage")}
        for k, v in pets_db.items()
    ]


@app.get("/")
async def health():
    return {"service": "pawpet-backend", "actions": ACTIONS, "pets": len(pets_db)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8900)
