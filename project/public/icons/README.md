# PWA 图标文件

这个目录包含PWA应用的各种尺寸图标文件。

## 所需图标尺寸

根据 `manifest.json` 的配置，需要以下尺寸的图标：

- `icon-72.png` - 72x72px
- `icon-96.png` - 96x96px  
- `icon-128.png` - 128x128px
- `icon-144.png` - 144x144px
- `icon-152.png` - 152x152px
- `icon-192.png` - 192x192px
- `icon-384.png` - 384x384px
- `icon-512.png` - 512x512px

## 设计要求

- **主题色彩**：使用应用的主色调（#6366f1 蓝紫色）
- **背景**：建议使用白色或透明背景
- **图标内容**：可以使用蜗牛🐌图标或二维码📱相关元素
- **格式**：PNG格式，支持透明背景
- **风格**：简洁、现代、易识别

## 用途说明

- **72-152px**：主要用于iOS设备的主屏幕图标
- **192px**：Android设备的主屏幕图标
- **512px**：应用商店展示和启动画面
- **maskable图标**：支持Android自适应图标

## 生成建议

可以使用以下工具生成不同尺寸的图标：

1. **在线工具**：
   - PWA Builder (https://www.pwabuilder.com/)
   - Favicon Generator (https://realfavicongenerator.net/)

2. **设计软件**：
   - Figma
   - Adobe Illustrator
   - Sketch

## 临时解决方案

在正式图标制作完成前，可以：
1. 使用 Vite 默认的图标作为临时图标
2. 复制 `/vite.svg` 并转换为不同尺寸的PNG文件
3. 或者使用简单的文字图标

## 注意事项

- 确保所有图标文件都存在，避免404错误
- 图标应该在不同背景下都清晰可见
- 考虑在不同设备和主题下的显示效果
