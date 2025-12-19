
# PinkImg - 全能图片在线编辑工具

 PinkImg 是一款受 iLoveIMG 启发，采用 React + TailwindCSS 开发的批量图片编辑平台。它拥有一整套粉色主题的 UI 界面，提供包括压缩、调整大小、裁剪、转换格式、EXIF 编辑、AI 增强及隐私遮盖等核心功能。

## 👨‍💻 作者信息
- **抖音**: 沪上码仔AI
- **GitHub**: [zyb0408/PinkImg](https://github.com/zyb0408/PinkImg.git)

## 🚀 核心功能
- **AI 工具**: 利用 Google Gemini 2.5/3 系列模型实现图片画质无损提升及一键去背景。
- **隐私保护**: 本地 Canvas 驱动的高精度马赛克、圆点像素化及运动模糊遮盖。
- **批量处理**: 所有基础编辑功能（压缩、转换、旋转等）均支持多图并行处理。
- **完全本地**: 除 AI 功能需调用 API 外，其余编辑均在浏览器本地完成，保障用户隐私。

## 🛠️ 部署指南

该项目是一个基于现代前端工具链构建的静态 Web 应用。

### 1. 环境准备
- **Node.js**: 推荐版本 v18.0 或更高。
- **包管理器**: `npm` 或 `yarn`。

### 2. 克隆项目
```bash
git clone https://github.com/zyb0408/PinkImg.git
cd PinkImg
```

### 3. 安装依赖
```bash
npm install
```

### 4. 本地开发
启动开发服务器，支持热更新。
```bash
npm run dev
```

### 5. 构建与生产部署
将项目编译为静态文件，输出到 `dist` 目录。
```bash
npm run build
```
编译完成后，您可以将 `dist` 目录下的所有文件上传到任何静态托管服务（如 GitHub Pages, Vercel, Netlify 或您的 Nginx 服务器）。

## 🔑 关于 API Key
AI 功能（提升画质和去背景）需要 Google Gemini API Key。
- 在应用运行后，点击右上角的 **设置 (Settings)** 图标。
- 手动输入您的 API Key 并点击保存。
- 密钥将保存在浏览器的 `LocalStorage` 中，不会泄露给任何第三方。

---
感谢使用 PinkImg！如有问题欢迎在 GitHub 提交 Issue。
