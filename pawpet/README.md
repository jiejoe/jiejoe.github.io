# 爪爪桌宠 PawPet Widgets

上传你家宠物的照片，AI 生成神还原的专属虚拟桌宠，住进 iOS 桌面小组件。

## 产品概览

- **一张照片 → 专属桌宠**：Seedream 图生图角色设定 → Seedance 图生视频 8+1 个动作 → rembg 抠图 → 透明背景 HEVC alpha 视频 + 组件姿势帧
- **桌面组件（核心卖点）**：小/中/大三种 WidgetKit 组件；按时段切换姿势（早上伸懒腰、中午干饭、深夜睡觉）；按宠物人设的主题配色与情感化台词；陪伴天数计数
- **内置 4 只示例宠物**（免费体验）：
  | ID | 名字 | 角色 | 人设 / 主题 |
  |----|------|------|-------------|
  | juju | 包子 | 银渐层英短 | 高冷慵懒 / 奶灰暖米 |
  | dollar | Dollar | 白色小狗 | 阳光活力 / 活力橙黄 |
  | mixian | 米线 | 布偶猫 | 优雅黏人 / 蓝紫梦幻 |
  | uni | 噗噗 | 独角兽玩偶 | 治愈童话 / 粉紫马卡龙 |
- **收费**：单次生成 ¥18（paw.generate.once）；Pro 订阅 ¥12/月、¥68/年（每月 2 次生成 + 全部组件样式）；**每日前 5 名免费 1 次**（服务端按设备数控制）

## 目录结构

```
pawpet/
├── ios/                 # Xcode 工程（xcodegen）
│   ├── project.yml      #   双 target：PawPet (App) + PawPetWidget (扩展)
│   ├── App/             #   SwiftUI：小窝/组件/领养/我的 + StoreKit2 + 生成 API 客户端
│   ├── Widget/          #   WidgetKit：时段时间线 + 分宠物主题组件
│   ├── Shared/          #   两 target 共享：模型/主题/时段/文案库/App Group 存储
│   ├── Resources/       #   PetMedia(视频/音效) + PetFrames(组件帧)
│   └── PawPet.storekit  #   本地 IAP 测试配置
├── backend/             # FastAPI 生成管线（Seedream + Seedance + rembg + HEVC alpha）
├── assets/              # 整理后的宠物素材库（透明 mov / 组件帧 / 角色图 / 音效）
├── tools/               # 资产批量转换脚本
└── docs/                # App Store 上架指南 + 抖音投流方案
```

## 跑起来

```bash
# iOS（需要 xcodegen：brew install xcodegen）
cd ios && xcodegen generate
open PawPet.xcodeproj   # 选 PawPet scheme 跑模拟器

# 后端（生成专属宠物用，演示内置宠物不需要）
cd backend && cp .env.example .env  # 填 ARK_API_KEY
pip3 install -r requirements.txt
python3 server.py        # http://127.0.0.1:8900
```

## 关键技术决策

- **透明视频**：iOS 不支持 webm alpha，统一转 HEVC with alpha（`hevc_videotoolbox -alpha_quality 0.75 -tag:v hvc1 -pix_fmt bgra`），AVPlayerLayer 设 BGRA pixelBuffer 原生渲染，验证可用
- **Widget 不能播视频**：组件用「时段 × 姿势帧」方案——每个时段边界一条 timeline entry，宠物换姿势、换台词，制造「它真的活在桌面上」的感觉
- **App Group**（group.com.kotoko.pawpet）：生成的专属宠物资产包（bundle.zip）解压到共享容器，App 与组件都能读
- **生成成本控制**：内置宠物全部复用已验证素材，0 生成成本；新增动作单任务提交、不自动重试

## 待办（上架前）

- [ ] 后端部署（需 Mac 云主机跑 hevc_videotoolbox，或换 libx265+alpha 方案）
- [ ] GeneratorAPI.baseURL 换正式 HTTPS 域名，移除 ATS 任意加载
- [ ] StoreKit 收据服务端校验（backend 留了 TODO）
- [ ] PrivacyInfo.xcprivacy + 隐私政策/条款页面（pawpet.app 域名）
- [ ] 中国区 ICP 备案（详见 docs/app-store-上架指南.md）
- [ ] 真机验证 Widget 刷新与 HEVC alpha 在低端机型表现
