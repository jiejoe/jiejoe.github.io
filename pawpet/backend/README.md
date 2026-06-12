# 爪爪桌宠 PawPet Backend

iOS App「爪爪桌宠」的生成后端：

```
用户上传宠物照片
  → Seedream 图生图：角色设定图（白底全身像）
  → Seedance 图生视频：9 个动作视频（idle / yawn / lick / walk / sleep / happy / eat / belly / stretch）
  → rembg 逐帧抠图
  → 输出：HEVC alpha 透明 .mov（iOS 桌宠播放）+ animated WebP + WidgetKit 姿势帧 PNG + 音频 mp3
```

## 本地启动

```bash
cd pawpet/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # 填入 ARK_API_KEY

uvicorn server:app --host 0.0.0.0 --port 8900
# 或 python3 server.py
```

依赖说明：

- ffmpeg 需支持 `hevc_videotoolbox`（macOS 自带硬件编码，Homebrew 版即可：`/opt/homebrew/bin/ffmpeg`）。
- rembg 首次运行会自动下载 u2net 模型。

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/quota` | 今日免费额度。请求头 `X-Device-Id`。返回 `{"free_remaining": n, "is_free_for_me": bool}`。每天前 5 个不同设备免费，按 Asia/Shanghai 本地日期重置，计数落盘 JSON。 |
| POST | `/api/pet/create` | 上传照片开始生成。`multipart/form-data`：`photo`（图片文件）、`name`（可选）、`receipt`（可选，内购收据）。请求头 `X-Device-Id`。校验：当日免费名额内 或 receipt 通过校验（当前为占位校验，TODO 接 StoreKit 2 server 校验），否则 402。返回 `{"petId", "status": "queued"}`。 |
| GET | `/api/pet/{id}/status` | 轮询生成进度：`status`（queued/character/videos/processing/ready/failed）、`step`、`message`、`characterImage`、`videos`。 |
| GET | `/api/pet/{id}` | 宠物完整数据。 |
| GET | `/api/pet/{id}/bundle.zip` | 生成完成后，打包全部 `*.mov` + `*_pose.png` + `character.jpg` + `manifest.json` 整包下发客户端（首次请求时构建并缓存）。 |
| GET | `/api/pets` | 列出所有宠物。 |
| GET | `/generated/{id}/...` | 静态产物：`character.jpg`、`{action}.mov`、`{action}_nobg.webp`、`{action}_pose.png`、`{action}.mp3`、`{action}.mp4`。 |
| GET | `/` | 健康检查。 |

每个动作的产物：

- `{action}.mov` — HEVC alpha 透明视频（`hevc_videotoolbox`，`-tag:v hvc1 -pix_fmt bgra`），iOS AVPlayer 直接播放。
- `{action}_nobg.webp` — 真 alpha animated WebP（10fps）。
- `{action}_pose.png` — WidgetKit 姿势帧：取视频 45% 处帧，按 alpha bbox 裁剪留 12px 边，长边 600px。
- `{action}.mp3` / `{action}.mp4` — 音频与原始视频。

持久化：`data/pets_db.json`（宠物状态，重启不丢）、`data/quota.json`（每日免费额度计数）。

## 部署到云服务器（简要）

> 注意：`hevc_videotoolbox` 是 Apple 硬件编码器，只在 macOS 上可用。云端部署有两种选择：
> ① 用一台 Mac mini 云主机（如 MacStadium / 阿里云 Mac 实例），ffmpeg 命令原样可用（推荐）；
> ② 普通 Linux 服务器需把 `frames_to_hevc_alpha_mov` 换成软件编码方案（如 ProRes 4444 alpha 中转后由客户端/Mac 转码），本 README 按方案 ① 写。

1. 服务器装好 Python 3.11+、ffmpeg（确认 `ffmpeg -encoders | grep hevc_videotoolbox` 有输出），把 `FFMPEG_PATH` 指到实际路径。
2. 拉代码、建 venv、`pip install -r requirements.txt`、配置 `.env`（填 ARK_API_KEY）。
3. 用进程守护跑起来：
   ```bash
   # systemd / launchd / 简单用 nohup：
   nohup uvicorn server:app --host 0.0.0.0 --port 8900 --workers 1 >> server.log 2>&1 &
   ```
   注意：免费额度与 pets_db 用本地 JSON 落盘，需保持单 worker（`--workers 1`）。
4. 前置 Nginx / Caddy 反代 + HTTPS（App Store 要求 ATS）：反代 `:8900`，`client_max_body_size 20m`（照片上传）。
5. 持久化目录 `generated/`、`data/` 放在数据盘并定期备份；`generated/` 会随用户增长，按需做过期清理。
6. TODO 上线前：`receipt` 占位校验换成 StoreKit 2 App Store Server API 校验。
