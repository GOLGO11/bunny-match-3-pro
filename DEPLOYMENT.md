# 多平台部署指南

本游戏支持部署到以下平台：
- **Poki** - 全球最大的HTML5游戏平台
- **CrazyGames** - 热门游戏平台
- **GameDistribution (Azerion)** - 游戏分发平台
- **Telegram Games** - Telegram 小游戏平台
- **独立部署** - 可独立运行在任何Web服务器

## 📦 构建项目

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建后的文件在 dist/ 目录
```

## 🎮 平台部署指南

### 1. Poki 平台

#### 步骤：
1. 注册 [Poki 开发者账号](https://developers.poki.com/)
2. 创建新游戏项目
3. 上传游戏文件到 Poki 平台
4. 在 `index.html` 中添加 Poki SDK：

```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

#### 要求：
- 游戏必须响应式设计（已支持）
- 需要实现 `gameplayStart()` 和 `gameplayStop()`（已实现）
- 支持广告展示（已实现）
- 游戏尺寸建议：至少 800x600

#### 注意事项：
- Poki 会自动检测 SDK 并初始化
- 游戏会在 Poki 的 iframe 中运行
- 广告由 Poki 自动管理

---

### 2. CrazyGames 平台

#### 步骤：
1. 注册 [CrazyGames 开发者账号](https://developer.crazygames.com/)
2. 创建新游戏
3. 上传游戏文件
4. 在 `index.html` 中添加 CrazyGames SDK：

```html
<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>
```

#### 要求：
- 游戏必须全屏显示（已支持）
- 需要实现 `gameplayStart()` 和 `gameplayStop()`（已实现）
- 支持广告展示（已实现）

#### 注意事项：
- CrazyGames SDK 会自动初始化
- 广告会在游戏结束时自动显示
- 支持 `happyTime()` 功能（高分时刻）

---

### 3. GameDistribution (Azerion) 平台

#### 步骤：
1. 注册 [Azerion 开发者账号](https://www.azerion.com/)
2. 在 GameDistribution 平台创建游戏
3. 上传游戏文件
4. 在 `index.html` 中添加 Azerion SDK：

```html
<script src="https://html5.api.gameads.io/sdk/v1/gd-sdk.js"></script>
```

#### 要求：
- 游戏必须响应式（已支持）
- 需要实现广告接口（已实现）
- 支持游戏状态管理（已实现）

#### 注意事项：
- SDK 会自动检测并初始化
- 广告类型：preroll, midroll, rewarded

---

### 4. Telegram Games 平台

#### 步骤：
1. 创建 Telegram Bot（通过 [@BotFather](https://t.me/botfather)）
2. 创建游戏（通过 BotFather 的 `/newgame` 命令）
3. 上传游戏到服务器（需要 HTTPS）
4. 在 `index.html` 中添加 Telegram SDK：

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

#### 要求：
- 游戏必须支持移动端（已支持）
- 需要 HTTPS 服务器
- 游戏尺寸自适应（已支持）

#### 注意事项：
- Telegram Web App API 会自动初始化
- 可以通过 `window.Telegram.WebApp` 访问用户信息
- 不支持直接广告，但可以通过其他方式实现

---

### 5. 独立部署

#### 步骤：
1. 构建项目：`npm run build`
2. 将 `dist/` 目录内容上传到任何 Web 服务器
3. 确保服务器支持静态文件服务

#### 要求：
- 无需额外 SDK
- 可以部署到任何静态托管服务（GitHub Pages, Netlify, Vercel 等）

---

## 🔧 平台特定配置

### 修改 index.html 加载 SDK

根据不同平台，取消注释相应的 SDK 脚本：

```html
<!-- Poki SDK -->
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>

<!-- CrazyGames SDK -->
<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>

<!-- Azerion SDK -->
<script src="https://html5.api.gameads.io/sdk/v1/gd-sdk.js"></script>

<!-- Telegram SDK -->
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 环境变量（可选）

可以创建 `.env` 文件来配置平台特定设置：

```env
# 平台类型（可选，通常自动检测）
VITE_PLATFORM=poki

# 其他配置...
```

---

## 📋 平台功能对比

| 功能 | Poki | CrazyGames | Azerion | Telegram | Standalone |
|------|------|------------|---------|----------|------------|
| 加载广告 | ✅ | ❌ | ✅ | ❌ | 模拟 |
| 插屏广告 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 激励广告 | ✅ | ✅ | ✅ | ❌ | 占位符 |
| 游戏状态 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 快乐时光 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 加载进度 | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 快速部署脚本

### 为不同平台构建

可以创建不同的构建脚本：

```json
{
  "scripts": {
    "build": "vite build",
    "build:poki": "vite build --mode poki",
    "build:crazygames": "vite build --mode crazygames",
    "build:azerion": "vite build --mode azerion",
    "build:telegram": "vite build --mode telegram"
  }
}
```

---

## 📝 检查清单

部署前请确认：

- [ ] 游戏在所有平台测试通过
- [ ] 广告功能正常工作
- [ ] 移动端响应式正常
- [ ] 音频播放正常（注意浏览器自动播放限制）
- [ ] 游戏性能良好（60fps）
- [ ] 没有控制台错误
- [ ] 游戏尺寸符合平台要求
- [ ] 所有资源文件正确加载

---

## 🐛 常见问题

### Q: 如何测试不同平台？
A: 可以在浏览器控制台手动注入平台 SDK 对象来模拟：

```javascript
// 模拟 Poki
window.poki = {
  init: () => Promise.resolve(),
  gameLoadingStart: () => Promise.resolve(),
  commercialBreak: () => Promise.resolve(),
  rewardedBreak: () => Promise.resolve(true),
  gameplayStart: () => {},
  gameplayStop: () => {}
};
```

### Q: 广告不显示怎么办？
A: 
1. 检查 SDK 是否正确加载
2. 检查平台账号是否已激活
3. 查看浏览器控制台错误信息
4. 确认游戏已通过平台审核

### Q: 如何调试平台适配？
A: 查看浏览器控制台，所有平台操作都会输出日志，格式为 `[Platform] ...`

---

## 📚 相关链接

- [Poki 开发者文档](https://developers.poki.com/)
- [CrazyGames 开发者文档](https://developer.crazygames.com/)
- [Azerion 开发者文档](https://www.azerion.com/developers/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web App API](https://core.telegram.org/bots/webapps)

---

## 💡 提示

1. **测试环境**：建议先在独立模式下测试，确认功能正常后再部署到平台
2. **性能优化**：确保游戏加载速度快，首次渲染时间短
3. **用户体验**：注意音频自动播放限制，需要用户交互后才能播放
4. **兼容性**：确保游戏在现代浏览器中正常运行

