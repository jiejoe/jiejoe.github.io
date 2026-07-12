document.body.setAttribute("data-script-ready", "yes");
document.body.dataset.scene = "door";

const scenes = {
  door: document.getElementById("scene-door"),
  room: document.getElementById("scene-room"),
  coffee: document.getElementById("scene-coffee"),
  desk: document.getElementById("scene-desk"),
  chat: document.getElementById("scene-chat"),
  contact: document.getElementById("scene-contact")
};

const progressLabels = [
  document.getElementById("p1"),
  document.getElementById("p2"),
  document.getElementById("p3"),
  document.getElementById("p4")
];

const workPanel = document.getElementById("work-panel");
const browserList = document.getElementById("browser-list");
const browserDetail = document.getElementById("browser-detail");
const workTabs = Array.from(document.querySelectorAll("[data-work-tab]"));
const deskBackCue = document.getElementById("desk-back-cue");
const chatBackCue = document.getElementById("chat-back-cue");
const qStageBubble = document.getElementById("q-stage-bubble");
const qStageText = document.getElementById("q-stage-text");
const meEcho = document.getElementById("me-echo");
const chatInput = document.getElementById("chat-input");
const chatSuggestions = document.getElementById("chat-suggestions");
const chatSendButton = document.getElementById("send-btn");
const soundToggle = document.getElementById("sound-toggle");
const backgroundMusic = document.getElementById("background-music");
const uiClickAudio = document.getElementById("ui-click-audio");
const messageModal = document.getElementById("message-modal");
const messageWall = document.getElementById("message-wall");
const messageForm = document.getElementById("message-form");
const messageName = document.getElementById("message-name");
const messageText = document.getElementById("message-text");
const messageWebsite = document.getElementById("message-website");
const messageStatus = document.getElementById("message-status");
const messageDoodleCanvas = document.getElementById("message-doodle-canvas");
const messageDoodleClear = document.getElementById("message-doodle-clear");
const siteLoader = document.getElementById("site-loader");
const loaderStatus = document.getElementById("loader-status");
const moodTrigger = document.getElementById("mood-trigger");
const moodMenu = document.getElementById("mood-menu");
const moodButtons = Array.from(document.querySelectorAll("[data-mood]"));
const musicTrigger = document.getElementById("music-trigger");
const musicMenu = document.getElementById("music-menu");
const musicButtons = Array.from(document.querySelectorAll("[data-music]"));
const musicUploadTrigger = document.getElementById("music-upload-trigger");
const musicFileInput = document.getElementById("music-file-input");
const musicNow = document.getElementById("music-now");
const doorIdleVideo = document.getElementById("door-idle-video");
const doorOpenVideo = document.getElementById("door-open-video");
const roomLoopVideo = document.getElementById("room-loop-video");
const deskLoopVideo = document.getElementById("desk-loop-video");
const chatIdleVideo = document.getElementById("chat-idle-video");
const chatRelaxedVideo = document.getElementById("chat-relaxed-video");
const chatWaitingVideo = document.getElementById("chat-waiting-video");
const chatTalkVideo = document.getElementById("chat-talk-video");
const contactVideo = document.getElementById("contact-video");
const coffeeMenuCard = document.getElementById("coffee-menu-card");
const coffeeMenuTitle = document.getElementById("coffee-menu-title");
const coffeeMenuBack = document.getElementById("coffee-menu-back");
const coffeeMenuRoot = document.getElementById("coffee-menu-root");
const coffeeMenuPour = document.getElementById("coffee-menu-pour");
const coffeeMenuEspresso = document.getElementById("coffee-menu-espresso");
const coffeeOrderBadge = document.getElementById("coffee-order-badge");
const coffeeToast = document.getElementById("coffee-toast");
const coffeeResultControls = document.getElementById("coffee-result-controls");
const coffeeResultChat = document.getElementById("coffee-result-chat");
const coffeePourVideo = document.getElementById("coffee-pourover-video");
const coffeeAmericanoVideo = document.getElementById("coffee-americano-video");
const coffeeSectionButtons = Array.from(document.querySelectorAll("[data-coffee-section]"));
const coffeeDrinkButtons = Array.from(document.querySelectorAll("[data-coffee-video]"));
const sceneLoopVideos = {
  room: roomLoopVideo,
  desk: deskLoopVideo
};
const chatStateVideos = {
  idle: chatIdleVideo,
  relaxed: chatRelaxedVideo,
  waiting: chatWaitingVideo,
  talk: chatTalkVideo
};
const coffeeVideos = {
  pourover: coffeePourVideo,
  americano: coffeeAmericanoVideo
};
let activeCoffeeVideoKey = "";
let activeCoffeeLabel = "";
let coffeeToastTimer = 0;
let coffeeCompletionTimer = 0;
let coffeeRunId = 0;

function revealVideoFrame(video, callback) {
  if (!video) return;
  const reveal = () => {
    video.classList.add("frame-ready");
    callback?.();
  };
  if (typeof video.requestVideoFrameCallback === "function") {
    video.requestVideoFrameCallback(reveal);
    return;
  }
  window.requestAnimationFrame(() => window.setTimeout(reveal, 32));
}

function setSceneFallbackReady(scene, video) {
  if (!scene || !video) return;
  scene.classList.toggle("media-ready", video.readyState >= 2 && !video.error);
}

function bindPrimarySceneFallback(scene, video) {
  if (!scene || !video) return;
  const showVideo = () => revealVideoFrame(video, () => scene.classList.add("media-ready"));
  const showFallback = () => {
    video.classList.remove("frame-ready");
    scene.classList.remove("media-ready");
  };
  video.addEventListener("playing", showVideo);
  video.addEventListener("error", showFallback);
  video.addEventListener("emptied", showFallback);
  if (!video.paused && video.readyState >= 2) showVideo();
}

function bindChatSceneFallback(video) {
  if (!video || !scenes.chat) return;
  const syncSelectedVideo = () => {
    if (!video.classList.contains("is-active")) return;
    revealVideoFrame(video, () => scenes.chat.classList.add("media-ready"));
  };
  const showFallback = () => {
    video.classList.remove("frame-ready");
    if (video.classList.contains("is-active")) scenes.chat.classList.remove("media-ready");
  };
  video.addEventListener("playing", syncSelectedVideo);
  video.addEventListener("error", showFallback);
  video.addEventListener("emptied", showFallback);
}

bindPrimarySceneFallback(scenes.door, doorIdleVideo);
bindPrimarySceneFallback(scenes.room, roomLoopVideo);
bindPrimarySceneFallback(scenes.desk, deskLoopVideo);
Object.values(chatStateVideos).forEach(bindChatSceneFallback);

function startSiteLoader() {
  if (!siteLoader) return;
  const criticalMedia = [
    ...document.querySelectorAll(".scene > img"),
    doorIdleVideo,
    doorOpenVideo,
    roomLoopVideo,
    deskLoopVideo,
    chatIdleVideo,
    chatRelaxedVideo
  ].filter(Boolean);
  let settled = 0;
  const total = Math.max(1, criticalMedia.length);
  const update = () => {
    if (!loaderStatus) return;
    const progress = settled / total;
    loaderStatus.textContent = settled >= total
      ? "The room is glowing."
      : progress < .5
        ? "Tracing a little light…"
        : "Letting the glass catch the glow…";
  };
  const waitForMedia = element => new Promise(resolve => {
    const isImage = element instanceof HTMLImageElement;
    const ready = isImage ? element.complete && element.naturalWidth > 0 : element.readyState >= 3;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      settled += 1;
      update();
      resolve();
    };
    if (ready) {
      done();
      return;
    }
    const eventName = isImage ? "load" : "canplay";
    element.addEventListener(eventName, done, { once: true });
    element.addEventListener("error", done, { once: true });
  });
  update();
  const warmVideo = async video => {
    if (!video || video.error) return;
    const previousTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    video.muted = true;
    try {
      await video.play();
      await new Promise(resolve => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        revealVideoFrame(video, done);
        window.setTimeout(done, 900);
      });
    } catch (error) {
      void error;
    }
    video.pause();
    try {
      video.currentTime = previousTime > 0 ? previousTime : 0.001;
    } catch (error) {
      void error;
    }
  };
  const mediaReady = Promise.all(criticalMedia.map(waitForMedia));
  const warmedMedia = mediaReady.then(() => Promise.all([
    warmVideo(doorOpenVideo),
    warmVideo(roomLoopVideo)
  ]));
  const safetyReady = new Promise(resolve => window.setTimeout(resolve, 9000));
  const minimumGlow = new Promise(resolve => window.setTimeout(resolve, 2300));
  Promise.all([Promise.race([warmedMedia, safetyReady]), minimumGlow]).then(() => {
    if (loaderStatus) loaderStatus.textContent = "The room is glowing.";
    window.setTimeout(() => {
      siteLoader.classList.add("is-complete");
      document.body.classList.remove("site-loading");
    }, 320);
  });
}

function setRoomMood(nextMood) {
  const mood = ["glow", "lights-out", "disco"].includes(nextMood) ? nextMood : "glow";
  document.body.classList.remove("mood-lights-out", "mood-disco");
  if (mood === "lights-out") document.body.classList.add("mood-lights-out");
  if (mood === "disco") document.body.classList.add("mood-disco");
  moodButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mood === mood)));
}

const MUSIC_TRACKS = {
  serene: { label: "Serene Piano", src: "./assets/music-serene-piano.mp3?v=20260712" },
  ambient: { label: "Calm Ambient", src: "./assets/music-calm-ambient.mp3?v=20260712" },
  piano: { label: "Calm Piano", src: "./assets/music-calm-piano.mp3?v=20260712" },
};
let customMusicUrl = "";

function syncMusicControls(trackId, label) {
  musicButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.music === trackId)));
  if (musicNow) musicNow.textContent = `Now playing · ${label}`;
  if (backgroundMusic) {
    backgroundMusic.dataset.musicId = trackId;
    backgroundMusic.dataset.musicLabel = label;
  }
}

startSiteLoader();
setRoomMood("glow");

const sceneProgress = {
  door: -1,
  room: 0,
  coffee: 0,
  desk: 1,
  chat: 2,
  contact: 3
};
const workedOnItems = [
  {
    id: "taobao",
    icon: "./assets/icon-taobao.png",
    meta: "Alibaba / Taobao",
    stamp: "recent",
    name: "淘宝",
    blurb: "AI 导购 / 意图整理 / 核心 App 体验",
    href: "https://www.taobao.com/",
    chip: "Public Marketplace × AI Shopping",
    title: "AI 导购",
    desc: "通过 AI 的能力为消费者构建购物工具，帮助用户管理收藏的商品、从浏览商品的足迹中发现兴趣，并把站外种草内容整理成可购物的商品清单，让分散的消费线索更容易转化成下一步行动。",
    media: [],
    metrics: [
      ["10亿级", "用户产品场景"],
      ["AI Native", "购物体验探索"]
    ],
    res: "GSB 评测体系 · bad case 26%→8% · 分类准确性 56%→98%"
  },
  {
    id: "homestyler",
    icon: "./assets/icon-homestyler.png",
    meta: "AI tools · Creator workflow",
    stamp: "2003",
    name: "Homestyler",
    blurb: "AI Designer / design workflow",
    href: "https://www.homestyler.com/",
    chip: "AI for Design Workflow",
    title: "Homestyler AI Designer",
    desc: "面向家装场景的 AI Designer，支持把照片或 3D 方案快速生成家居效果图，帮助设计师和用户更快看到改造后的空间效果，缩短沟通与决策周期，也让方案更容易进入后续选择与付费流程。",
    media: [
      { src: "./assets/homestyler.png", alt: "Homestyler AI Designer", caption: "家装 AI Designer 成图效果", wide: true }
    ],
    metrics: [
      ["国际版付费", "真实商业化"],
      ["生图评测", "模型微调工作流"]
    ],
    res: "reference image · style control · evaluation"
  },
  {
    id: "meijian",
    icon: "./assets/icon-meijian.png",
    meta: "0→1 · Meijian",
    stamp: "2019",
    name: "美间",
    blurb: "设计工具 / 内容社区 / 商业化闭环",
    href: "https://www.meijian.com/",
    chip: "0→1 Product System",
    title: "美间 Moodboard",
    desc: "服务软装设计师的设计工具与内容社区，覆盖素材收集、搭配出案、商品链接和分享带货，把素材、方案、商品和交易串成连续工作流，帮助设计师提升效率，也沉淀长期可持续的商业闭环。",
    media: [
      { src: "./assets/meijian.png", alt: "美间 Moodboard", caption: "Moodboard 与设计工具界面", wide: true }
    ],
    metrics: [
      ["80W+", "注册用户"],
      ["双11 GMV1000W", "商业化闭环"]
    ],
    res: "创业 0→1 · 周活 9W+ · 复购 60%+"
  }
];
const selectedWorkItems = [
  {
    id: "twin",
    order: "01 / 实验 · Live project",
    title: "数字分身旅行",
    tag: "AIGC",
    cat: "AIGC · 平行世界的我",
    url: "https://another-me-q.jiejoe-eth.workers.dev/",
    subtitle: "如果平行世界的我正在环游世界？",
    theme: "dark",
    span: "span-6",
    art: "./assets/travel-xhs.png",
    meta: "个人探索 · 社交 · AIGC",
    modalHero: false,
    one: "用自己的面部特征生成 AI 数字人，让另一个我在世界各地旅行。",
    desc: "<b>初衷</b>：AI 做梦——如果有平行世界的另一个我在环游世界，会是怎样一种人生。<br><br><b>概念</b>：用自己的面部特征生成一个 AI 数字人，让她代替我在世界各地旅行。每天定时收到她寄来的旅行日记、Live 视频或照片；她拥有自己的小红书主页，经营世界旅行和情感故事内容。<br><br><b>图片 / 视频生成</b>：实测了 Sora、Seedance、可灵等主流模型，覆盖 Live 图、Vlog、换场景脚本等形式。<br><br><b>内容创作</b>：用 LLM 生成旅行故事剧情和生活化文案，发布后获得了真人的互动回复。",
    chips: ["Experiment", "AIGC", "游戏化互动", "小红书运营"],
    points: [
      ["Concept", "让 AI 生成的另一个自己持续生活，形成连续更新的人物体验。"],
      ["Content", "LLM 剧情 + 视频模型素材，形成连续旅行叙事。"],
      ["Feedback", "真正发到社交平台，看真人会不会愿意跟她互动。"]
    ],
    gallery: [
      { src: "./assets/travel-xhs.png", alt: "数字分身小红书主页", caption: "数字分身主页与连续旅行内容入口", tall: true, fit: "contain" },
      { src: "./assets/travel-profile-grid.jpg", alt: "旅行主页矩阵", caption: "角色主页和连续内容矩阵", tall: true, fit: "contain" },
      { src: "./assets/travel-note.png", alt: "旅行日记内容", caption: "旅行日记与人物叙事文案", tall: true, fit: "contain" },
      { src: "./assets/travel-snow-note.jpg", alt: "雪景旅行内容", caption: "不同场景下的角色一致性测试", tall: true, fit: "contain" },
      { src: "./assets/travel-map.png", alt: "旅行地图", caption: "平行旅行轨迹与地点想象", tall: true, fit: "contain" },
      { src: "./assets/travel-wallet.jpg", alt: "旅行生活细节", caption: "把生活物件也纳入角色世界观", tall: true, fit: "contain" }
    ]
  },
  {
    id: "companion",
    order: "02 / 儿童 AI 早教陪伴机器人",
    title: "萌伴",
    tag: "Hardware + App",
    cat: "Hardware + App · Multimodal AI Companion",
    subtitle: "给孩子做一个 AI 小伙伴。",
    theme: "light",
    span: "span-6",
    art: "./assets/companion-app.png",
    meta: "个人探索 · 陪伴 · 硬件",
    one: "给孩子做一个 AI 小伙伴。",
    statusLabel: "Still Working On",
    desc: "萌伴是一台面向 2-6 岁儿童的桌面 AI 陪伴机器人：它不是屏幕里的问答助手，而是一个有生命感的小伙伴。产品围绕角色扮演、过家家、自主探索、日常生活练习和睡前陪伴展开，把视觉感知、儿童语音理解、触摸反馈、动作表情和长程记忆组合起来，让 AI 能参与孩子真实的游戏和成长场景。<br><br>设计上，我更关注三件事：第一，儿童安全和亲和力，形态要圆润、低压、安全、可被孩子自然靠近；第二，多模态交互，萌伴要能看见孩子拿起的玩具、听懂含糊表达、用表情和动作回应；第三，长程记忆与家长端，让它记得孩子的兴趣、学习进度和重要时刻，同时把成长记录交还给家长管理。",
    chips: ["硬件", "陪伴", "长程记忆"],
    points: [
      ["Product Definition", "面向 2-6 岁儿童和家庭场景，定义“有生命感”的桌面 AI 伙伴：陪过家家、角色扮演、自主探索，也能做睡前故事和情绪安抚。"],
      ["Interaction System", "把视觉、语音、触摸、表情和动作融合起来，让孩子举起玩具、发出声音、轻拍设备时，AI 能理解意图并即兴回应。"],
      ["Memory & Parent App", "用长程记忆记录孩子兴趣、学习进度和成长里程碑；家长端负责查看、编辑、删除记忆，并生成成长回顾。"]
    ],
    gallery: [
      { type: "video", src: "./assets/mengban-idle.mp4", poster: "./assets/mengban-idle-poster.jpg", alt: "萌伴待机动画", caption: "<b>角色头图</b> — 一个有生命感的桌面 AI 陪伴机器人形象", fit: "contain", wide: true, hideInGallery: true },
      { src: "./assets/companion-call.png", alt: "萌伴语音通话", caption: "<b>语音通话</b> — 低延迟对话，会转头、会拍照的小伙伴" },
      { src: "./assets/companion-hardware.png", alt: "萌伴硬件原型", caption: "<b>硬件原型</b> — 树莓派 + 舵机，Vibe Coding 焊出来的" }
    ]
  },
  {
    id: "shipu",
    order: "03 / 吉他谱 App",
    title: "拾谱",
    tag: "吉他谱 App",
    cat: "吉他谱整理与练习",
    subtitle: "AI 个人谱库。",
    theme: "light",
    span: "span-4",
    art: "./assets/shipu-library.png",
    meta: "独立开发 · 收集 — 整理 — 练习",
    one: "AI 个人谱库。",
    statusLabel: "coming on App Store",
    desc: "最近我在做拾谱，一款面向吉他练习者的个人谱库与练习工具。它把散落在公众号、短视频、聊天页面截图和相册里的吉他谱，整理成一个可以长期维护、随时拿出来练习的个人谱库。<br><br>它有点像垂直音乐学习场景下的个人知识库和 AI 助手：个人知识库负责持续沉淀用户收藏的谱子，AI 则帮助用户识别内容、完成整理，并从已有曲谱中提供下一次练习的灵感，让业余练习者更容易找到谱、看懂谱，也知道今天可以练什么。<br><br>目前产品先从 AI 识别、自动整理、灵感提供和看谱交互这些基础能力开始；后续计划加入练习记录、个性化练习建议、难点辅助，以及更长期的音乐学习支持。这既是我对垂类 AI 产品和 Agent 个人场景的一次探索，也是我作为独立开发者准备尝试上架的第一个 App。",
    chips: ["正在上架 App Store", "练习册", "独立开发"],
    modalHero: false,
    points: [
      ["解决的问题", "把保存在相册里的零散吉他谱重新变成可查找、可分类、可持续使用的练习资料，减少找谱、选谱和翻谱时的反复操作。"],
      ["主要功能", "AI 自动识别谱子内容和歌曲名称；练习时支持多页查看、自由缩放、轻点翻页，以及适合不同设备的多种看谱模式。"],
      ["产品亮点", "根据弹奏方式、歌曲语言、常听歌手和个人偏好自动生成灵感册，把用户已经收藏的内容重新组织起来，帮助解决“今天练什么”。"]
    ],
    gallery: [
      { src: "./assets/practice-home.png", alt: "拾谱练习入口", caption: "<b>练习入口</b> — 最近练过、练习册和今日练习被放在同一条练琴链路里。", wide: true, fit: "contain" },
      { src: "./assets/viewer-metronome.png", alt: "节拍器与看谱", caption: "<b>看谱与节拍器</b> — iPad 双页看谱、节拍器和视图切换服务真实练习场景。", wide: true, fit: "contain" }
    ]
  },
  {
    id: "community",
    order: "04 / 黑客松 / 分享",
    title: "社群交流",
    tag: "Community",
    subtitle: "成为 builder 的一员。",
    theme: "dark",
    span: "span-3",
    art: "./assets/meoo-community.png",
    meta: "输出也是输入",
    one: "持续和开发者、AI 从业者、企业用户沟通，把一线使用感带回产品判断里。",
    desc: "曾被颁发为“最会用 AI 的阿里人”，内网 title：「纯AI战神」。参加并组织 builder 社区活动、黑客松比赛和主题交流，也在内部平台里做宣传文章、教程和 demo 分享。这些输入让我获得更真实的社区认知：知道不同角色怎样使用 AI，也知道他们真正期待什么样的产品价值。",
    chips: ["「纯AI战神」", "「为 AI 痴狂」", "黑客松常客"],
    points: [
      ["Output", "写教程、做 demo、讲自己的工具，不只是展示，也是在整理方法。"],
      ["Community", "和 builder 连续交流，获得真实的使用语境。"]
    ],
    gallery: [
      { src: "./assets/meoo-community.png", alt: "AI 社群交流", caption: "分享、交流与用户反馈现场", wide: true },
      { src: "./assets/showcase-demo.png", alt: "现场 Demo", caption: "把 demo 带到现场给人真实试用" }
    ]
  },
  {
    id: "ai-life",
    order: "05 / Harness / 养虾 / 旅行 / 运动",
    title: "更多灵感…",
    tag: "Life Experiments",
    subtitle: "用 AI 解决生活中的问题。",
    theme: "dark",
    span: "span-5",
    art: "./assets/denmark-chat.png",
    meta: "个人 AI Harness · 生活场景",
    one: "用 AI 处理养虾、旅行和运动训练这些真实生活问题。",
    desc: "<b>养虾</b>：把 AI 当成生活里的长期顾问，用来整理水质、喂食、异常状态和维护记录。<br><br><b>旅行</b>：用多人 AI 群聊拆解签证、机票、酒店和每日路线，把复杂行程变成可以协作推进的任务流。<br><br><b>羽毛球</b>：拿自己的训练视频做视觉分析，观察落点、球路和身体动作如何被转成普通爱好者能理解的反馈。",
    chips: ["个人 AI Harness", "旅行规划", "运动分析", "生活实验"],
    points: [
      ["Travel", "AI 群聊承担多人协作任务流，帮助旅行信息持续推进和整理。"],
      ["Sports", "分析结果必须进入下一次训练，图表才有意义。"],
      ["Daily life", "长期陪你做决定的 AI，会比一次性回答更接近日常价值。"]
    ],
    gallery: [
      { src: "./assets/harness-discord.png", alt: "AI Harness 主界面", caption: "把生活任务接入日常 AI Harness", wide: true },
      { src: "./assets/harness-mobile-1.png", alt: "Harness mobile 1", caption: "移动端生活流协作界面", tall: true },
      { src: "./assets/harness-mobile-2.png", alt: "Harness mobile 2", caption: "移动端多任务上下文", tall: true },
      { src: "./assets/denmark-chat.png", alt: "旅行 AI 群聊", caption: "旅行群聊式任务推进" },
      { src: "./assets/denmark-route.png", alt: "旅行路线规划", caption: "路线规划与资料归档" },
      { src: "./assets/badminton-field-test.jpg", alt: "羽毛球现场测试", caption: "真实训练场景采样" },
      { src: "./assets/badminton-ai-analysis.jpg", alt: "羽毛球分析结果", caption: "AI 视觉分析如何回到下一次训练" }
    ]
  }
];

const qStudioItem = {
  id: "qstudio",
  order: "04 / 当前这个网站",
  title: "Q Studio",
  tag: "Work project",
  cat: "当前这个网站",
  url: "https://jiejoe.github.io/",
  subtitle: "我在这现在搭建的这个个人网站",
  one: "一个带游戏感的个人工作室，也是我最近持续打磨的互动网站实验。",
  desc: "目前最近正在尝试搭建这个网站，尝试了多种办法用 Three.js 的方式，实践各种画风（如皮克斯风、粘土风、超现实高清主义风）以及技术栈部分。长期探索搭建这种可互动、带游戏风格的个人工作室，并实践影视生成、游戏生成方面的工作流、功能场景和 Agent 应用。过程非常有趣，也对目前 Agent 工作流的各种工具和模型能力有了更多的理解。第一次意识到，AI 抽卡与否考验的是文学功底。",
  chips: ["AIGC", "影视游戏", "Agent Workflow"],
  gallery: [
    { src: "./assets/qstudio-homepage.png", alt: "Q Studio 个人网站场景页", caption: "当前网站的长页视觉和作品入口", wide: true },
    { src: "./assets/qstudio-storyboard.png", alt: "Q Studio 互动短片故事版", caption: "房间、镜头和交互路径的故事版", wide: true }
  ],
  video: { src: "./assets/room.mp4", poster: "./assets/room-new.png", alt: "Q Studio 房间循环视频" }
};

const workWallItems = [
  {
    id: "twin",
    source: "selected",
    order: "01 / 实验 · Live project",
    title: "数字分身",
    tag: "实验 · Live project",
    cat: "AIGC · 平行世界的我",
    subtitle: "如果平行世界的我正在环游世界？",
    accent: "pink",
    size: "span-half",
    chips: ["Experiment", "AIGC", "游戏化互动"],
    previewMode: "mark"
  },
  {
    id: "companion",
    source: "selected",
    order: "02 / 儿童 AI 早教陪伴机器人",
    title: "萌伴",
    tag: "儿童 AI 早教陪伴机器人",
    cat: "Hardware + App · Multimodal AI Companion",
    subtitle: "给孩子做一个 AI 小伙伴。",
    accent: "orange",
    size: "span-half",
    chips: ["硬件", "陪伴", "长程记忆"],
    previewMode: "companion"
  },
  {
    id: "shipu",
    source: "selected",
    order: "03 / 吉他谱 App",
    title: "拾谱",
    tag: "吉他谱 App",
    cat: "吉他谱整理与练习",
    subtitle: "AI 个人谱库。",
    accent: "yellow",
    size: "span-third",
    chips: ["正在上架 App Store", "练习册"],
    previewMode: "shipu"
  },
  {
    id: "qstudio",
    source: "qstudio",
    order: "04 / 当前这个网站",
    title: "Q Studio",
    tag: "Work project",
    cat: "当前这个网站",
    subtitle: "我在这现在搭建的这个个人网站",
    accent: "sand",
    size: "span-third",
    chips: ["AIGC", "影视游戏"],
    previewMode: "qstudio"
  },
  {
    id: "work-project",
    source: "workProject",
    order: "05 / Work project",
    title: "Work project",
    tag: "Work project",
    cat: "工作项目",
    subtitle: "工作中的一些项目",
    accent: "violet",
    size: "span-third",
    chips: ["AI Shopping", "AI Tools", "0→1"],
    previewMode: "plain",
    cover: "./assets/work-project-reference.png"
  }
];
let activeWorkDetailId = null;
let activeWorkedId = "taobao";
let activeSelectedId = "shipu";
let activeWorkTab = "worked";
const WORKER = "https://another-me-q.jiejoe-eth.workers.dev";
const MESSAGE_ENDPOINT = WORKER + "/qroom-messages";
let chatBusy = false;
let chatAnswering = false;
let chatVisualState = "waiting";
let chatRunId = 0;
let activeChatController = null;
let convo = [
  {
    role: "system",
    content:
      "You are Q, an AI product manager and builder. Speak warmly, naturally, and specifically in first person. Keep each thought short and conversational. You have many years of product experience and now spend most of your time building AI tools. You are currently building Q Studio, an interactive 2.5D personal space combining cinematic images and game interaction. You are interested in Personal Agents, human-agent collaboration, and how AI changes the value created by knowledge workers."
  }
];

const QUICK_CHAT_RESPONSES = {
  intro: [
    "Hey, I’m Q 👋",
    { html: "我做了很多年产品。你可能没听过我的名字，但<strong>大概率用过我的产品</strong>。" },
    "现在大部分时间都在做 AI 工具，也会用自己的生活做各种小实验。",
    { html: "我非常喜欢创造。一个原本不存在的东西慢慢有了形状、可以被人体验，<strong>这件事本身就很迷人</strong>。" }
  ],
  project: [
    { html: "最近投入最多的，就是 <strong>Q Studio</strong>——你现在正在玩的这个空间。" },
    "最开始我想把它做成一个像 3D 游戏一样、可以走进去的个人空间。后来发现，用影像可以更快进入沉浸感，它就慢慢变成了影视画面与游戏交互结合的 2.5D 空间。",
    "我用 Codex 写交互、用 Seedance 做影像，也接触了不少 Agent 和 Infra 产品。",
    { html: "产品经理 × 游戏策划 × 电影导演 × 交互设计 × Builder", tone: "quote" },
    { html: "这个角色 Mix 的体验很爽。这也许就是 AI 时代一个<strong>超级知识工作者</strong>的写照：一个人带着一组 AI，在多个专业角色之间快速移动。" }
  ],
  "product-value": [
    { html: "我曾经是一个很沉迷 <em>DAU</em> 的产品经理。" },
    "创业时做过上百万用户的产品，后来在大厂服务过数十亿用户。",
    { html: "但 AI 模型应用不是这样。<strong>DAU 也许不是衡量它价值最重要的标准。</strong>" },
    { html: "它的价值，更多来自用户使用 Token 创造了什么。可能是一段代码、一个决定、一份工作，也可能是给用户提供的<strong>情绪价值</strong>。" }
  ],
  agent: [
    { html: "<strong>Personal Agent</strong> 是一个让我很感兴趣的 AI 领域。它离用户很近，也会构建出新的人机关系。" },
    "它会出现在陪伴、工作、创作、硬件和软件里，也会面对完全不同的人群和生活场景。",
    { html: "我最近也在持续观察和体验 <em>Bloome、Matrix、Cofounder</em> 这一系列 Agent 产品。" },
    "人总会借用熟悉的东西去理解新事物。Agent 把抽象的智能变成一个可以交付任务、沟通和协作的代理，所以它是一种很自然的 AI 产品形态。",
    { html: "人和 Agent 的协作，会停在“把一个人的效率推到极致”吗？<br>还是会继续放大一群人的生产力？", tone: "quote" }
  ],
  models: [
    "这个问题的答案会一直变化。",
    { html: "最近我又开始用 <strong>Codex</strong>。" },
    { html: "模型主要用 <em>GPT-5.6</em> 和 <em>Grok 4.5</em>。便宜又快，推荐。" }
  ]
};

const CHAT_QUESTIONS = {
  intro: { label: "先认识一下 Q", prompt: "介绍一下你自己" },
  project: { label: "最近在做什么", prompt: "聊聊你最近在做什么" },
  "product-value": { label: "新的产品判断", prompt: "聊聊你最近新的产品判断" },
  agent: { label: "最近关心的方向", prompt: "聊聊你最近关心的方向" },
  models: { label: "常用的 AI 产品", prompt: "推荐一下你常用的 AI 产品和模型" },
  share: { label: "说说我的项目", action: "share" }
};

const CHAT_FOLLOW_UPS = {
  initial: ["intro", "project", "agent"],
  intro: ["project", "agent", "product-value"],
  project: ["agent", "product-value", "models"],
  "product-value": ["agent", "models", "project"],
  agent: ["models", "product-value", "share"],
  models: ["project", "agent", "share"]
};

const CHAT_TOPIC_ORDER = ["intro", "project", "agent", "product-value", "models"];
const visitedChatKeys = new Set();

function renderChatSuggestions(context = "initial") {
  if (!chatSuggestions) return;
  const preferred = CHAT_FOLLOW_UPS[context] || CHAT_FOLLOW_UPS.initial;
  const keys = preferred.filter(key => key === "share" || !visitedChatKeys.has(key));
  for (const key of CHAT_TOPIC_ORDER) {
    if (keys.length >= 3) break;
    if (!visitedChatKeys.has(key) && !keys.includes(key)) keys.push(key);
  }
  if (!keys.length || (keys.length < 3 && visitedChatKeys.size >= CHAT_TOPIC_ORDER.length)) {
    if (!keys.includes("share")) keys.push("share");
  }
  chatSuggestions.replaceChildren(...keys.map(key => {
    const question = CHAT_QUESTIONS[key];
    const button = document.createElement("button");
    button.className = "chat-chip";
    button.type = "button";
    button.textContent = question.label;
    if (question.prompt) button.dataset.prompt = question.prompt;
    if (question.action) button.dataset.action = question.action;
    if (QUICK_CHAT_RESPONSES[key]) button.dataset.chatKey = key;
    return button;
  }));
}

function setChatSuggestionsBusy(busy) {
  chatSuggestions?.classList.toggle("is-busy", Boolean(busy));
  chatSuggestions?.querySelectorAll("button").forEach(button => {
    button.disabled = Boolean(busy);
  });
}

function renderWorkBrowser() {
  if (!browserDetail) return;
  browserDetail.dataset.mode = activeWorkDetailId ? "detail" : "wall";
  browserDetail.scrollTop = 0;

  if (!activeWorkDetailId) {
    browserDetail.innerHTML = `
      <div class="wall">
        ${workWallItems.map(item => `
          <button class="wall-item ${item.size || ""} project-${item.id}" type="button" data-work-id="${item.id}" data-accent="${item.accent || "green"}">
            <span class="tile-meta"><span>${item.order}</span><span>${item.cat || item.tag}</span></span>
            <span class="tile-title">${item.title}</span>
            <span class="tile-copy">${item.subtitle}</span>
            <span class="tile-chips">${item.chips.map(chip => `<span class="chip">${chip}</span>`).join("")}</span>
            ${renderWallPreview(item)}
          </button>
        `).join("")}
      </div>
    `;

    const supportsWallHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    Array.from(browserDetail.querySelectorAll("[data-work-id]")).forEach(button => {
      if (supportsWallHover) {
        button.addEventListener("pointermove", event => {
          const rect = button.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          button.style.setProperty("--mx", `${Math.max(12, Math.min(88, x))}%`);
          button.style.setProperty("--my", `${Math.max(16, Math.min(84, y))}%`);
        });
        button.addEventListener("pointerleave", () => {
          button.style.removeProperty("--mx");
          button.style.removeProperty("--my");
        });
      }
      button.addEventListener("click", async () => {
        activeWorkDetailId = button.dataset.workId;
        renderWorkBrowser();
        await primeAudio();
        AudioSys.click();
      });
    });
    return;
  }

  renderBrowserDetail();
}

function renderBrowserDetail() {
  if (!browserDetail) return;
  const wallItem = workWallItems.find(entry => entry.id === activeWorkDetailId);
  if (!wallItem) {
    activeWorkDetailId = null;
    renderWorkBrowser();
    return;
  }

  if (wallItem.source === "qstudio") {
    browserDetail.innerHTML = renderQStudioDetail();
  } else if (wallItem.source === "workProject") {
    browserDetail.innerHTML = renderWorkProjectDetail();
    bindWorkedProjectList();
  } else if (wallItem.source === "worked") {
    const item = workedOnItems.find(entry => entry.id === wallItem.id) || workedOnItems[0];
    const mediaItems = item.media || [];
    browserDetail.innerHTML = `
      <div class="work-detail-shell">
        <div class="work-detail-topbar">
          <button class="work-back-btn" type="button" id="work-back-btn"><span>←</span>Back To Wall</button>
        </div>
        <div class="selected-detail">
          <div class="detail-top">
            <div class="detail-meta">${wallItem.order}</div>
            <a class="detail-link" href="${item.href}" target="_blank" rel="noopener">Open Link</a>
          </div>
          <h3 class="detail-title">${item.title}</h3>
          <p class="detail-lead">${wallItem.subtitle}</p>
          <div class="detail-chip-row"><span>${item.chip}</span></div>
          <div class="detail-desc">${item.desc}</div>
          <div class="detail-media-grid${mediaItems.length === 1 ? " single" : ""}">
            ${mediaItems.map(media => renderDetailMedia(media)).join("")}
          </div>
        </div>
      </div>
    `;
  } else {
    const item = selectedWorkItems.find(entry => entry.id === wallItem.id) || selectedWorkItems[0];
    if (item.id === "companion" || item.id === "shipu" || item.id === "twin") {
      browserDetail.innerHTML = renderPublishedSelectedDetail(item);
      bindWorkBackButton();
      return;
    }
    const galleryItems = item.gallery || [];
    browserDetail.innerHTML = `
      <div class="work-detail-shell">
        <div class="work-detail-topbar">
          <button class="work-back-btn" type="button" id="work-back-btn"><span>←</span>Back To Wall</button>
        </div>
        <div class="selected-detail">
          <div class="detail-top">
            <div class="detail-meta">${item.order}</div>
            <div class="detail-top-tag">${item.tag}</div>
          </div>
          <h3 class="detail-title">${item.title}</h3>
          <p class="detail-lead">${item.one}</p>
          <div class="detail-desc">${item.desc}</div>
          <div class="detail-chip-row">${item.chips.map(chip => `<span>${chip}</span>`).join("")}</div>
          ${item.url ? `<a class="detail-link detail-link-inline" href="${item.url}" target="_blank" rel="noopener">Open Link</a>` : ""}
          <div class="detail-points">
            ${item.points.map(point => `<div><b>${point[0]}</b><br>${point[1]}</div>`).join("")}
          </div>
          <div class="detail-media-grid${galleryItems.length === 1 ? " single" : ""}">
            ${galleryItems.map(media => renderDetailMedia(media)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  bindWorkBackButton();
}

function renderQStudioDetail() {
  return `
    <div class="work-detail-shell work-detail-shell--qstudio">
      <div class="work-detail-topbar">
        <button class="work-back-btn" type="button" id="work-back-btn"><span>←</span>Back To Wall</button>
      </div>
      <section class="qstudio-detail">
        <a class="published-detail-link" href="${qStudioItem.url}" target="_blank" rel="noopener">Open Project</a>
        <div class="qstudio-detail-head">
          <div>
            <div class="published-detail-meta">${qStudioItem.cat}</div>
            <h3 class="published-detail-title">${qStudioItem.title}</h3>
            <p class="published-detail-one">${qStudioItem.subtitle}</p>
          </div>
          <div class="qstudio-detail-chips">${qStudioItem.chips.map(chip => `<span>${chip}</span>`).join("")}</div>
        </div>
        <div class="published-detail-desc">${qStudioItem.desc}</div>
        <div class="qstudio-gallery">
          ${qStudioItem.gallery.map(media => `
            <figure class="qstudio-gallery-card">
              <img src="${media.src}" alt="${media.alt}" loading="lazy" decoding="async">
              <figcaption>${media.caption}</figcaption>
            </figure>
          `).join("")}
        </div>
        <figure class="qstudio-video-card">
          <video src="${qStudioItem.video.src}" poster="${qStudioItem.video.poster}" controls playsinline preload="metadata" aria-label="${qStudioItem.video.alt}"></video>
          <figcaption>底部视频可以直接点击播放，作为当前互动房间的动态预览。</figcaption>
        </figure>
      </section>
    </div>
  `;
}

function renderWorkProjectDetail() {
  const item = workedOnItems.find(entry => entry.id === activeWorkedId) || workedOnItems[0];
  activeWorkedId = item.id;
  return `
    <div class="work-detail-shell work-detail-shell--worked">
      <div class="work-detail-topbar">
        <button class="work-back-btn" type="button" id="work-back-btn"><span>←</span>Back To Wall</button>
      </div>
      <section class="worked-project-detail">
        <button class="published-detail-link project-status-button" type="button" disabled>未完待补</button>
        <div class="worked-project-cover">
          <img src="./assets/work-project-reference.png" alt="工作项目封面" loading="lazy" decoding="async">
          <div>
            <div class="published-detail-meta">Work project</div>
            <h3>工作中的一些项目</h3>
            <p>一些更偏真实业务、产品系统和工作流的项目记录。</p>
          </div>
        </div>
        <div class="worked-project-layout">
          <aside class="worked-project-list" aria-label="Work project list">
            ${workedOnItems.map(entry => `
              <button class="worked-project-tab ${entry.id === item.id ? "active" : ""}" type="button" data-worked-id="${entry.id}">
                <span class="worked-project-logo"><img src="${entry.icon}" alt=""></span>
                <span>
                  <small>${entry.stamp} · ${entry.meta}</small>
                  <b>${entry.name}</b>
                  <em>${entry.blurb}</em>
                </span>
              </button>
            `).join("")}
          </aside>
          <article class="worked-project-content">
            <div class="worked-project-copy">
              <div class="detail-top">
                <div class="detail-meta">${item.chip}</div>
                <a class="detail-link" href="${item.href}" target="_blank" rel="noopener">Open Link</a>
              </div>
              <h4>${item.title}</h4>
              <p>${item.desc}</p>
              <div class="worked-project-metrics">
                ${item.metrics.map(metric => `<span><b>${metric[0]}</b><small>${metric[1]}</small></span>`).join("")}
              </div>
              <div class="detail-chip-row">${item.res ? `<span>${item.res}</span>` : ""}</div>
            </div>
            <div class="worked-project-media">
              ${(item.media || []).map(media => renderDetailMedia(media)).join("")}
            </div>
          </article>
        </div>
      </section>
    </div>
  `;
}

function bindWorkedProjectList() {
  Array.from(browserDetail.querySelectorAll("[data-worked-id]")).forEach(button => {
    button.addEventListener("click", async () => {
      activeWorkedId = button.dataset.workedId;
      browserDetail.innerHTML = renderWorkProjectDetail();
      bindWorkedProjectList();
      bindWorkBackButton();
      await primeAudio();
      AudioSys.click();
    });
  });
}

function bindWorkBackButton() {
  const backButton = document.getElementById("work-back-btn");
  if (!backButton) return;
  backButton.addEventListener("click", async () => {
    activeWorkDetailId = null;
    renderWorkBrowser();
    await primeAudio();
    AudioSys.click();
  });
}

function renderPublishedSelectedDetail(item) {
  const hero = item.modalHero === false ? null : (item.gallery || []).find(entry => entry.hero) || (item.gallery || []).find(entry => entry.wide) || (item.gallery || [])[0];
  const galleryItems = (item.gallery || []).filter(entry => !entry.hideInGallery);
  return `
    <div class="work-detail-shell work-detail-shell--published">
      <div class="work-detail-topbar">
        <button class="work-back-btn" type="button" id="work-back-btn"><span>←</span>Back To Wall</button>
      </div>
      <section class="published-detail published-detail--${item.id}">
        ${item.url ? `<a class="published-detail-link" href="${item.url}" target="_blank" rel="noopener">Open Project</a>` : ""}
        ${item.statusLabel ? `<button class="published-detail-link project-status-button" type="button" disabled>${item.statusLabel}</button>` : ""}
        ${hero ? `<figure class="published-detail-hero${hero.fit === "contain" ? " contain" : ""}">${renderMediaTag(hero, false)}</figure>` : ""}
        <div class="published-detail-meta">${item.cat || item.order}</div>
        <h3 class="published-detail-title">${item.title}</h3>
        <p class="published-detail-one">${item.one || item.subtitle || ""}</p>
        <div class="published-detail-desc">${item.desc}</div>
        ${item.points?.length ? `
          <div class="published-detail-points">
            ${item.points.map(point => `
              <section class="published-detail-point">
                <h4>${point[0]}</h4>
                <p>${point[1]}</p>
              </section>
            `).join("")}
          </div>
        ` : ""}
        ${item.chips?.length ? `<div class="published-detail-chips">${item.chips.map(chip => `<span>${chip}</span>`).join("")}</div>` : ""}
        ${galleryItems.length ? `
          <div class="published-detail-gallery">
            ${galleryItems.map(media => `
              <figure class="published-gallery-card${media.wide ? " wide" : ""}${media.tall ? " tall" : ""}${media.fit === "contain" ? " contain" : ""}">
                ${renderMediaTag(media, false)}
                <figcaption>${media.caption || media.alt || ""}</figcaption>
              </figure>
            `).join("")}
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function deviceMarkup(frame, src, title, fit, isVideo, poster) {
  const content = isVideo
    ? `<video src="${src}"${poster ? ` poster="${poster}"` : ""}${fit === "contain" ? ' class="contain"' : ""} autoplay muted loop playsinline preload="metadata" aria-label="${title || ""}"></video>`
    : `<img src="${src}" alt="${title || ""}" loading="lazy" decoding="async"${fit === "contain" ? ' class="contain"' : ""}>`;
  return `<span class="device ${frame}">${content}</span>`;
}

function renderWallPreview(item) {
  if (item.previewMode === "shipu") {
    return `<span class="tile-preview multi">
      ${deviceMarkup("phone", "./assets/shipu-library.png", "拾谱 iPhone 谱册")}
      ${deviceMarkup("ipad", "./assets/shipu-ipad-user.png", "拾谱 iPad 练习界面")}
    </span>`;
  }
  if (item.previewMode === "companion") {
    return `<span class="tile-preview overlap-preview">
      ${deviceMarkup("phone", "./assets/companion-app.png", "萌伴 App", "contain")}
      ${deviceMarkup("phone", "./assets/companion-call.png", "AI 陪伴通话", "contain")}
    </span>`;
  }
  if (item.previewMode === "qstudio") {
    return `<span class="tile-preview qstudio-preview">
      <img src="./assets/qstudio-homepage.png" alt="Q Studio 当前网站" loading="lazy" decoding="async">
    </span>`;
  }
  if (item.previewMode === "plain" && item.cover) {
    return `<span class="tile-preview plain-preview"><img src="${item.cover}" alt="${item.title}" loading="lazy" decoding="async"></span>`;
  }
  return '<span class="direct-mark">↗</span>';
}

function renderMediaTag(media, withCaption) {
  if (media.type === "video") {
    return `
      <video src="${media.src}"${media.poster ? ` poster="${media.poster}"` : ""}${media.fit === "contain" ? ' class="contain"' : ""} muted autoplay loop playsinline preload="auto" aria-label="${media.alt || ""}"></video>
      ${withCaption ? `<p>${media.caption || media.alt || ""}</p>` : ""}
    `;
  }
  return `
    <img src="${media.src}" alt="${media.alt || ""}"${media.fit === "contain" ? ' class="contain"' : ""}>
    ${withCaption ? `<p>${media.caption || media.alt || ""}</p>` : ""}
  `;
}

function renderDetailMedia(media) {
  return `
    <figure class="detail-media-card${media.wide ? " wide" : ""}${media.tall ? " tall" : ""}${media.fit === "contain" ? " contain" : ""}">
      ${renderMediaTag(media, true)}
    </figure>
  `;
}

function syncQBubbleEdges() {
  if (!qStageBubble) return;
  const maxScroll = Math.max(0, qStageBubble.scrollHeight - qStageBubble.clientHeight);
  qStageBubble.classList.toggle("has-clipped-top", qStageBubble.scrollTop > 3);
  qStageBubble.classList.toggle("has-clipped-bottom", qStageBubble.scrollTop < maxScroll - 3);
}

function fitMobileQMessages() {
  if (!qStageBubble || !qStageText || !window.matchMedia("(max-width: 680px)").matches) return;
  let messages = Array.from(qStageText.querySelectorAll(".q-stage-message:not(.is-typing)"));
  while (qStageBubble.scrollHeight > qStageBubble.clientHeight + 2 && messages.length > 3) {
    messages.shift()?.remove();
  }
}

function scrollQMessagesToBottom() {
  if (!qStageBubble) return;
  window.requestAnimationFrame(() => {
    fitMobileQMessages();
    qStageBubble.scrollTop = window.matchMedia("(max-width: 680px)").matches ? 0 : qStageBubble.scrollHeight;
    syncQBubbleEdges();
  });
}

qStageBubble?.addEventListener("scroll", syncQBubbleEdges, { passive: true });

function removeQTypingBubble() {
  qStageText?.querySelector(".q-stage-message.is-typing")?.remove();
}

function trimQMessages() {
  if (!qStageText) return;
  const messages = Array.from(qStageText.querySelectorAll(".q-stage-message:not(.is-typing)"));
  while (messages.length > 8) messages.shift()?.remove();
}

function getQBubblePlainText(content) {
  if (typeof content === "string") return content;
  if (!content) return "";
  if (content.text) return content.text;
  return String(content.html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function appendQSpeechBubble(content) {
  if (!qStageText || !content) return null;
  removeQTypingBubble();
  const bubble = document.createElement("div");
  bubble.className = "q-stage-message";
  if (typeof content === "object" && content.html) {
    bubble.innerHTML = content.html;
    if (content.tone === "quote") bubble.classList.add("is-quote");
  } else {
    bubble.textContent = getQBubblePlainText(content);
  }
  qStageText.appendChild(bubble);
  trimQMessages();
  setChatBubbleVisible(true);
  scrollQMessagesToBottom();
  return bubble;
}

function showQTypingBubble() {
  if (!qStageText) return;
  removeQTypingBubble();
  const bubble = document.createElement("div");
  bubble.className = "q-stage-message is-typing";
  bubble.setAttribute("aria-label", "Q is typing");
  for (let i = 0; i < 3; i += 1) bubble.appendChild(document.createElement("i"));
  qStageText.appendChild(bubble);
  setChatBubbleVisible(true);
  scrollQMessagesToBottom();
}

function setQSpeech(text, typing) {
  if (!qStageText) return;
  if (!text && !typing) {
    qStageText.replaceChildren();
    return;
  }
  if (typing) {
    showQTypingBubble();
    return;
  }
  appendQSpeechBubble(text);
}

function splitChatAnswer(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^。！？!?]+[。！？!?]?/g) || [clean];
  const bubbles = [];
  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;
    const previous = bubbles[bubbles.length - 1];
    if (previous && previous.length + part.length < 58) bubbles[bubbles.length - 1] += part;
    else bubbles.push(part);
  }
  return bubbles.slice(0, 6);
}

function isChatRunActive(runId) {
  return runId === chatRunId && scenes.chat.classList.contains("active");
}

async function revealQSpeechBubbles(parts, runId) {
  if (!isChatRunActive(runId)) return false;
  removeQTypingBubble();
  const bubbles = parts.filter(Boolean);
  for (let index = 0; index < bubbles.length; index += 1) {
    if (!isChatRunActive(runId)) return false;
    appendQSpeechBubble(bubbles[index]);
    if (index < bubbles.length - 1) {
      const bubbleLength = getQBubblePlainText(bubbles[index]).length;
      await new Promise(resolve => window.setTimeout(resolve, Math.min(1050, 420 + bubbleLength * 13)));
      if (!isChatRunActive(runId)) return false;
      showQTypingBubble();
      await new Promise(resolve => window.setTimeout(resolve, 260));
      if (!isChatRunActive(runId)) return false;
      removeQTypingBubble();
    }
  }
  return true;
}

function setChatBubbleVisible(visible) {
  qStageBubble?.classList.toggle("is-visible", Boolean(visible));
  if (!visible) {
    qStageBubble?.classList.remove("has-clipped-top", "has-clipped-bottom");
  }
}

function resetVisibleChatTurn() {
  qStageText?.replaceChildren();
  if (qStageBubble) qStageBubble.scrollTop = 0;
  setChatBubbleVisible(false);
}

function resetSceneVideo(video) {
  if (!video) return;
  video.pause();
  try {
    video.currentTime = 0.001;
  } catch (error) {
    void error;
  }
}

function setCoffeeMenuStep(step = "root") {
  const nextStep = ["pour", "espresso"].includes(step) ? step : "root";
  if (coffeeMenuRoot) coffeeMenuRoot.hidden = nextStep !== "root";
  if (coffeeMenuPour) coffeeMenuPour.hidden = nextStep !== "pour";
  if (coffeeMenuEspresso) coffeeMenuEspresso.hidden = nextStep !== "espresso";
  if (coffeeMenuBack) coffeeMenuBack.hidden = nextStep === "root";
  if (coffeeMenuTitle) {
    coffeeMenuTitle.textContent = nextStep === "pour"
      ? "Choose your beans"
      : nextStep === "espresso"
        ? "Choose a drink"
        : "Choose a menu";
  }
}

function showCoffeeToast(title, detail) {
  if (!coffeeToast) return;
  const titleNode = coffeeToast.querySelector("strong");
  const detailNode = coffeeToast.querySelector("span");
  if (titleNode) titleNode.textContent = title;
  if (detailNode) detailNode.textContent = detail;
  window.clearTimeout(coffeeToastTimer);
  coffeeToast.classList.add("is-visible");
  coffeeToastTimer = window.setTimeout(() => coffeeToast.classList.remove("is-visible"), 2800);
}

function syncCoffeeVideoAudio() {
  const coffeeActive = Boolean(scenes.coffee?.classList.contains("active"));
  const keepMutedForTouch = window.matchMedia("(pointer: coarse), (max-width: 680px)").matches;
  Object.entries(coffeeVideos).forEach(([key, video]) => {
    if (!video) return;
    video.volume = 0.3;
    video.muted = AudioSys.muted || keepMutedForTouch || !coffeeActive || key !== activeCoffeeVideoKey;
  });
}

function clearCoffeeCompletionTimer() {
  window.clearTimeout(coffeeCompletionTimer);
  coffeeCompletionTimer = 0;
}

function scheduleCoffeeCompletion(videoKey, runId) {
  const video = coffeeVideos[videoKey];
  if (!video) return;
  clearCoffeeCompletionTimer();
  const remaining = Number.isFinite(video.duration) && video.duration > 0
    ? Math.max(800, (video.duration - video.currentTime) * 1000 + 420)
    : 6200;
  coffeeCompletionTimer = window.setTimeout(() => {
    if (runId !== coffeeRunId || activeCoffeeVideoKey !== videoKey) return;
    holdCoffeeFinalFrame(videoKey);
  }, remaining);
}

function resetCoffeeExperience() {
  coffeeRunId += 1;
  clearCoffeeCompletionTimer();
  scenes.coffee?.classList.remove("coffee-playing", "coffee-complete");
  activeCoffeeVideoKey = "";
  activeCoffeeLabel = "";
  Object.values(coffeeVideos).forEach(video => {
    if (!video) return;
    resetSceneVideo(video);
    video.classList.remove("is-active");
    video.muted = true;
  });
  coffeeMenuCard?.classList.remove("is-minimized");
  coffeeOrderBadge?.classList.remove("is-visible");
  coffeeToast?.classList.remove("is-visible");
  if (coffeeResultControls) coffeeResultControls.hidden = true;
  setCoffeeMenuStep("root");
}

function syncCoffeeSceneMedia(activeScene) {
  if (activeScene !== "coffee") {
    Object.values(coffeeVideos).forEach(video => video?.pause());
    return;
  }
  syncCoffeeVideoAudio();
}

async function playCoffeeVideo(videoKey, label) {
  if (!coffeeVideos[videoKey]) return;
  const runId = ++coffeeRunId;
  clearCoffeeCompletionTimer();
  AudioSys.ensureStarted().catch(() => {});
  activeCoffeeVideoKey = "";
  const nextLabel = label || (videoKey === "pourover" ? "Pour Over" : "Iced Americano");
  scenes.coffee?.classList.remove("coffee-playing", "coffee-complete");
  const nextVideo = replaceCoffeeVideo(videoKey);
  if (!nextVideo) return;

  Object.entries(coffeeVideos).forEach(([key, video]) => {
    if (!video) return;
    video.pause();
    video.classList.toggle("is-active", key === videoKey);
    if (key !== videoKey) resetSceneVideo(video);
  });

  coffeeMenuCard?.classList.add("is-minimized");
  coffeeOrderBadge?.classList.add("is-visible");
  if (coffeeOrderBadge) coffeeOrderBadge.textContent = `Brewing · ${nextLabel}`;
  if (coffeeResultControls) coffeeResultControls.hidden = true;
  nextVideo.muted = true;
  activeCoffeeVideoKey = videoKey;
  activeCoffeeLabel = nextLabel;

  try {
    await nextVideo.play();
    syncCoffeeVideoAudio();
    scheduleCoffeeCompletion(videoKey, runId);
  } catch (error) {
    void error;
    nextVideo.muted = true;
    try {
      await nextVideo.play();
      syncCoffeeVideoAudio();
      scheduleCoffeeCompletion(videoKey, runId);
    } catch (mutedError) {
      void mutedError;
      activeCoffeeVideoKey = "";
      coffeeMenuCard?.classList.remove("is-minimized");
      showCoffeeToast("Tap to start the brew.", "Your browser paused autoplay.");
    }
  }
}

function holdCoffeeFinalFrame(videoKey) {
  const video = coffeeVideos[videoKey];
  if (!video || activeCoffeeVideoKey !== videoKey) return;
  if (scenes.coffee?.classList.contains("coffee-complete")) return;
  clearCoffeeCompletionTimer();
  video.pause();
  if (Number.isFinite(video.duration)) {
    try {
      video.currentTime = Math.max(0, video.duration - 0.045);
    } catch (error) {
      void error;
    }
  }
  if (coffeeOrderBadge) coffeeOrderBadge.textContent = `Ready · ${activeCoffeeLabel}`;
  if (coffeeResultControls) coffeeResultControls.hidden = false;
  scenes.coffee?.classList.add("coffee-complete");
}

function bindCoffeeVideoEvents(key, video) {
  if (!video) return;
  video?.addEventListener("ended", () => holdCoffeeFinalFrame(key));
  video?.addEventListener("timeupdate", () => {
    if (activeCoffeeVideoKey !== key || !Number.isFinite(video.duration) || video.currentTime < .5) return;
    if (video.duration - video.currentTime <= .16) holdCoffeeFinalFrame(key);
  });
  video?.addEventListener("playing", () => {
    if (activeCoffeeVideoKey === key) {
      revealVideoFrame(video, () => scenes.coffee?.classList.add("coffee-playing"));
    }
    syncCoffeeVideoAudio();
  });
  video?.addEventListener("error", () => {
    if (activeCoffeeVideoKey === key) scenes.coffee?.classList.remove("coffee-playing");
  });
  video?.addEventListener("emptied", () => {
    if (activeCoffeeVideoKey === key) scenes.coffee?.classList.remove("coffee-playing");
  });
  ["loadeddata", "playing", "volumechange", "pause"].forEach(eventName => {
    video.addEventListener(eventName, () => AudioSys.publishState());
  });
}

function replaceCoffeeVideo(videoKey) {
  const currentVideo = coffeeVideos[videoKey];
  if (!currentVideo) return null;
  currentVideo.pause();
  const freshVideo = currentVideo.cloneNode(true);
  freshVideo.classList.remove("is-active", "frame-ready");
  freshVideo.muted = true;
  currentVideo.replaceWith(freshVideo);
  coffeeVideos[videoKey] = freshVideo;
  bindCoffeeVideoEvents(videoKey, freshVideo);
  freshVideo.load();
  return freshVideo;
}

Object.entries(coffeeVideos).forEach(([key, video]) => bindCoffeeVideoEvents(key, video));

function setChatVisualState(nextState, { reset = true } = {}) {
  const nextVideo = chatStateVideos[nextState];
  if (!nextVideo) return;
  chatVisualState = nextState;
  const chatActive = scenes.chat.classList.contains("active");
  setSceneFallbackReady(scenes.chat, nextVideo);

  Object.entries(chatStateVideos).forEach(([state, video]) => {
    if (!video) return;
    const selected = state === nextState;
    const wasSelected = video.classList.contains("is-active");
    video.classList.toggle("is-active", selected);
    video.muted = true;
    if (!selected || !chatActive) {
      video.pause();
      if (wasSelected && chatActive) {
        window.setTimeout(() => {
          if (!video.classList.contains("is-active")) resetSceneVideo(video);
        }, 380);
      } else {
        resetSceneVideo(video);
      }
      return;
    }
    if (reset) resetSceneVideo(video);
    video.play().catch(() => {});
  });
}

function startChatRest(preferredState = "waiting") {
  const state = preferredState === "relaxed" ? "relaxed" : "waiting";
  setChatVisualState(state, { reset: true });
}

function setChatAnswering(nextAnswering) {
  chatAnswering = Boolean(nextAnswering);
  if (chatAnswering) {
    setChatVisualState("talk", { reset: true });
    return;
  }
  if (chatBusy) {
    setChatVisualState("waiting", { reset: true });
    return;
  }
  startChatRest("waiting");
}

function handleChatIdleEnded(state) {
  if (!scenes.chat.classList.contains("active") || chatBusy || chatAnswering || chatVisualState !== state) return;
  startChatRest("waiting");
}

chatRelaxedVideo?.addEventListener("ended", () => handleChatIdleEnded("relaxed"));

function resetChatInteraction({ clearTurn = true } = {}) {
  chatRunId += 1;
  activeChatController?.abort();
  activeChatController = null;
  chatBusy = false;
  chatAnswering = false;
  setChatSuggestionsBusy(false);
  if (chatSendButton) chatSendButton.disabled = false;
  removeQTypingBubble();
  if (clearTurn) resetVisibleChatTurn();
}

async function sendChatMessage(prefill, scriptedKey = "") {
  const text = (prefill || chatInput.value).trim();
  if (!text || chatBusy) return;
  const runId = ++chatRunId;
  const controller = new AbortController();
  activeChatController = controller;
  resetVisibleChatTurn();
  setChatBubbleVisible(true);
  chatBusy = true;
  chatAnswering = false;
  setChatSuggestionsBusy(true);
  chatInput.value = "";
  const showUserEcho = !scriptedKey;
  meEcho.hidden = !showUserEcho;
  if (showUserEcho) meEcho.textContent = text;
  setQSpeech("让我想一下…", true);
  setChatVisualState("waiting", { reset: true });
  AudioSys.click();
  AudioSys.shimmer(820, 0.018);
  if (chatSendButton) chatSendButton.disabled = true;
  let answerStartedAt = 0;

  try {
    const scriptedBubbles = QUICK_CHAT_RESPONSES[scriptedKey];
    if (scriptedBubbles) {
      await new Promise(resolve => window.setTimeout(resolve, 520));
      if (!isChatRunActive(runId)) return;
      answerStartedAt = Date.now();
      setChatAnswering(true);
      const revealed = await revealQSpeechBubbles(scriptedBubbles, runId);
      if (!revealed) return;
      convo.push({ role: "user", content: text });
      convo.push({ role: "assistant", content: scriptedBubbles.map(getQBubblePlainText).join(" ") });
      return;
    }

    const resp = await fetch(WORKER + "/qroom-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...convo, { role: "user", content: text }] }),
      signal: controller.signal
    });
    if (!isChatRunActive(runId)) return;
    if (!resp.ok || !resp.body) throw new Error("chat unavailable");
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";
    let receivedAnswer = false;

    while (true) {
      const part = await reader.read();
      if (!isChatRunActive(runId)) return;
      if (part.done) break;
      buf += decoder.decode(part.value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const choice = json && json.choices && json.choices[0];
          const delta = choice && choice.delta && choice.delta.content;
          if (!delta) continue;
          if (!receivedAnswer) {
            receivedAnswer = true;
            answerStartedAt = Date.now();
            setChatAnswering(true);
          }
          acc += delta;
        } catch (error) {
          void error;
        }
      }
    }

    if (!acc) {
      acc = "I didn't catch that cleanly. Ask me again, or we can come at it from another angle.";
    }
    if (!receivedAnswer) {
      answerStartedAt = Date.now();
      setChatAnswering(true);
    }
    const revealed = await revealQSpeechBubbles(splitChatAnswer(acc), runId);
    if (!revealed) return;
    convo.push({ role: "user", content: text });
    convo.push({ role: "assistant", content: acc });
  } catch (error) {
    if (error?.name === "AbortError" || !isChatRunActive(runId)) return;
    removeQTypingBubble();
    appendQSpeechBubble("刚才连接走神了一下，可以再问我一次。");
  } finally {
    if (runId !== chatRunId) return;
    if (answerStartedAt) {
      const remainingTalkTime = Math.max(0, 1400 - (Date.now() - answerStartedAt));
      if (remainingTalkTime) await new Promise(resolve => window.setTimeout(resolve, remainingTalkTime));
    }
    if (runId !== chatRunId) return;
    activeChatController = null;
    chatBusy = false;
    chatAnswering = false;
    renderChatSuggestions(scriptedKey || "initial");
    setChatSuggestionsBusy(false);
    if (chatSendButton) chatSendButton.disabled = false;
    if (scenes.chat.classList.contains("active")) startChatRest("waiting");
  }
}

window.sendChatMessage = sendChatMessage;

// This version explicitly preserves the three independent tracks: UI click,
// active video audio, and background music. Reset stale mute preferences once
// when upgrading from the older audio implementation.
const AUDIO_MIX_VERSION = "three-track-v1";
const BGM_VOLUME = 0.1;
const UI_CLICK_VOLUME = 0.28;
const UI_CLICK_MAX_VOLUME = 0.38;
if (localStorage.getItem("qroom-audio-mix-version") !== AUDIO_MIX_VERSION) {
  localStorage.setItem("qroom-muted", "0");
  localStorage.setItem("qroom-audio-mix-version", AUDIO_MIX_VERSION);
}

const AudioSys = {
  ctx: null,
  muted: localStorage.getItem("qroom-muted") === "1",
  master: null,
  effectsBus: null,
  keyboardTimer: null,
  roomTimer: null,
  soundChoiceMade: localStorage.getItem("qroom-muted") !== null,
  lastClickAt: 0,
  armMediaTracks() {
    if (this.muted) return;
    this.startBackgroundMusic();
    syncDoorVideoAudio();
    syncRoomVideoAudio();
    syncDeskVideoAudio();
    syncCoffeeVideoAudio();
  },
  async ensureStarted() {
    // Arm HTML media while the pointer gesture is still active. Waiting for
    // AudioContext.resume() first can move playback outside the gesture window.
    this.armMediaTracks();
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.effectsBus = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0.0001 : 0.68;
      this.effectsBus.gain.value = 0.82;
      this.effectsBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.ctx.addEventListener("statechange", () => this.publishState());
    }
    if (this.ctx.state === "suspended") {
      // Resume inside the user gesture, then briefly wait so the first click
      // is not scheduled against a suspended audio context.
      const resumed = this.ctx.resume().catch(() => {});
      await Promise.race([
        resumed,
        new Promise(resolve => window.setTimeout(resolve, 180)),
      ]);
    }
    this.armMediaTracks();
    this.publishState();
  },
  startBackgroundMusic() {
    if (!backgroundMusic || this.muted) return;
    backgroundMusic.volume = BGM_VOLUME;
    backgroundMusic.muted = false;
    document.body.dataset.audioBackgroundAttempt = String(Date.now());
    backgroundMusic.play().then(() => this.publishState()).catch(() => this.publishState());
  },
  pauseBackgroundMusic() {
    if (!backgroundMusic) return;
    backgroundMusic.muted = true;
    backgroundMusic.pause();
    this.publishState();
  },
  setMuted(nextMuted) {
    this.muted = nextMuted;
    localStorage.setItem("qroom-muted", this.muted ? "1" : "0");
    soundToggle.innerHTML = `<strong>${this.muted ? "Sound Off" : "Sound On"}</strong>`;
    if (!this.ctx) {
      if (this.muted) this.pauseBackgroundMusic();
      else this.startBackgroundMusic();
      syncDoorVideoAudio();
      syncRoomVideoAudio();
      syncDeskVideoAudio();
      syncCoffeeVideoAudio();
      this.publishState();
      return;
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0.0001 : 0.68, now + 0.18);
    if (this.muted) {
      this.stopKeyboard();
      this.stopRoomDetails();
      this.pauseBackgroundMusic();
    } else {
      this.shimmer(720, 0.036);
      this.startBackgroundMusic();
      this.syncSceneAudio();
    }
    syncDoorVideoAudio();
    syncRoomVideoAudio();
    syncDeskVideoAudio();
    syncCoffeeVideoAudio();
    this.publishState();
  },
  publishState() {
    const musicPlaying = Boolean(backgroundMusic && !backgroundMusic.paused && !backgroundMusic.muted);
    const videoTracks = [
      ["door", doorOpenVideo],
      ["room", roomLoopVideo],
      ["desk", deskLoopVideo],
      ["coffee-pourover", coffeeVideos.pourover],
      ["coffee-americano", coffeeVideos.americano],
    ].filter(([, video]) => video && !video.paused && !video.muted).map(([name]) => name);
    document.body.dataset.audioMix = "click-video-music";
    document.body.dataset.audioMuted = String(this.muted);
    document.body.dataset.audioClick = uiClickAudio?.error ? "error" : uiClickAudio?.readyState >= 2 ? "ready" : "loading";
    document.body.dataset.audioVideo = videoTracks.join(",") || "stopped";
    document.body.dataset.audioBackground = musicPlaying ? "playing-cafe-music" : "stopped";
    document.body.dataset.audioBackgroundVolume = backgroundMusic ? String(backgroundMusic.volume) : "0";
    document.body.dataset.audioBuses = this.effectsBus ? "ready" : "pending";
    document.body.dataset.audioContext = this.ctx?.state || "not-created";
  },
  tone(freq, dur, vol, type) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.effectsBus || this.master);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  },
  noise(dur, vol, from, to) {
    if (!this.ctx || this.muted) return;
    const buffer = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    filter.type = "bandpass";
    filter.Q.value = 0.72;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.effectsBus || this.master);
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, to), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.start(now);
    src.stop(now + dur);
  },
  click(scale = 1, force = false) {
    if (this.muted) return false;
    const now = Date.now();
    // A real pointer press is forced so rapid clicks never get swallowed.
    // Follow-up calls from that same control are still deduplicated.
    if (!force && now - this.lastClickAt < 420) return false;
    this.lastClickAt = now;
    const playSynthFallback = () => {
      if (this.ctx?.state !== "running") return false;
      this.noise(0.045, 0.044 * scale, 4600, 1500);
      this.tone(620, 0.06, 0.048 * scale, "triangle");
      setTimeout(() => this.tone(1080, 0.07, 0.026 * scale, "sine"), 28);
      return true;
    };
    if (uiClickAudio) {
      uiClickAudio.pause();
      uiClickAudio.currentTime = 0;
      const clickVolume = Math.min(UI_CLICK_MAX_VOLUME, UI_CLICK_VOLUME * scale);
      uiClickAudio.volume = clickVolume;
      document.body.dataset.audioClickVolume = String(clickVolume);
      const started = uiClickAudio.play();
      if (started) {
        started.catch(() => {
          document.body.dataset.uiClickFallback = String(Date.now());
          playSynthFallback();
        });
      } else {
        playSynthFallback();
      }
      document.body.dataset.uiClickPlayed = String(now);
      return true;
    }
    return playSynthFallback();
  },
  door(scale = 1) {
    this.noise(0.18, 0.028 * scale, 420, 90);
    setTimeout(() => this.tone(118, 0.22, 0.052 * scale, "triangle"), 36);
  },
  transition(delay = 76) {
    window.setTimeout(() => {
      this.noise(0.12, 0.032, 1500, 280);
      setTimeout(() => this.tone(260, 0.11, 0.034, "triangle"), 42);
    }, delay);
  },
  shimmer(base, vol) {
    const shimmerBase = base || 760;
    const shimmerVol = vol || 0.024;
    this.tone(shimmerBase, 0.12, shimmerVol, "triangle");
    setTimeout(() => this.tone(shimmerBase * 1.28, 0.1, shimmerVol * 0.7, "sine"), 68);
    setTimeout(() => this.tone(shimmerBase * 1.58, 0.08, shimmerVol * 0.48, "triangle"), 132);
  },
  keyboard() {
    this.tone(1800 + Math.random() * 420, 0.024, 0.0072, "square");
    this.tone(300 + Math.random() * 40, 0.018, 0.0036, "triangle");
  },
  startKeyboard() {
    if (this.keyboardTimer || this.muted) return;
    const loop = () => {
      if (this.muted || !scenes.desk.classList.contains("active") || workPanel.classList.contains("open")) {
        this.keyboardTimer = null;
        return;
      }
      this.keyboard();
      this.keyboardTimer = setTimeout(loop, 820 + Math.random() * 1100);
    };
    loop();
  },
  stopKeyboard() {
    clearTimeout(this.keyboardTimer);
    this.keyboardTimer = null;
  },
  roomDetail() {
    this.noise(0.08, 0.01, 960, 260);
    setTimeout(() => this.tone(410, 0.055, 0.0052, "triangle"), 70);
  },
  startRoomDetails() {
    if (this.roomTimer || this.muted) return;
    const loop = () => {
      if (this.muted || !scenes.room.classList.contains("active")) {
        this.roomTimer = null;
        return;
      }
      this.roomDetail();
      this.roomTimer = setTimeout(loop, 2600 + Math.random() * 2200);
    };
    loop();
  },
  stopRoomDetails() {
    clearTimeout(this.roomTimer);
    this.roomTimer = null;
  },
  syncSceneAudio() {
    this.stopKeyboard();
    this.stopRoomDetails();
    syncDoorVideoAudio();
    syncRoomVideoAudio();
    syncDeskVideoAudio();
    syncCoffeeVideoAudio();
    if (this.muted) return;
    this.startBackgroundMusic();
    if (scenes.desk.classList.contains("active")) this.startKeyboard();
    if (scenes.chat.classList.contains("active") || scenes.contact.classList.contains("active")) {
      this.shimmer(620, 0.025);
    }
  }
};

function applyMusicTrack(trackId, options = {}) {
  if (!backgroundMusic) return;
  const preset = MUSIC_TRACKS[trackId];
  const src = options.src || preset?.src;
  const label = options.label || preset?.label || "My Music";
  if (!src) return;
  if (trackId !== "custom" && customMusicUrl) {
    URL.revokeObjectURL(customMusicUrl);
    customMusicUrl = "";
  }
  backgroundMusic.pause();
  backgroundMusic.src = src;
  backgroundMusic.load();
  backgroundMusic.volume = BGM_VOLUME;
  syncMusicControls(trackId, label);
  document.body.dataset.audioMusicTrack = trackId;
  if (options.persist !== false && preset) {
    try { localStorage.setItem("qroom-music-track", trackId); } catch (error) { void error; }
  }
  if (options.play !== false && !AudioSys.muted) AudioSys.startBackgroundMusic();
}

let savedMusicId = "serene";
try {
  const storedMusicId = localStorage.getItem("qroom-music-track");
  if (storedMusicId && MUSIC_TRACKS[storedMusicId]) savedMusicId = storedMusicId;
} catch (error) {
  void error;
}
applyMusicTrack(savedMusicId, { persist: false, play: false });

backgroundMusic?.addEventListener("play", () => AudioSys.publishState());
backgroundMusic?.addEventListener("pause", () => AudioSys.publishState());
backgroundMusic?.addEventListener("error", () => AudioSys.publishState());
uiClickAudio?.addEventListener("playing", () => AudioSys.publishState());
uiClickAudio?.addEventListener("error", () => AudioSys.publishState());
[backgroundMusic, uiClickAudio].forEach(audio => {
  audio?.addEventListener("loadeddata", () => AudioSys.publishState());
  audio?.addEventListener("canplay", () => AudioSys.publishState());
});
[doorOpenVideo, roomLoopVideo, deskLoopVideo, coffeePourVideo, coffeeAmericanoVideo].forEach(video => {
  video?.addEventListener("loadeddata", () => AudioSys.publishState());
  video?.addEventListener("playing", () => AudioSys.publishState());
  video?.addEventListener("volumechange", () => AudioSys.publishState());
  video?.addEventListener("pause", () => AudioSys.publishState());
});

soundToggle.innerHTML = `<strong>${AudioSys.muted ? "Sound Off" : "Sound On"}</strong>`;
AudioSys.publishState();

document.addEventListener("pointerdown", event => {
  if (event.pointerType === "touch") return;
  if (!AudioSys.muted) AudioSys.ensureStarted().catch(() => {});
}, { capture: true });

function setProgress(stepIndex) {
  progressLabels.forEach((el, i) => el?.classList.toggle("active", i === stepIndex));
}

function activate(name) {
  if (name !== "chat" && scenes.chat.classList.contains("active")) {
    resetChatInteraction();
  }
  document.body.dataset.scene = name;
  Object.entries(scenes).forEach(([key, scene]) => {
    scene.classList.toggle("active", key === name);
  });
  setProgress(sceneProgress[name] ?? 0);
  syncDoorSceneMedia(name);
  syncLoopSceneMedia(name);
  syncChatSceneMedia(name);
  syncCoffeeSceneMedia(name);
  AudioSys.syncSceneAudio();
}

function syncDoorSceneMedia(activeScene) {
  if (!doorIdleVideo || !doorOpenVideo) return;
  if (activeScene === "door") {
    scenes.door.classList.remove("opening", "opening-frame-ready");
    doorOpenVideo.pause();
    try {
      doorOpenVideo.currentTime = 0;
    } catch (error) {
      void error;
    }
    doorIdleVideo.play().catch(() => {});
    syncDoorVideoAudio();
    return;
  }
  doorIdleVideo.pause();
  doorOpenVideo.muted = true;
}

function syncDoorVideoAudio() {
  if (!doorIdleVideo || !doorOpenVideo) return;
  doorIdleVideo.muted = true;
  doorOpenVideo.volume = 0.58;
  // The synthesized door sound carries the feedback. Keeping the transition
  // video muted prevents mobile WebViews from rejecting playback after the
  // asynchronous opening sequence starts.
  doorOpenVideo.muted = true;
}

function syncLoopSceneMedia(activeScene) {
  Object.entries(sceneLoopVideos).forEach(([key, video]) => {
    if (!video) return;
    if (key === activeScene) {
      // Start the selected loop through its audio synchronizer. It begins
      // muted and is unmuted only after playback succeeds.
      video.muted = true;
      return;
    }
    resetSceneVideo(video);
  });
}

function syncChatSceneMedia(activeScene) {
  if (activeScene !== "chat") {
    Object.values(chatStateVideos).forEach(resetSceneVideo);
    return;
  }
  if (chatAnswering) {
    setChatVisualState("talk", { reset: true });
    return;
  }
  if (chatBusy) {
    setChatVisualState("waiting", { reset: true });
    return;
  }
  startChatRest(chatVisualState === "relaxed" ? "relaxed" : "waiting");
}

function syncRoomVideoAudio() {
  if (!roomLoopVideo) return;
  const sceneActive = scenes.room.classList.contains("active");
  roomLoopVideo.volume = 0.24;
  if (!sceneActive) {
    roomLoopVideo.muted = true;
    return;
  }
  const keepMutedForTouch = window.matchMedia("(pointer: coarse), (max-width: 680px)").matches;
  if (!roomLoopVideo.paused) {
    roomLoopVideo.muted = AudioSys.muted || keepMutedForTouch;
    return;
  }
  roomLoopVideo.muted = true;
  const started = roomLoopVideo.play();
  if (started) {
    started.then(() => {
      roomLoopVideo.muted = AudioSys.muted || keepMutedForTouch || !scenes.room.classList.contains("active");
    }).catch(() => {
      roomLoopVideo.muted = true;
      roomLoopVideo.play().catch(() => {});
    });
  }
}

function syncDeskVideoAudio() {
  if (!deskLoopVideo) return;
  const sceneActive = scenes.desk.classList.contains("active");
  deskLoopVideo.volume = 0.24;
  if (!sceneActive) {
    deskLoopVideo.muted = true;
    resetSceneVideo(deskLoopVideo);
    return;
  }
  const keepMutedForTouch = window.matchMedia("(pointer: coarse), (max-width: 680px)").matches;
  if (!deskLoopVideo.paused) {
    deskLoopVideo.muted = AudioSys.muted || keepMutedForTouch;
    return;
  }
  deskLoopVideo.muted = true;
  const started = deskLoopVideo.play();
  if (started) {
    started.then(() => {
      deskLoopVideo.muted = AudioSys.muted || keepMutedForTouch || !scenes.desk.classList.contains("active");
    }).catch(() => {
      deskLoopVideo.muted = true;
      deskLoopVideo.play().catch(() => {});
    });
  }
}

roomLoopVideo?.addEventListener("playing", syncRoomVideoAudio);
deskLoopVideo?.addEventListener("playing", syncDeskVideoAudio);
doorOpenVideo?.addEventListener("playing", syncDoorVideoAudio);

let contactReturnScene = "desk";
let messageLoadId = 0;

function syncLayerChrome() {
  const layerOpen = Boolean(workPanel?.classList.contains("open") || messageModal?.classList.contains("open"));
  document.body.classList.toggle("ui-layer-open", layerOpen);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getMessageOwnerToken() {
  try {
    const stored = localStorage.getItem("qroom-message-owner");
    if (stored) return stored;
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    localStorage.setItem("qroom-message-owner", token);
    return token;
  } catch (error) {
    void error;
    return "";
  }
}

function formatMessageDate(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function messageTilt(id) {
  const value = Array.from(String(id || "")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ((value % 7) - 3) * 0.18;
}

function messageDoodle(id) {
  const value = Array.from(String(id || "q")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const doodles = [
    `<svg viewBox="0 0 40 40"><path d="M20 5l3.8 10.5L35 16l-8.8 6.8L29 34l-9-6.2-9 6.2 2.8-11.2L5 16l11.2-.5L20 5z"/></svg>`,
    `<svg viewBox="0 0 40 40"><path d="M7 24c5-13 10 12 15-1s9 8 12-3"/><path d="M8 31c7 2 17 1 25-3"/></svg>`,
    `<svg viewBox="0 0 40 40"><path d="M20 33S7 25 7 15c0-7 9-9 13-2 4-7 13-5 13 2 0 10-13 18-13 18z"/></svg>`,
    `<svg viewBox="0 0 40 40"><path d="M20 4v8M20 28v8M4 20h8M28 20h8M9 9l6 6M25 25l6 6M31 9l-6 6M15 25l-6 6"/><circle cx="20" cy="20" r="4"/></svg>`
  ];
  const tilt = ((value % 9) - 4) * 3;
  return `<span class="message-doodle" style="--doodle-tilt:${tilt}deg" aria-hidden="true">${doodles[value % doodles.length]}</span>`;
}

const messageSketch = {
  paths: [],
  drawing: false,
  activePath: null,
  ctx: null
};

function normalizeSketchPoint(point) {
  return [
    Math.max(0, Math.min(1000, Math.round(Number(point?.[0]) || 0))),
    Math.max(0, Math.min(1000, Math.round(Number(point?.[1]) || 0)))
  ];
}

function normalizeMessageSketch(value) {
  const rawPaths = Array.isArray(value?.paths) ? value.paths : [];
  const paths = rawPaths.slice(0, 8).map(path => (
    Array.isArray(path) ? path.slice(0, 96).map(normalizeSketchPoint).filter(point => point.length === 2) : []
  )).filter(path => path.length > 1);
  return paths.length ? { paths } : null;
}

function sketchToSvg(sketch) {
  const safeSketch = normalizeMessageSketch(sketch);
  if (!safeSketch) return "";
  const paths = safeSketch.paths.map(path => {
    const d = path.map(([x, y], index) => `${index ? "L" : "M"}${x / 10} ${y / 10}`).join(" ");
    return `<path d="${d}"/>`;
  }).join("");
  return `<div class="message-note-sketch" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${paths}</svg></div>`;
}

function drawSketchCanvas() {
  if (!messageDoodleCanvas) return;
  const ctx = messageSketch.ctx || messageDoodleCanvas.getContext("2d");
  if (!ctx) return;
  messageSketch.ctx = ctx;
  const { width, height } = messageDoodleCanvas;
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255, 220, 238, .92)";
  ctx.lineWidth = Math.max(3, Math.min(width, height) * 0.028);
  ctx.shadowColor = "rgba(255, 126, 190, .38)";
  ctx.shadowBlur = window.matchMedia("(max-width: 680px)").matches ? 3 : 8;
  messageSketch.paths.forEach(path => {
    if (path.length < 2) return;
    ctx.beginPath();
    path.forEach(([x, y], index) => {
      const px = (x / 1000) * width;
      const py = (y / 1000) * height;
      if (index) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    });
    ctx.stroke();
  });
}

function resizeSketchCanvas() {
  if (!messageDoodleCanvas) return;
  const rect = messageDoodleCanvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const ratioLimit = window.matchMedia("(max-width: 680px)").matches ? 1.5 : 2;
  const ratio = Math.min(window.devicePixelRatio || 1, ratioLimit);
  const nextWidth = Math.max(1, Math.round(rect.width * ratio));
  const nextHeight = Math.max(1, Math.round(rect.height * ratio));
  if (messageDoodleCanvas.width !== nextWidth || messageDoodleCanvas.height !== nextHeight) {
    messageDoodleCanvas.width = nextWidth;
    messageDoodleCanvas.height = nextHeight;
  }
  drawSketchCanvas();
}

function compactActiveSketchPath() {
  const path = messageSketch.activePath;
  if (!path || path.length < 96) return;
  const compacted = path.filter((point, index) => index % 2 === 0 || index === path.length - 1);
  const activeIndex = messageSketch.paths.indexOf(path);
  if (activeIndex >= 0) messageSketch.paths[activeIndex] = compacted;
  messageSketch.activePath = compacted;
}

function sketchPointFromEvent(event) {
  if (!messageDoodleCanvas) return [0, 0];
  const rect = messageDoodleCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 1000;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 1000;
  return normalizeSketchPoint([x, y]);
}

function drawSketchSegment(from, to) {
  if (!messageDoodleCanvas || !messageSketch.ctx) return;
  const ctx = messageSketch.ctx;
  const { width, height } = messageDoodleCanvas;
  const fromX = (from[0] / 1000) * width;
  const fromY = (from[1] / 1000) * height;
  const toX = (to[0] / 1000) * width;
  const toY = (to[1] / 1000) * height;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) / 2, (fromY + toY) / 2, toX, toY);
  ctx.stroke();
}

function clearMessageSketch() {
  messageSketch.paths = [];
  messageSketch.activePath = null;
  messageSketch.drawing = false;
  drawSketchCanvas();
}

function exportMessageSketch() {
  return normalizeMessageSketch({ paths: messageSketch.paths });
}

function setupMessageSketch() {
  if (!messageDoodleCanvas) return;
  resizeSketchCanvas();
  messageDoodleCanvas.addEventListener("pointerdown", event => {
    if (event.isPrimary === false || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    document.body.dataset.doodlePointer = `down:${event.pointerType || "unknown"}`;
    resizeSketchCanvas();
    messageDoodleCanvas.setPointerCapture?.(event.pointerId);
    const point = sketchPointFromEvent(event);
    messageSketch.activePath = [point];
    messageSketch.paths.push(messageSketch.activePath);
    messageSketch.paths = messageSketch.paths.slice(-8);
    messageSketch.drawing = true;
    drawSketchCanvas();
  }, { passive: false });
  messageDoodleCanvas.addEventListener("pointermove", event => {
    if (!messageSketch.drawing || !messageSketch.activePath) return;
    event.preventDefault();
    document.body.dataset.doodlePointer = `move:${event.pointerType || "unknown"}`;
    const coalesced = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [];
    const samples = coalesced.length ? coalesced : [event];
    samples.forEach(sample => {
      if (!messageSketch.activePath) return;
      compactActiveSketchPath();
      const point = sketchPointFromEvent(sample);
      const last = messageSketch.activePath[messageSketch.activePath.length - 1];
      const distance = Math.abs(point[0] - last[0]) + Math.abs(point[1] - last[1]);
      if (distance < 5) return;
      messageSketch.activePath.push(point);
      drawSketchSegment(last, point);
    });
    document.body.dataset.doodlePoints = String(messageSketch.activePath?.length || 0);
  }, { passive: false });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
    messageDoodleCanvas.addEventListener(type, event => {
      if (!messageSketch.drawing) return;
      event.preventDefault();
      if (messageDoodleCanvas.hasPointerCapture?.(event.pointerId)) {
        messageDoodleCanvas.releasePointerCapture(event.pointerId);
      }
      messageSketch.drawing = false;
      messageSketch.activePath = null;
      messageSketch.paths = messageSketch.paths.filter(path => path.length > 1);
      drawSketchCanvas();
      document.body.dataset.doodlePointer = `end:${event.pointerType || "unknown"}`;
      document.body.dataset.doodlePoints = String(messageSketch.paths.at(-1)?.length || 0);
    }, { passive: false });
  });
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => resizeSketchCanvas());
    observer.observe(messageDoodleCanvas);
  }
  window.addEventListener("resize", resizeSketchCanvas);
}

function renderMessageWall(messages) {
  if (!messageWall) return;
  if (!messages.length) {
    messageWall.innerHTML = `<div class="message-wall-state">还没有留言。你可以成为第一个把便签留在这里的人。</div>`;
    return;
  }
  messageWall.innerHTML = messages.map(message => `
    <article class="message-note" style="--note-tilt:${messageTilt(message.id)}deg">
      ${messageDoodle(message.id)}
      ${message.body ? `<p>${escapeHtml(message.body)}</p>` : ""}
      ${sketchToSvg(message.doodle)}
      <div class="message-note-footer">
        <span>${escapeHtml(message.name)} · ${escapeHtml(formatMessageDate(message.createdAt))}</span>
        ${message.owned ? `<button class="message-note-delete" type="button" data-message-delete="${escapeHtml(message.id)}">Delete mine</button>` : ""}
      </div>
    </article>
  `).join("");

  messageWall.querySelectorAll("[data-message-delete]").forEach(button => {
    button.addEventListener("click", () => deleteMessage(button.dataset.messageDelete, button));
  });
}

async function loadMessageWall() {
  if (!messageWall) return;
  const loadId = ++messageLoadId;
  messageWall.innerHTML = `<div class="message-wall-state">Loading messages…</div>`;
  try {
    const response = await fetch(MESSAGE_ENDPOINT, {
      headers: { "X-QRoom-Owner": getMessageOwnerToken() }
    });
    if (!response.ok) throw new Error("message wall unavailable");
    const data = await response.json();
    if (loadId !== messageLoadId) return;
    renderMessageWall(Array.isArray(data.messages) ? data.messages : []);
  } catch (error) {
    void error;
    if (loadId !== messageLoadId) return;
    messageWall.innerHTML = `<div class="message-wall-state">留言墙暂时没有连上。稍后再打开试试看。</div>`;
  }
}

async function clearMessageBoard() {
  if (messageName) messageName.value = "";
  if (messageText) messageText.value = "";
  if (messageWebsite) messageWebsite.value = "";
  if (messageStatus) messageStatus.textContent = "";
  clearMessageSketch();
  primeAudio().then(() => AudioSys.click()).catch(() => {});
}

async function saveMessageBoard(event) {
  event?.preventDefault();
  const name = messageName?.value.trim() || "";
  const message = messageText?.value.trim() || "";
  const doodle = exportMessageSketch();
  if (message.length < 2 && !doodle) {
    if (messageStatus) messageStatus.textContent = "写一句话，或者画一个小涂鸦，就能贴到墙上。";
    return;
  }
  const submitButton = document.getElementById("message-save");
  if (submitButton) submitButton.disabled = true;
  if (messageStatus) messageStatus.textContent = "Pinning your note…";
  try {
    const response = await fetch(MESSAGE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-QRoom-Owner": getMessageOwnerToken()
      },
      body: JSON.stringify({ name, message, doodle, website: messageWebsite?.value || "" })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not leave message");
    if (messageText) messageText.value = "";
    clearMessageSketch();
    if (name) {
      try { localStorage.setItem("qroom-message-name", name); } catch (error) { void error; }
    }
    if (messageStatus) messageStatus.textContent = "你的留言已经留在墙上了。";
    await loadMessageWall();
    messageWall?.scrollTo?.({ top: 0, behavior: "smooth" });
  } catch (error) {
    if (messageStatus) messageStatus.textContent = error instanceof Error ? error.message : "Could not leave message.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
  await primeAudio();
  AudioSys.click();
}

async function deleteMessage(id, button) {
  if (!id || !(button instanceof HTMLButtonElement)) return;
  button.disabled = true;
  if (messageStatus) messageStatus.textContent = "Removing your note…";
  try {
    const response = await fetch(`${MESSAGE_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "X-QRoom-Owner": getMessageOwnerToken() }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not delete message");
    if (messageStatus) messageStatus.textContent = "你的留言已经删除。";
    await loadMessageWall();
  } catch (error) {
    button.disabled = false;
    if (messageStatus) messageStatus.textContent = error instanceof Error ? error.message : "Could not delete message.";
  }
  await primeAudio();
  AudioSys.click();
}

async function openMessageBoard() {
  await primeAudio();
  messageModal?.classList.add("open");
  messageModal?.setAttribute("aria-hidden", "false");
  syncLayerChrome();
  if (messageName && !messageName.value) {
    try { messageName.value = localStorage.getItem("qroom-message-name") || ""; } catch (error) { void error; }
  }
  if (messageStatus) messageStatus.textContent = "你只能删除这台设备上由自己留下的留言。";
  requestAnimationFrame(() => requestAnimationFrame(resizeSketchCanvas));
  window.setTimeout(resizeSketchCanvas, 180);
  void loadMessageWall();
  AudioSys.click();
  AudioSys.shimmer(700, 0.018);
}

async function closeMessageBoard() {
  await primeAudio();
  messageModal?.classList.remove("open");
  messageModal?.setAttribute("aria-hidden", "true");
  syncLayerChrome();
  AudioSys.click();
}

async function openPanel() {
  await primeAudio();
  workPanel.classList.add("open");
  syncLayerChrome();
  workPanel.scrollTop = 0;
  activeWorkDetailId = null;
  deskBackCue.classList.remove("visible");
  renderWorkBrowser();
  AudioSys.stopKeyboard();
  syncDeskVideoAudio();
  AudioSys.click();
}

async function closePanel() {
  await primeAudio();
  workPanel.classList.remove("open");
  syncLayerChrome();
  activeWorkDetailId = null;
  deskBackCue.classList.add("visible");
  AudioSys.click();
  syncDeskVideoAudio();
}

function primeAudio() {
  // Do not await AudioContext here. Callers must continue within the same
  // trusted click so HTML audio and video tracks retain playback permission.
  AudioSys.ensureStarted().catch(() => {});
}

async function openDeskScene(openWorkPanel) {
  await primeAudio();
  activate("desk");
  AudioSys.click();
  AudioSys.transition();
  if (openWorkPanel) {
    await openPanel();
  } else {
    workPanel.classList.remove("open");
    syncLayerChrome();
    deskBackCue.classList.add("visible");
    syncDeskVideoAudio();
  }
}

async function openCoffeeScene() {
  await primeAudio();
  resetCoffeeExperience();
  activate("coffee");
  AudioSys.click();
  AudioSys.transition();
  AudioSys.shimmer(760, 0.018);
}

async function openChatScene() {
  await primeAudio();
  const startingNewVisit = !scenes.chat.classList.contains("active");
  resetChatInteraction();
  if (startingNewVisit) visitedChatKeys.clear();
  if (chatInput) chatInput.placeholder = "想先从哪里聊起…";
  renderChatSuggestions("initial");
  if (meEcho) meEcho.hidden = true;
  chatVisualState = "relaxed";
  activate("chat");
  AudioSys.click();
  AudioSys.transition();
  startChatRest("relaxed");
}

async function openContactScene(returnScene) {
  await primeAudio();
  contactReturnScene = returnScene || (scenes.desk.classList.contains("active") ? "desk" : "room");
  const backTag = document.getElementById("contact-back-tag");
  if (backTag) backTag.textContent = contactReturnScene === "desk" ? "Back To Desk" : "Back To Room";
  activate("contact");
  AudioSys.click();
  AudioSys.transition();
}

async function openOfficeScene() {
  await primeAudio();
  workPanel.classList.remove("open");
  messageModal?.classList.remove("open");
  messageModal?.setAttribute("aria-hidden", "true");
  resetCoffeeExperience();
  syncLayerChrome();
  activate("room");
  AudioSys.click();
  AudioSys.transition();
}

chatSuggestions?.addEventListener("click", async event => {
  const chip = event.target.closest(".chat-chip");
  if (!chip || chip.disabled) return;
  if (chip.dataset.action === "share") {
    chatInput.placeholder = "和我说说你最近在做什么…";
    chatInput.focus();
    await primeAudio();
    AudioSys.click();
    return;
  }
  await primeAudio();
  const chatKey = chip.dataset.chatKey || "";
  if (chatKey) visitedChatKeys.add(chatKey);
  sendChatMessage(chip.dataset.prompt || "", chatKey);
});

workTabs.forEach(button => {
  button.addEventListener("click", async () => {
    activeWorkTab = button.dataset.workTab === "after" ? "after" : "worked";
    renderWorkBrowser();
    await primeAudio();
    AudioSys.click();
  });
});

if (doorIdleVideo) {
  doorIdleVideo.playbackRate = 1;
  doorIdleVideo.addEventListener("loadedmetadata", () => {
    doorIdleVideo.play().catch(() => {});
  });
}

if (doorOpenVideo) {
  doorOpenVideo.addEventListener("loadedmetadata", () => {
    try {
      doorOpenVideo.currentTime = 0;
    } catch (error) {
      void error;
    }
  });
}

if (contactVideo) {
  contactVideo.playbackRate = 0.92;
  contactVideo.addEventListener("loadedmetadata", () => {
    contactVideo.currentTime = 0.06;
  });
}

document.getElementById("door-trigger").addEventListener("click", async () => {
  if (AudioSys.muted && !AudioSys.soundChoiceMade) {
    AudioSys.ensureStarted().catch(() => {});
    AudioSys.setMuted(false);
  } else {
    await primeAudio();
  }
  AudioSys.click(0.65);
  AudioSys.door(0.45);
  const doorScene = scenes.door;
  doorScene.classList.remove("farewell");
  if (!doorOpenVideo) {
    activate("room");
    return;
  }
  doorScene.classList.remove("opening-frame-ready");
  doorScene.classList.add("opening");
  if (doorOpenVideo.classList.contains("frame-ready")) doorScene.classList.add("opening-frame-ready");
  doorIdleVideo?.pause();
  doorOpenVideo.pause();
  syncDoorVideoAudio();
  try {
    doorOpenVideo.currentTime = 0;
  } catch (error) {
    void error;
  }
  await new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      doorOpenVideo.onended = null;
      doorOpenVideo.onerror = null;
      resolve();
    };
    doorOpenVideo.onended = finish;
    doorOpenVideo.onerror = finish;
    doorOpenVideo.play().then(() => {
      revealVideoFrame(doorOpenVideo, () => doorScene.classList.add("opening-frame-ready"));
    }).catch(finish);
    window.setTimeout(finish, 4200);
  });
  activate("room");
});

function bindRoomAction(triggerId, labelId, action) {
  [document.getElementById(triggerId), document.getElementById(labelId)].forEach(control => {
    control?.addEventListener("click", action);
  });
}

bindRoomAction("room-desk-trigger", "room-desk-label", () => openDeskScene(false));
bindRoomAction("room-coffee-trigger", "room-coffee-label", () => openCoffeeScene());
bindRoomAction("room-chat-trigger", "room-chat-label", () => openChatScene());
bindRoomAction("room-message-trigger", "room-message-label", () => openMessageBoard());

progressLabels.forEach(button => {
  button?.addEventListener("click", () => {
    const targetScene = button.dataset.studioScene;
    if (targetScene === "desk") return openDeskScene(false);
    if (targetScene === "room") return openOfficeScene();
    if (targetScene === "chat") return openChatScene();
    if (targetScene === "contact") return openContactScene("room");
  });
});

coffeeSectionButtons.forEach(button => {
  button.addEventListener("click", async () => {
    await primeAudio();
    setCoffeeMenuStep(button.dataset.coffeeSection || "root");
    AudioSys.shimmer(button.dataset.coffeeSection === "espresso" ? 680 : 820, 0.018);
  });
});

coffeeMenuBack?.addEventListener("click", async () => {
  await primeAudio();
  setCoffeeMenuStep("root");
  AudioSys.click(0.72);
});

coffeeDrinkButtons.forEach(button => {
  button.addEventListener("click", async () => {
    await playCoffeeVideo(button.dataset.coffeeVideo || "", button.dataset.coffeeLabel || "");
  });
});

document.getElementById("coffee-latte-option")?.addEventListener("click", async () => {
  await primeAudio();
  showCoffeeToast("Run out of milk.", "Try an Iced Americano instead.");
  AudioSys.shimmer(430, 0.014);
});

document.getElementById("coffee-choose-again")?.addEventListener("click", () => {
  resetCoffeeExperience();
  primeAudio();
  AudioSys.shimmer(720, 0.016);
});

document.getElementById("coffee-back-trigger")?.addEventListener("click", async () => {
  await primeAudio();
  resetCoffeeExperience();
  activate("room");
  AudioSys.transition();
});

async function openChatFromCoffee() {
  await primeAudio();
  clearCoffeeCompletionTimer();
  Object.values(coffeeVideos).forEach(video => video?.pause());
  await openChatScene();
}

coffeeResultChat?.addEventListener("click", openChatFromCoffee);

document.getElementById("room-exit-trigger").addEventListener("click", async () => {
  await primeAudio();
  scenes.door.classList.add("farewell");
  activate("door");
  AudioSys.click(0.6);
  AudioSys.door();
  AudioSys.shimmer(560, 0.018);
});

document.getElementById("desk-trigger").addEventListener("click", async () => openPanel());
document.getElementById("desk-contact-trigger")?.addEventListener("click", async () => openContactScene("desk"));
document.getElementById("panel-close-side").addEventListener("click", async () => closePanel());

document.getElementById("message-close")?.addEventListener("click", async () => closeMessageBoard());
document.getElementById("message-backdrop")?.addEventListener("click", async () => closeMessageBoard());
document.getElementById("message-clear")?.addEventListener("click", async () => clearMessageBoard());
messageDoodleClear?.addEventListener("click", async () => {
  clearMessageSketch();
  await primeAudio();
  AudioSys.click();
});
messageForm?.addEventListener("submit", saveMessageBoard);
setupMessageSketch();
document.getElementById("contact-message-trigger")?.addEventListener("click", async () => openMessageBoard());

deskBackCue.addEventListener("click", async () => {
  await primeAudio();
  activate("room");
  AudioSys.click();
  AudioSys.transition();
});

chatBackCue.addEventListener("click", async () => {
  await primeAudio();
  activate("room");
  AudioSys.click();
  AudioSys.transition();
});

document.getElementById("back-room-trigger").addEventListener("click", async () => {
  await primeAudio();
  activate(contactReturnScene === "desk" ? "desk" : "room");
  workPanel.classList.remove("open");
  syncLayerChrome();
  deskBackCue.classList.toggle("visible", contactReturnScene === "desk");
  AudioSys.click();
  AudioSys.transition();
  if (contactVideo) {
    contactVideo.play().catch(() => {});
  }
});

document.getElementById("send-btn").addEventListener("click", async () => {
  await primeAudio();
  AudioSys.click();
  sendChatMessage();
});

chatInput.addEventListener("keydown", async event => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  await primeAudio();
  sendChatMessage();
});

soundToggle.addEventListener("click", () => {
  const nextMuted = !AudioSys.muted;
  AudioSys.soundChoiceMade = true;
  if (nextMuted) AudioSys.click(0.9, true);
  AudioSys.setMuted(nextMuted);
  if (!nextMuted) {
    AudioSys.click(0.9, true);
    AudioSys.ensureStarted().catch(() => {});
  }
});

moodTrigger?.addEventListener("click", async () => {
  musicMenu?.classList.remove("open");
  musicTrigger?.setAttribute("aria-expanded", "false");
  const isOpen = moodMenu?.classList.toggle("open") || false;
  moodTrigger.setAttribute("aria-expanded", String(isOpen));
  await primeAudio();
  AudioSys.shimmer(700, 0.018);
});

moodButtons.forEach(button => {
  button.addEventListener("click", async () => {
    setRoomMood(button.dataset.mood || "glow");
    moodMenu?.classList.remove("open");
    moodTrigger?.setAttribute("aria-expanded", "false");
    await primeAudio();
    AudioSys.shimmer(button.dataset.mood === "disco" ? 880 : 620, 0.024);
  });
});

musicTrigger?.addEventListener("click", async () => {
  moodMenu?.classList.remove("open");
  moodTrigger?.setAttribute("aria-expanded", "false");
  const isOpen = musicMenu?.classList.toggle("open") || false;
  musicTrigger.setAttribute("aria-expanded", String(isOpen));
  await primeAudio();
});

musicButtons.forEach(button => {
  button.addEventListener("click", async () => {
    applyMusicTrack(button.dataset.music || "serene");
    musicMenu?.classList.remove("open");
    musicTrigger?.setAttribute("aria-expanded", "false");
    await primeAudio();
  });
});

musicUploadTrigger?.addEventListener("click", () => musicFileInput?.click());

musicFileInput?.addEventListener("change", () => {
  const file = musicFileInput.files?.[0];
  if (!file) return;
  if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
  customMusicUrl = URL.createObjectURL(file);
  applyMusicTrack("custom", { src: customMusicUrl, label: file.name, persist: false });
  musicMenu?.classList.remove("open");
  musicTrigger?.setAttribute("aria-expanded", "false");
  musicFileInput.value = "";
});

document.addEventListener("click", event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest(".mood-dock")) {
    moodMenu?.classList.remove("open");
    moodTrigger?.setAttribute("aria-expanded", "false");
  }
  if (!target.closest(".music-dock")) {
    musicMenu?.classList.remove("open");
    musicTrigger?.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("click", async event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest("a[href]");
  if (!link) return;
  await primeAudio();
  AudioSys.click(0.92);
});

let pendingTouchFeedback = null;

function playInteractiveFeedback(interactive) {
  const played = AudioSys.click(1, true);
  if (played) {
    document.body.dataset.uiClickTarget = interactive.getAttribute("aria-label") || interactive.textContent.trim().slice(0, 48);
  }
  AudioSys.ensureStarted().catch(() => {});
}

document.addEventListener("pointerdown", event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const interactive = target.closest("button, a[href], .ring, .back-cue, .hotspot, .chat-chip");
  if (!interactive) return;
  if (interactive.closest("#sound-toggle")) return;
  if (event.pointerType === "touch") {
    pendingTouchFeedback = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      interactive
    };
    return;
  }
  playInteractiveFeedback(interactive);
}, { capture: true });

document.addEventListener("pointermove", event => {
  if (!pendingTouchFeedback || pendingTouchFeedback.pointerId !== event.pointerId) return;
  const distance = Math.abs(event.clientX - pendingTouchFeedback.x) + Math.abs(event.clientY - pendingTouchFeedback.y);
  if (distance > 12) pendingTouchFeedback = null;
}, { capture: true, passive: true });

document.addEventListener("pointerup", event => {
  if (!pendingTouchFeedback || pendingTouchFeedback.pointerId !== event.pointerId) return;
  const { interactive } = pendingTouchFeedback;
  pendingTouchFeedback = null;
  playInteractiveFeedback(interactive);
}, { capture: true });

document.addEventListener("pointercancel", event => {
  if (pendingTouchFeedback?.pointerId === event.pointerId) pendingTouchFeedback = null;
}, { capture: true });

document.addEventListener("keydown", async event => {
  if (event.key !== "Escape" || !messageModal?.classList.contains("open")) return;
  event.preventDefault();
  await closeMessageBoard();
});

[roomLoopVideo, deskLoopVideo, ...Object.values(chatStateVideos)].forEach(video => {
  if (!video) return;
  video.addEventListener("loadedmetadata", () => {
    try {
      video.currentTime = 0;
    } catch (error) {
      void error;
    }
  });
});

syncDoorSceneMedia("door");
syncLoopSceneMedia("door");
syncChatSceneMedia("door");
syncDeskVideoAudio();

function applyDebugRoute() {
  const params = new URLSearchParams(window.location.search);
  const debugScene = params.get("debugScene");
  if (debugScene && scenes[debugScene]) {
    activate(debugScene);
  }
  const debugWork = params.get("debugWork");
  if (debugWork) {
    const exists = workWallItems.some(item => item.id === debugWork);
    if (exists) {
      activate("desk");
      workPanel.classList.add("open");
      syncLayerChrome();
      syncDeskVideoAudio();
      deskBackCue.classList.remove("visible");
      activeWorkDetailId = debugWork;
      renderWorkBrowser();
    }
  }
  if (params.get("debugMessage") === "1") {
    activate("room");
    messageModal?.classList.add("open");
    messageModal?.setAttribute("aria-hidden", "false");
    syncLayerChrome();
    if (messageStatus) messageStatus.textContent = "你只能删除这台设备上由自己留下的留言。";
    requestAnimationFrame(() => requestAnimationFrame(resizeSketchCanvas));
    window.setTimeout(resizeSketchCanvas, 180);
    void loadMessageWall();
  }
}

applyDebugRoute();
document.body.setAttribute("data-script-complete", "yes");
