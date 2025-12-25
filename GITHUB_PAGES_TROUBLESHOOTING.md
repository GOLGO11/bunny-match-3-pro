# GitHub Pages 部署问题排查指南

## 🔍 问题诊断步骤

### 1. 检查 GitHub Pages 设置

1. 进入你的仓库：`https://github.com/YOUR_USERNAME/bunny-match-3-pro`
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 确认以下设置：
   - **Source**: 应该选择 **"GitHub Actions"**（不是 "Deploy from a branch"）
   - 如果显示 "Your site is ready to be published"，说明设置正确
   - 如果显示其他信息，按照提示操作

### 2. 检查 GitHub Actions 工作流

1. 进入仓库的 **Actions** 标签页
2. 查看是否有 "Deploy to GitHub Pages" 工作流
3. 点击工作流查看运行状态：
   - ✅ 绿色 = 成功
   - ❌ 红色 = 失败（点击查看错误日志）
   - 🟡 黄色 = 进行中

### 3. 常见错误及解决方案

#### 错误 1: "Workflow run failed" 或构建失败

**可能原因：**
- 依赖安装失败
- 构建脚本错误
- Node.js 版本不兼容

**解决方案：**
1. 在 Actions 中点击失败的运行
2. 查看错误日志，找到具体错误信息
3. 常见修复：
   ```bash
   # 本地测试构建
   npm install
   npm run build
   ```

#### 错误 2: "Permission denied" 或权限错误

**解决方案：**
1. 进入仓库 **Settings** > **Actions** > **General**
2. 在 "Workflow permissions" 部分：
   - 选择 **"Read and write permissions"**
   - 勾选 **"Allow GitHub Actions to create and approve pull requests"**
3. 点击 **Save**

#### 错误 3: 页面显示 404 或空白

**可能原因：**
- `base` 路径配置错误
- 资源路径问题

**解决方案：**
1. 确认仓库名是 `bunny-match-3-pro`
2. 检查 `vite.config.ts` 中的配置：
   ```typescript
   const repoName = 'bunny-match-3-pro'; // 确保这里正确
   ```
3. 访问地址应该是：
   ```
   https://YOUR_USERNAME.github.io/bunny-match-3-pro/
   ```
   注意末尾的斜杠 `/`

#### 错误 4: "No workflow file found"

**解决方案：**
1. 确认 `.github/workflows/deploy.yml` 文件存在
2. 确认文件已提交到仓库：
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Pages deployment workflow"
   git push
   ```

#### 错误 5: 分支名不匹配

**解决方案：**
1. 检查你的主分支名：
   ```bash
   git branch
   ```
2. 如果是 `master` 而不是 `main`，需要修改 `.github/workflows/deploy.yml`：
   ```yaml
   on:
     push:
       branches:
         - master  # 改为你的主分支名
   ```

### 4. 手动触发部署

如果自动部署没有触发，可以手动触发：

1. 进入仓库的 **Actions** 标签页
2. 选择 **"Deploy to GitHub Pages"** 工作流
3. 点击 **"Run workflow"** 按钮
4. 选择分支（通常是 `main`）
5. 点击 **"Run workflow"**

### 5. 验证部署

部署成功后：

1. 等待 1-2 分钟让 GitHub Pages 更新
2. 访问你的网站：
   ```
   https://YOUR_USERNAME.github.io/bunny-match-3-pro/
   ```
3. 如果页面正常显示，说明部署成功
4. 如果还是有问题，按 F12 打开浏览器控制台查看错误

## 🔧 快速修复命令

如果以上步骤都检查过了还是不行，尝试以下命令：

```bash
# 1. 确保所有文件已提交
git add .
git commit -m "Fix GitHub Pages deployment"
git push

# 2. 检查分支名
git branch -a

# 3. 确认工作流文件存在
ls -la .github/workflows/

# 4. 本地测试构建
npm install
npm run build
ls -la dist/  # 确认 dist 目录有内容
```

## 📋 检查清单

在提交问题前，请确认：

- [ ] 仓库是 Public（免费版 GitHub Pages 需要公开仓库）
- [ ] GitHub Pages 设置中选择了 "GitHub Actions" 作为源
- [ ] `.github/workflows/deploy.yml` 文件存在且已提交
- [ ] `vite.config.ts` 中的仓库名正确（`bunny-match-3-pro`）
- [ ] 主分支名与工作流配置匹配（`main` 或 `master`）
- [ ] 本地构建成功（`npm run build` 无错误）
- [ ] 所有代码已推送到 GitHub

## 🆘 仍然无法解决？

如果以上步骤都无法解决问题，请提供以下信息：

1. GitHub Actions 的错误日志（截图或复制错误信息）
2. 浏览器控制台的错误信息（F12 > Console）
3. 仓库 URL
4. 你执行的具体步骤

## 📚 相关链接

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)

