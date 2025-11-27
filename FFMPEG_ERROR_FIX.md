# FFmpeg.wasm 错误修复指南

## 错误: "ffmpeg.wasm is not ready"

### 问题原因

这个错误表示 FFmpeg.wasm 还没有完全加载就尝试使用了。可能的原因：

1. **网络慢** - FFmpeg.wasm 需要下载约 25MB
2. **用户点击太快** - 在加载完成前就点击了转换按钮
3. **加载失败** - 网络中断或 CDN 访问问题
4. **浏览器兼容性** - 浏览器不支持 WebAssembly

## ✅ 已实现的修复

### 1. 加载状态验证

```javascript
// 验证 FFmpeg 是否真的准备好了
if (!ffmpeg.isLoaded || !ffmpeg.isLoaded()) {
    throw new Error('FFmpeg 未完全加载，请刷新页面重试');
}

// 验证文件系统是否可用
if (!ffmpeg.FS) {
    throw new Error('FFmpeg 文件系统不可用，请刷新页面重试');
}
```

### 2. 防止重复点击

```javascript
let isConverting = false;

if (isConverting) {
    alert('转换正在进行中，请稍候...');
    return;
}

// 转换开始时
isConverting = true;
convertBtn.disabled = true;
convertBtn.style.opacity = '0.6';
convertBtn.style.cursor = 'not-allowed';
```

### 3. 多种转换方法

尝试多种转换方法，提高成功率：
- 快速转换（直接复制流）
- 标准转换（快速编码）
- 兼容转换（高质量编码）

### 4. 错误重试机制

```javascript
try {
    // 转换逻辑
} catch (error) {
    // 友好的错误提示
    // 重置 FFmpeg 状态
    ffmpegLoaded = false;
    ffmpeg = null;
} finally {
    // 恢复按钮状态
    isConverting = false;
    convertBtn.disabled = false;
}
```

### 5. 预加载机制

页面加载 3 秒后自动开始预加载 FFmpeg，提升用户体验：

```javascript
window.addEventListener('load', () => {
    setTimeout(() => {
        preloadFFmpeg();
    }, 3000);
});
```

### 6. 详细日志记录

添加 logger 捕获 FFmpeg 错误信息，便于调试。

## 🔧 用户解决方案

### 方案 1: 刷新页面重试

最简单的方法：
1. 刷新页面（Ctrl+R 或 Cmd+R）
2. 等待页面完全加载
3. 选择文件
4. 点击"开始转换"
5. 等待"正在加载转换工具..."完成

### 方案 2: 清除缓存

如果刷新无效：
1. 按 Ctrl+Shift+Delete（Mac: Cmd+Shift+Delete）
2. 清除缓存和 Cookie
3. 刷新页面
4. 重新尝试

### 方案 3: 检查网络

```bash
# 测试 CDN 连接
curl -I https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.wasm
```

如果无法访问，可能需要：
- 使用 VPN
- 更换网络
- 等待网络恢复

### 方案 4: 使用其他浏览器

推荐浏览器（按优先级）：
1. Chrome（最佳）
2. Edge
3. Firefox
4. Safari（可能有兼容性问题）

### 方案 5: 使用诊断工具

访问诊断页面检查问题：
http://localhost:3000/diagnose.html

## 🎯 正确的使用流程

1. **打开页面** - 等待页面完全加载
2. **选择文件** - 选择 WebM 文件
3. **点击转换** - 点击"开始转换"按钮
4. **等待加载** - 首次使用会显示"正在加载转换工具..."（30秒-2分钟）
5. **等待转换** - 显示转换进度
6. **下载文件** - 转换完成后下载

## ⚠️ 注意事项

### 首次使用

- 需要下载约 25MB 的 FFmpeg.wasm 文件
- 下载时间取决于网络速度（30秒-2分钟）
- 下载完成后会缓存，之后使用会很快
- 请耐心等待，不要重复点击

### 网络要求

- 需要稳定的网络连接
- 能够访问 unpkg.com CDN
- 如果在中国大陆，可能需要 VPN

### 浏览器要求

- 支持 WebAssembly
- 支持 SharedArrayBuffer
- 推荐使用最新版本的 Chrome 或 Edge

## 🔍 调试步骤

### 1. 打开浏览器控制台

按 F12，查看 Console 标签页

### 2. 查看错误信息

查找以下关键词：
- "load failed"
- "network error"
- "timeout"
- "not ready"

### 3. 检查网络请求

切换到 Network 标签页，查看：
- ffmpeg.min.js 是否加载成功
- ffmpeg-core.js 是否加载成功
- ffmpeg-core.wasm 是否加载成功

### 4. 查看日志

页面上的日志区域会显示详细的加载和转换过程。

## 💡 预防措施

### 已实现的优化

1. ✅ 自动预加载 FFmpeg（页面加载 3 秒后）
2. ✅ 加载状态验证
3. ✅ 防止重复点击
4. ✅ 按钮禁用保护
5. ✅ 详细的错误提示
6. ✅ 加载失败自动重置

### 用户建议

1. **首次使用** - 耐心等待加载完成
2. **网络不稳定** - 使用稳定的网络环境
3. **频繁使用** - 不要清除浏览器缓存
4. **遇到问题** - 刷新页面重试

## 🚀 快速解决

如果遇到 "not ready" 错误：

```
1. 刷新页面（Ctrl+R）
2. 等待 5 秒
3. 重新选择文件
4. 点击转换
5. 耐心等待加载提示消失
```

---

**最重要**: 首次使用时，看到"正在加载转换工具..."时，请耐心等待！
