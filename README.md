# 🐌 蜗牛自然拼读卡牌桌游

一个基于React + TypeScript的智能二维码识别英语发音学习桌游应用。

## ✨ 功能特色

- 📷 **智能扫描** - 摄像头识别QR码，自动播放对应英语发音
- 🔊 **高质量音频** - 368个专业录制的英语单词发音
- 📱 **PWA支持** - 可安装到手机桌面，支持离线使用
- 🎯 **三大功能** - 指导说明、示范视频、音素示范
- 🌐 **跨平台兼容** - 支持iOS、Android、桌面浏览器

## 🚀 快速开始

### 安装依赖
```bash
cd project
npm install
```

### 开发运行
```bash
npm run dev
```

### 构建部署
```bash
npm run build
```

## 📁 项目结构

```
project/
├── src/                    # React源代码
├── public/
│   ├── audio/             # 音频文件
│   │   ├── L1audio/       # Level 1 (130个文件)
│   │   ├── L2audio/       # Level 2 (124个文件)
│   │   └── L3audio/       # Level 3 (114个文件)
│   └── icons/             # 图标资源
├── package.json           # 项目配置
└── vite.config.ts         # Vite配置
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **PWA**: Service Worker + Manifest
- **QR识别**: jsQR
- **音频**: HTML5 Audio API

## 📱 使用说明

1. 允许摄像头权限并启用声音
2. 将二维码对准摄像头中央
3. 系统自动识别并播放发音

## 🌟 特色功能

- **离线使用** - 音频文件自动缓存，无网络也能使用
- **快速切换** - 智能防重叠播放，快速扫描不同卡片
- **响应式设计** - 完美适配手机、平板、电脑
- **教育友好** - 专为家庭和教育机构设计

## 📄 开源协议

MIT License

---

**蜗牛叔叔出品** 🐌 让英语学习更有趣！
