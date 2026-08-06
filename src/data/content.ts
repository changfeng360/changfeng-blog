export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readTime: string;
  emoji: string;
  featured?: boolean;
};

export type Project = {
  name: string;
  description: string;
  year: string;
  stack: string[];
  icon: string;
  accent: string;
  github: string;
  website: string;
};

export type Friend = {
  name: string;
  description: string;
  url: string;
  category: string;
  rating: number;
  tags: string[];
};

export type Photo = {
  id: string;
  src: string;
  caption?: string;
  createdAt: string;
};

export type Profile = {
  name: string;
  location: string;
  coffee: string;
  aboutDescription: string;
  tagline: string;
  intro: string;
  email: string;
  github: string;
  bilibili: string;
  tags: string[];
  skills: {
    name: string;
    level: number;
  }[];
};

export const posts: Post[] = [
  {
    slug: "pixel-apple-blog",
    title: "我用像素风重新设计了个人博客",
    excerpt:
      "把苹果的克制与 8-bit 的幽默放进同一张 Bento Grid，记录这轮重构里关于材质、弹簧和像素字体的取舍。",
    date: "2026-08-04",
    tags: ["Tech", "Design", "Next.js"],
    readTime: "6 min",
    emoji: "🍎",
    featured: true,
  },
  {
    slug: "agent-workflow",
    title: "Agent 工作流里最容易被忽略的一环",
    excerpt:
      "工具调用不是越多越好，反馈回路、上下文卫生和失败恢复才是让 Agent 真正可靠的地方。",
    date: "2026-07-26",
    tags: ["Agent", "Tools", "System"],
    readTime: "8 min",
    emoji: "🛠️",
  },
  {
    slug: "tiny-cpp-engine",
    title: "C++ 小游戏引擎：从 0 到 60 FPS",
    excerpt:
      "一个周末、一块像素画布和一坨朴素的数据结构，最后跑起来的那一刻比想象中更安静。",
    date: "2026-07-18",
    tags: ["C++", "GameDev", "SDL2"],
    readTime: "10 min",
    emoji: "👾",
  },
  {
    slug: "lcd-widgets",
    title: "时钟、日历与 LCD 屏：数字小组件的浪漫",
    excerpt:
      "为什么复古点阵屏总让人多看两眼？聊聊 8-bit 小组件背后的栅格、发光与等待感。",
    date: "2026-07-09",
    tags: ["CSS", "Design", "Widgets"],
    readTime: "5 min",
    emoji: "🕹️",
  },
  {
    slug: "framer-motion-springs",
    title: "Framer Motion 弹簧动效实践清单",
    excerpt:
      "从阻尼和响应到速度交接，整理一套可以直接抄的苹果式流体动效写法。",
    date: "2026-06-28",
    tags: ["Motion", "React", "Framer"],
    readTime: "7 min",
    emoji: "🌊",
  },
  {
    slug: "pixel-octocat",
    title: "把一只 GitHub 像素猫放进网站角落",
    excerpt:
      "用 SVG 的矩形像素一点点拼出敲代码的小猫，顺手给它加上了眨眼和打字动画。",
    date: "2026-06-15",
    tags: ["SVG", "Fun", "GitHub"],
    readTime: "4 min",
    emoji: "🐙",
  },
];

export const projects: Project[] = [
  {
    name: "PixelTerm",
    description:
      "一个复古终端风格的控制台工具，用像素字体渲染任务状态、日志与部署进度。",
    year: "2026",
    stack: ["TypeScript", "React", "Node.js"],
    icon: "⌘",
    accent: "mint",
    github: "https://github.com",
    website: "#",
  },
  {
    name: "AgentFlow",
    description:
      "面向多智能体工作流的可视化编排台，支持工具注册、上下文审计与失败重试。",
    year: "2025",
    stack: ["Python", "FastAPI", "OpenAI"],
    icon: "AI",
    accent: "blue",
    github: "https://github.com",
    website: "#",
  },
  {
    name: "TinyEngine",
    description:
      "一块像素画布、一个简单 ECS 和一个很朴素的渲染循环组成的 C++ 小引擎。",
    year: "2025",
    stack: ["C++", "SDL2", "ECS"],
    icon: "◈",
    accent: "tangerine",
    github: "https://github.com",
    website: "#",
  },
  {
    name: "RetroAudio",
    description:
      "用 Web Audio 与点阵波形图做的迷你音乐播放器，让声音回到像素时代。",
    year: "2024",
    stack: ["Web Audio", "TypeScript", "CSS"],
    icon: "♪",
    accent: "pink",
    github: "https://github.com",
    website: "#",
  },
  {
    name: "ClockOS",
    description:
      "一组 LCD 风格小组件：时钟、日历、倒计时与天气，全部由纯 CSS 像素点阵构成。",
    year: "2024",
    stack: ["CSS", "JavaScript", "Widgets"],
    icon: "◐",
    accent: "lilac",
    github: "https://github.com",
    website: "#",
  },
  {
    name: "Bento Theme",
    description:
      "把 Bento Grid、毛玻璃材质和复古像素点缀打包成一套可复用的个人主页主题。",
    year: "2023",
    stack: ["Next.js", "Tailwind", "Framer Motion"],
    icon: "▦",
    accent: "gold",
    github: "https://github.com",
    website: "#",
  },
];

export const friends: Friend[] = [
  {
    name: "Vercel",
    description: "部署最快的前端平台，也是我的网站栖身之所。",
    url: "https://vercel.com",
    category: "Platform",
    rating: 5,
    tags: ["Deploy", "Edge"],
  },
  {
    name: "Dribbble",
    description: "随手翻翻就能找到让界面变好看的灵感。",
    url: "https://dribbble.com",
    category: "Inspiration",
    rating: 4,
    tags: ["Design", "Shot"],
  },
  {
    name: "CSS-Tricks",
    description: "CSS 疑难杂症的长期解决方案供应商。",
    url: "https://css-tricks.com",
    category: "Reading",
    rating: 5,
    tags: ["CSS", "Frontend"],
  },
  {
    name: "Astro",
    description: "内容型网站的新一代框架，静得快，也玩得花。",
    url: "https://astro.build",
    category: "Tooling",
    rating: 4,
    tags: ["Framework", "Static"],
  },
  {
    name: "GitHub",
    description: "像素猫的老家，也是我大部分代码的存放地。",
    url: "https://github.com",
    category: "Platform",
    rating: 5,
    tags: ["Code", "Community"],
  },
  {
    name: "OpenAI",
    description: "正在和我一起写代码、改样式、想段子的重要伙伴。",
    url: "https://openai.com",
    category: "AI",
    rating: 5,
    tags: ["Agent", "LLM"],
  },
];

export const skills = [
  { name: "TypeScript / React", level: 92 },
  { name: "C++ / Systems", level: 78 },
  { name: "UI / Motion Design", level: 86 },
  { name: "Agent / Tooling", level: 74 },
  { name: "Pixel Art", level: 68 },
];

export const socials = [
  { name: "GitHub", href: "https://github.com", icon: "github" },
  { name: "Bilibili", href: "https://bilibili.com", icon: "bilibili" },
  { name: "Email", href: "mailto:changfeng360@gmail.com", icon: "mail" },
] as const;
