document.body.setAttribute("data-script-ready", "yes");

const scenes = {
  door: document.getElementById("scene-door"),
  room: document.getElementById("scene-room"),
  desk: document.getElementById("scene-desk"),
  chat: document.getElementById("scene-chat"),
  contact: document.getElementById("scene-contact")
};

const progressLabels = [
  document.getElementById("p1"),
  document.getElementById("p2"),
  document.getElementById("p3"),
  document.getElementById("p4"),
  document.getElementById("p5")
];
const progressDots = [
  document.getElementById("d1"),
  document.getElementById("d2"),
  document.getElementById("d3"),
  document.getElementById("d4")
];

const workPanel = document.getElementById("work-panel");
const browserList = document.getElementById("browser-list");
const browserDetail = document.getElementById("browser-detail");
const workTabs = Array.from(document.querySelectorAll("[data-work-tab]"));
const deskBackCue = document.getElementById("desk-back-cue");
const chatBackCue = document.getElementById("chat-back-cue");
const qStageText = document.getElementById("q-stage-text");
const meEcho = document.getElementById("me-echo");
const chatInput = document.getElementById("chat-input");
const chatChips = Array.from(document.querySelectorAll(".chat-chip"));
const soundToggle = document.getElementById("sound-toggle");
const messageModal = document.getElementById("message-modal");
const messageCanvas = document.getElementById("message-canvas");
const messageText = document.getElementById("message-text");
const messageStatus = document.getElementById("message-status");
const doorIdleVideo = document.getElementById("door-idle-video");
const doorOpenVideo = document.getElementById("door-open-video");
const roomLoopVideo = document.getElementById("room-loop-video");
const deskLoopVideo = document.getElementById("desk-loop-video");
const chatLoopVideo = document.getElementById("chat-loop-video");
const contactVideo = document.getElementById("contact-video");
const sceneLoopVideos = {
  room: roomLoopVideo,
  desk: deskLoopVideo,
  chat: chatLoopVideo
};

const order = ["door", "room", "desk", "chat", "contact"];
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
    media: [
      { src: "./assets/ai-shopping-1.png", alt: "淘宝 AI 导购界面", caption: "AI 导购合辑与推荐界面", wide: true, fit: "contain" },
      { src: "./assets/ai-shopping-2.png", alt: "淘宝导购补充界面", caption: "补充导购流程与结果页", tall: true, fit: "contain" },
      { src: "./assets/taobao.png", alt: "手机淘宝端改版", caption: "同阶段的手淘端产品演进", fit: "contain" }
    ],
    metrics: [
      ["10亿级", "用户产品场景"],
      ["AI Native", "购物体验探索"]
    ],
    res: "GSB 评测体系 · bad case 26%→8% · 分类准确性 56%→98%"
  },
  {
    id: "oneday",
    icon: "./assets/icon-oneday.png",
    meta: "AI tools · Creative generation",
    stamp: "2005",
    name: "AI 创意应用生成工具",
    blurb: "Prompt to creative output",
    href: "https://meoo.com/",
    chip: "Prompt to Creative Output",
    title: "AI 创意应用生成工具",
    desc: "一款面向非代码用户的 AI 创意应用生成工具，可以把自然语言需求直接生成可编辑页面、活动物料和轻量工具，帮助创作者和产品团队更快从灵感进入 demo、预览和分享。",
    media: [
      { src: "./assets/meoo-coding.png", alt: "AI 创意应用生成工具界面", caption: "一句话生成真实可改的应用", wide: true },
      { src: "./assets/coding-contributions.png", alt: "AI Coding 运营与贡献", caption: "运营、教程和贡献记录" },
      { src: "./assets/showcase-demo.png", alt: "AI 工具现场 demo", caption: "现场展示与传播物料" }
    ],
    metrics: [
      ["DAU 2万+", "内部创作工具"],
      ["日创作 6千+", "真实生成场景"]
    ],
    res: "全栈 / AI 应用生成 · creative workflow"
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
    chips: ["Seedance", "AIGC", "游戏化互动", "小红书运营"],
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
    tag: "iOS / iPad App",
    cat: "iOS / iPad App · 吉他谱整理与练习",
    subtitle: "AI 个人谱库。",
    theme: "light",
    span: "span-4",
    art: "./assets/shipu-library.png",
    meta: "独立开发 · 收集 — 整理 — 练习",
    one: "AI 个人谱库。",
    desc: "拾谱是一款面向吉他练习者的个人谱库与练习工具。它解决的不是“找一首谱”这个单点问题，而是把散落在截图、公众号、短视频、聊天记录和网页收藏里的吉他谱，整理成一个可以长期维护、随时练习的个人谱库。<br><br>产品围绕“收集—整理—练习”搭建轻量闭环：手机端适合随手导入和管理，iPad 横屏适合放在谱架上看谱；谱册、练习册、收藏、节拍器和多种看谱模式共同服务一个目标——让每一次收谱都能沉淀成下一次练习的入口。",
    chips: ["正在上架 App Store", "iOS / iPad", "练习册", "独立开发"],
    modalHero: false,
    points: [
      ["解决的问题", "吉他谱常常散落在截图、短视频、公众号和聊天记录里；真正练习时又会遇到找不到谱、分类不清、手机屏幕太小、节拍器和谱子分离的问题。"],
      ["主要功能", "支持导入谱图、建立个人谱库、按曲谱和练习册组织内容；练习时提供单页/双页/网格/自由视图，以及节拍器、收藏和最近练习记录。"],
      ["产品亮点", "没有做成复杂乐谱编辑器，而是抓住高频练琴链路：快速收集、清楚整理、稳定看谱、持续复练，让 iPhone 和 iPad 分别承担收集与练习场景。"]
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
    chips: ["Seedance", "AIGC", "游戏化互动"],
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
    cat: "iOS / iPad App · 吉他谱整理与练习",
    subtitle: "AI 个人谱库。",
    accent: "yellow",
    size: "span-third",
    chips: ["正在上架 App Store", "iOS / iPad", "练习册"],
    previewMode: "shipu"
  },
  {
    id: "taobao",
    source: "worked",
    order: "04 / Alibaba / Taobao",
    title: "淘宝",
    tag: "Alibaba / Taobao",
    cat: "AI Shopping",
    subtitle: "把收藏、足迹和种草，整理成可购物的下一步。",
    accent: "sand",
    size: "span-third",
    chips: ["导购", "收藏", "兴趣发现"],
    previewMode: "plain",
    cover: "./assets/ai-shopping-1.png"
  },
  {
    id: "meijian",
    source: "worked",
    order: "05 / Meijian · 0→1",
    title: "美间",
    tag: "Meijian · 0→1",
    cat: "Design Tool",
    subtitle: "把素材、方案、商品和交易串成一条工作流。",
    accent: "violet",
    size: "span-third",
    chips: ["0→1", "设计工具", "内容社区"],
    previewMode: "plain",
    cover: "./assets/meijian.png"
  }
];
let activeWorkDetailId = null;
let activeWorkedId = "taobao";
let activeSelectedId = "shipu";
let activeWorkTab = "worked";
const WORKER = "https://another-me-q.jiejoe-eth.workers.dev";
let chatBusy = false;
const chatIntro =
  "Hi, I'm Q, an AI-native product builder. Ask me what I'm building, what I'm exploring with AI, or what small project I'm obsessed with lately.";
let convo = [
  {
    role: "system",
    content:
      "You are Q, an AI-native product builder speaking in a warm, thoughtful, first-person voice. Keep answers grounded, conversational, and specific. Avoid empty slogans, avoid saying things like 'real worker', and avoid vague philosophical filler. If this is an opening turn, briefly introduce yourself and invite the other person to ask about what you are building or what they are building. Your current knowledge base: 1) You care a lot about human-AI interaction, especially how people collaborate with one AI agent or with multiple agents in ways that genuinely improve productivity. 2) If asked what small projects you are doing recently, say you are researching real-time voice plus hardware, and exploring a companion for children that can talk and chat naturally. 3) If asked whether you recently shipped an app or how you think about using AI in apps, say you are building a recipe app. Explain that many problems are generative, but some products deserve to become apps because they preserve information, support display, and create collection value over time. Add that the recipe app solves your own daily-life problem and has very high single-user frequency. 4) These projects live in your knowledge base and should stay consistent across answers. 5) If the conversation is just starting, you can also ask: 'What have you been building recently?' 6) You enjoy hackathons and offline meetups. 7) Your interests include sports, remote travel planning, and inviting people to join workout sessions such as gym, yoga, or climbing. Keep answers concise by default, but rich when the user asks for more."
  },
  { role: "assistant", content: "Hi, I'm Q, an AI-native product builder. I work on a lot of small products and experiments. Lately I've been thinking a lot about how people and AI agents can really collaborate. What have you been building recently?" }
];

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

    Array.from(browserDetail.querySelectorAll("[data-work-id]")).forEach(button => {
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

  if (wallItem.source === "worked") {
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

function setQSpeech(text, typing) {
  qStageText.textContent = text;
  qStageText.classList.toggle("typing", Boolean(typing));
}

async function sendChatMessage(prefill) {
  const text = (prefill || chatInput.value).trim();
  if (!text || chatBusy) return;
  chatBusy = true;
  chatInput.value = "";
  meEcho.hidden = false;
  meEcho.textContent = text;
  setQSpeech("Let me think about that for a second…", true);
  convo.push({ role: "user", content: text });
  AudioSys.click();
  AudioSys.shimmer(820, 0.018);
  document.getElementById("send-btn").disabled = true;

  try {
    const resp = await fetch(WORKER + "/qroom-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: convo })
    });
    if (!resp.ok || !resp.body) throw new Error("chat unavailable");
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";

    while (true) {
      const part = await reader.read();
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
          acc += delta;
          setQSpeech(acc, true);
        } catch (error) {
          void error;
        }
      }
    }

    if (!acc) {
      acc = "I didn't catch that cleanly. Ask me again, or we can come at it from another angle.";
    }
    setQSpeech(acc, false);
    convo.push({ role: "assistant", content: acc });
  } catch (error) {
    setQSpeech("Something glitched for a moment. Try me again?", false);
  } finally {
    chatBusy = false;
    document.getElementById("send-btn").disabled = false;
  }
}

window.sendChatMessage = sendChatMessage;

const AudioSys = {
  ctx: null,
  muted: true,
  master: null,
  padGain: null,
  keyboardTimer: null,
  roomTimer: null,
  lastClickAt: 0,
  async ensureStarted() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.0001;
      this.master.connect(this.ctx.destination);
      this.padGain = this.ctx.createGain();
      this.padGain.gain.value = 0.0001;
      this.padGain.connect(this.master);
      [174.61, 246.94, 329.63].forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = index === 0 ? "triangle" : "sine";
        osc.frequency.value = freq;
        gain.gain.value = index === 0 ? 0.24 : 0.11;
        osc.connect(gain);
        gain.connect(this.padGain);
        osc.start();
      });
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.026;
      lfo.connect(lfoGain);
      lfoGain.connect(this.padGain.gain);
      lfo.start();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.muted) this.setMuted(false);
  },
  setMuted(nextMuted) {
    this.muted = nextMuted;
    soundToggle.innerHTML = `<strong>${this.muted ? "Sound Off" : "Sound On"}</strong>`;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.muted ? 0.0001 : 0.24, now + 0.25);
    this.padGain.gain.cancelScheduledValues(now);
    this.padGain.gain.setValueAtTime(this.padGain.gain.value, now);
    this.padGain.gain.linearRampToValueAtTime(this.muted ? 0.0001 : 0.11, now + 0.8);
    if (this.muted) {
      this.stopKeyboard();
      this.stopRoomDetails();
    } else {
      this.shimmer(720, 0.028);
      this.syncSceneAudio();
    }
  },
  tone(freq, dur, vol, type) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.master);
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
    gain.connect(this.master);
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, to), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.start(now);
    src.stop(now + dur);
  },
  click(scale = 1) {
    const now = Date.now();
    if (now - this.lastClickAt < 64) return;
    this.lastClickAt = now;
    const first = 0.07 * scale;
    const second = 0.038 * scale;
    this.noise(0.038, 0.034 * scale, 4200, 1280);
    this.tone(760, 0.055, first, "triangle");
    setTimeout(() => this.tone(1160, 0.048, second, "sine"), 30);
  },
  door() {
    this.noise(0.18, 0.022, 420, 90);
    setTimeout(() => this.tone(118, 0.22, 0.05, "triangle"), 36);
  },
  transition(delay = 76) {
    window.setTimeout(() => {
      this.noise(0.12, 0.02, 1500, 280);
      setTimeout(() => this.tone(260, 0.11, 0.022, "triangle"), 42);
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
    if (this.muted) return;
    if (scenes.room.classList.contains("active")) this.startRoomDetails();
    if (scenes.desk.classList.contains("active")) this.startKeyboard();
    if (scenes.chat.classList.contains("active") || scenes.contact.classList.contains("active")) {
      this.shimmer(620, 0.02);
    }
  }
};

function setProgress(stepIndex) {
  progressLabels.forEach((el, i) => el.classList.toggle("active", i === stepIndex));
  progressDots.forEach((el, i) => el.classList.toggle("active", i < stepIndex));
}

function activate(name) {
  Object.entries(scenes).forEach(([key, scene]) => {
    scene.classList.toggle("active", key === name);
  });
  setProgress(order.indexOf(name));
  syncDoorSceneMedia(name);
  syncLoopSceneMedia(name);
  AudioSys.syncSceneAudio();
}

function syncDoorSceneMedia(activeScene) {
  if (!doorIdleVideo || !doorOpenVideo) return;
  if (activeScene === "door") {
    scenes.door.classList.remove("opening");
    doorOpenVideo.pause();
    try {
      doorOpenVideo.currentTime = 0;
    } catch (error) {
      void error;
    }
    doorIdleVideo.play().catch(() => {});
    return;
  }
  doorIdleVideo.pause();
}

function syncLoopSceneMedia(activeScene) {
  Object.entries(sceneLoopVideos).forEach(([key, video]) => {
    if (!video) return;
    if (key === activeScene) {
      video.play().catch(() => {});
      return;
    }
    video.pause();
  });
}

let messageDrawing = false;
let messageCanvasReady = false;

function setupMessageCanvas() {
  if (!messageCanvas || messageCanvasReady) return;
  messageCanvasReady = true;
  const ctx = messageCanvas.getContext("2d");
  if (!ctx) return;

  const paintBase = () => {
    ctx.clearRect(0, 0, messageCanvas.width, messageCanvas.height);
    ctx.fillStyle = "rgba(250, 246, 255, 0.055)";
    ctx.fillRect(0, 0, messageCanvas.width, messageCanvas.height);
    ctx.strokeStyle = "rgba(229, 216, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x < messageCanvas.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, messageCanvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < messageCanvas.height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(messageCanvas.width, y);
      ctx.stroke();
    }
  };

  const pointFromEvent = event => {
    const rect = messageCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * messageCanvas.width,
      y: ((event.clientY - rect.top) / rect.height) * messageCanvas.height
    };
  };

  const begin = event => {
    messageDrawing = true;
    const point = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.strokeStyle = "rgba(214, 190, 255, 0.92)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    messageCanvas.setPointerCapture?.(event.pointerId);
  };

  const move = event => {
    if (!messageDrawing) return;
    const point = pointFromEvent(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const end = event => {
    messageDrawing = false;
    messageCanvas.releasePointerCapture?.(event.pointerId);
  };

  messageCanvas.addEventListener("pointerdown", begin);
  messageCanvas.addEventListener("pointermove", move);
  messageCanvas.addEventListener("pointerup", end);
  messageCanvas.addEventListener("pointercancel", end);

  document.getElementById("message-clear")?.addEventListener("click", async () => {
    await primeAudio();
    AudioSys.click();
    paintBase();
    if (messageStatus) messageStatus.textContent = "Board cleared.";
  });

  document.getElementById("message-save")?.addEventListener("click", async () => {
    await primeAudio();
    AudioSys.click();
    try {
      localStorage.setItem("q-room-message", JSON.stringify({
        text: messageText?.value || "",
        sketch: messageCanvas.toDataURL("image/png"),
        updatedAt: new Date().toISOString()
      }));
      if (messageStatus) messageStatus.textContent = "Message saved locally.";
    } catch (error) {
      void error;
      if (messageStatus) messageStatus.textContent = "Could not save here, but the mark stays on screen.";
    }
  });

  paintBase();
}

async function openMessageBoard() {
  await primeAudio();
  setupMessageCanvas();
  messageModal?.classList.add("open");
  messageModal?.setAttribute("aria-hidden", "false");
  if (messageStatus) messageStatus.textContent = "";
  AudioSys.click();
  AudioSys.shimmer(700, 0.018);
}

async function closeMessageBoard() {
  await primeAudio();
  messageModal?.classList.remove("open");
  messageModal?.setAttribute("aria-hidden", "true");
  AudioSys.click();
}

async function openPanel() {
  await primeAudio();
  workPanel.classList.add("open");
  workPanel.scrollTop = 0;
  activeWorkDetailId = null;
  deskBackCue.classList.remove("visible");
  renderWorkBrowser();
  AudioSys.stopKeyboard();
  AudioSys.click();
}

async function closePanel() {
  await primeAudio();
  workPanel.classList.remove("open");
  activeWorkDetailId = null;
  deskBackCue.classList.add("visible");
  AudioSys.click();
  AudioSys.startKeyboard();
}

async function primeAudio() {
  await AudioSys.ensureStarted().catch(() => {});
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
    deskBackCue.classList.add("visible");
  }
}

async function openChatScene() {
  await primeAudio();
  activate("chat");
  const lastAssistantEntry = [...convo].reverse().find(item => item.role === "assistant");
  const lastAssistant = lastAssistantEntry ? lastAssistantEntry.content : "";
  setQSpeech(
    lastAssistant || chatIntro,
    false
  );
  AudioSys.click();
  AudioSys.transition();
}

async function openContactScene() {
  await primeAudio();
  activate("contact");
  AudioSys.click();
  AudioSys.transition();
}

chatChips.forEach(chip => {
  chip.addEventListener("click", async () => {
    await primeAudio();
    sendChatMessage(chip.dataset.prompt || "");
  });
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
  await primeAudio();
  AudioSys.click(0.42);
  AudioSys.door();
  if (!doorOpenVideo) {
    activate("room");
    return;
  }
  const doorScene = scenes.door;
  doorScene.classList.add("opening");
  doorIdleVideo?.pause();
  doorOpenVideo.pause();
  doorOpenVideo.muted = AudioSys.muted;
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
    doorOpenVideo.play().catch(finish);
    window.setTimeout(finish, 2600);
  });
  activate("room");
});

document.getElementById("room-desk-trigger").addEventListener("click", async () => openDeskScene(false));
document.getElementById("room-chat-trigger").addEventListener("click", async () => openChatScene());
document.getElementById("room-contact-trigger").addEventListener("click", async () => openContactScene());
document.getElementById("room-message-trigger")?.addEventListener("click", async () => openMessageBoard());

document.getElementById("room-exit-trigger").addEventListener("click", async () => {
  await primeAudio();
  activate("door");
  AudioSys.click(0.6);
  AudioSys.door();
});

document.getElementById("desk-trigger").addEventListener("click", async () => openPanel());
document.getElementById("desk-contact-trigger")?.addEventListener("click", async () => openContactScene());
document.getElementById("panel-close-side").addEventListener("click", async () => closePanel());

document.getElementById("message-close")?.addEventListener("click", async () => closeMessageBoard());
document.getElementById("message-backdrop")?.addEventListener("click", async () => closeMessageBoard());

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
  activate("room");
  workPanel.classList.remove("open");
  deskBackCue.classList.add("visible");
  AudioSys.click();
  AudioSys.transition();
  if (contactVideo) {
    contactVideo.play().catch(() => {});
  }
});

document.getElementById("copy-email-btn").addEventListener("click", async event => {
  await primeAudio();
  AudioSys.click();
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) return;
  try {
    await navigator.clipboard.writeText("jiejoe2017@gmail.com");
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original || "Copy Email";
    }, 1400);
  } catch (error) {
    void error;
    button.textContent = "Copy failed";
    window.setTimeout(() => {
      button.textContent = "Copy Email";
    }, 1400);
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

soundToggle.addEventListener("click", async () => {
  if (!AudioSys.ctx) {
    await primeAudio();
    return;
  }
  AudioSys.setMuted(!AudioSys.muted);
  if (doorOpenVideo) {
    doorOpenVideo.muted = AudioSys.muted;
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

document.addEventListener("pointerdown", async event => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const interactive = target.closest("button, a[href], .ring, .back-cue, .hotspot, .chat-chip");
  if (!interactive) return;
  if (interactive.closest("#door-trigger, #sound-toggle")) return;
  await primeAudio();
  AudioSys.click(1.05);
}, { capture: true });

document.addEventListener("keydown", async event => {
  if (event.key !== "Escape" || !messageModal?.classList.contains("open")) return;
  event.preventDefault();
  await closeMessageBoard();
});

[roomLoopVideo, deskLoopVideo, chatLoopVideo].forEach(video => {
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
      deskBackCue.classList.remove("visible");
      activeWorkDetailId = debugWork;
      renderWorkBrowser();
    }
  }
  if (params.get("debugMessage") === "1") {
    activate("room");
    setupMessageCanvas();
    messageModal?.classList.add("open");
    messageModal?.setAttribute("aria-hidden", "false");
  }
}

applyDebugRoute();
document.body.setAttribute("data-script-complete", "yes");
