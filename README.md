# 🐰 兔兔爱叫连连看

一个可爱的三消类连连看 H5 游戏，支持多平台分发。

## ✨ 特性

- 🎮 经典三消玩法，拖拽交换相邻兔子
- 🎯 三种难度：简单、中等、困难
- 🎨 精美的视觉效果和动画
- 🔊 音效和背景音乐
- 🌸 樱花粒子特效
- 📱 响应式设计，支持移动端
- 🚀 多平台支持：Poki, CrazyGames, Azerion, Telegram

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 📦 多平台部署

本游戏支持部署到以下平台：

- **Poki** - 全球最大的HTML5游戏平台
- **CrazyGames** - 热门游戏平台  
- **GameDistribution (Azerion)** - 游戏分发平台
- **Telegram Games** - Telegram 小游戏平台
- **独立部署** - 可独立运行在任何Web服务器

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎮 游戏玩法

1. 拖拽相邻的兔子进行交换
2. 形成三连或更多相同兔子即可消除
3. 连续消除可获得连击奖励
4. 没有可用解法时游戏结束

## 🛠️ 技术栈

- **React 19** + **TypeScript**
- **Vite** - 构建工具
- **Canvas 2D** - 游戏渲染
- **Tailwind CSS** - 样式框架

## 📁 项目结构

```
├── components/          # React组件
│   ├── GameBoard.tsx   # 游戏画布
│   └── UIOverlay.tsx   # UI覆盖层
├── services/            # 核心服务
│   ├── GameEngine.ts   # 游戏逻辑引擎
│   ├── Renderer.ts     # Canvas渲染器
│   ├── InputHandler.ts # 输入处理
│   ├── AudioManager.ts # 音频管理
│   ├── AdsManager.ts   # 广告管理
│   └── PlatformAdapter.ts # 平台适配器
├── constants.ts        # 游戏常量
├── types.ts           # TypeScript类型
└── public/            # 静态资源
```

## 📝 开发说明

### 难度系统

游戏支持三种难度：
- **简单**：使用4种兔子类型，更容易匹配
- **中等**：使用6种兔子类型，平衡难度
- **困难**：使用8种兔子类型，挑战性高

### 平台适配

游戏会自动检测运行平台并加载相应的SDK：
- 自动平台检测
- 统一的广告接口
- 平台特定功能支持

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有贡献者和测试者！
