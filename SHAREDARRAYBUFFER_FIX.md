# SharedArrayBuffer 错误修复指南

## 错误信息

```
SharedArrayBuffer is not defined
```

## 问题原因

FFmpeg.wasm 0.11.x 版本需要 `SharedArrayBuffer` 支持，这要求：

1. **HTTPS 连接**（或 localhost）
2. **正确的 HTTP 头部**：
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`

## 🚨 常见场景

### 场景 1: 通过 IP 地址访问（如 39.108.89.255）

**问题**: 浏览器安全策略限制，通过 IP 地址访问时 SharedArrayBuffer 可能不可用

**解决方案**:

#### 方案 A: 使用兼容版（推荐）

访问不需要 SharedArrayBuffer 的版本：
```
http://39.108.89.255:3000/converter-no-threads.html
```

这个版本使用 FFmpeg.wasm 0.10.x，不需要 SharedArrayBuffer。

#### 方案 B: 使用 HTTPS

1. 配置 SSL 证书
2. 通过 HTTPS 访问

#### 方案 C: 使用域名

1. 配置域名指向服务器
2. 配置 SSL 证书
3. 通过 HTTPS + 域名访问

### 场景 2: 本地开发（localhost）

**应该可以正常工作**，因为 localhost 被浏览器视为安全上下文。

如果仍然有问题，检查：
1. 服务器是否正确设置了 COOP/COEP 头部
2. 浏览器是否支持 SharedArrayBuffer

### 场景 3: HTTP 连接

**不支持 SharedArrayBuffer**

**解决方案**: 使用兼容版或升级到 HTTPS

## ✅ 解决方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **兼容版** | ✅ 无需配置<br>✅ 支持所有环境<br>✅ 立即可用 | ⚠️ 性能稍慢<br>⚠️ 不支持多线程 | 生产环境<br>IP 访问<br>HTTP 连接 |
| **标准版** | ✅ 性能更好<br>✅ 支持多线程 | ❌ 需要 HTTPS<br>❌ 需要正确配置 | HTTPS 环境<br>localhost 开发 |

## 🔧 快速修复

### 1. 使用兼容版（最简单）

直接访问：
```
http://your-server:3000/converter-no-threads.html
```

### 2. 检查服务器配置

确保 `server.js` 中有正确的头部：

```javascript
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
```

### 3. 重启服务器

```bash
# 停止服务器
Ctrl+C

# 重新启动
npm start
```

### 4. 清除浏览器缓存

按 `Ctrl+Shift+Delete`（Mac: `Cmd+Shift+Delete`）清除缓存

## 🌐 生产环境部署

### 使用 Nginx 反向代理

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # 添加必要的头部
        add_header Cross-Origin-Opener-Policy same-origin;
        add_header Cross-Origin-Embedder-Policy require-corp;
        add_header Cross-Origin-Resource-Policy cross-origin;
    }
}
```

### 使用 Docker + Nginx

查看 `DEPLOYMENT.md` 获取完整的 Docker 部署指南。

## 📊 版本对比

### FFmpeg.wasm 0.11.x（标准版）

**使用文件**:
- `public/index.html`
- `public/index-browser.html`

**要求**:
- ✅ SharedArrayBuffer 支持
- ✅ HTTPS 或 localhost
- ✅ COOP/COEP 头部

**优点**:
- 🚀 多线程支持
- 🚀 性能更好
- 🚀 转换更快

### FFmpeg.wasm 0.10.x（兼容版）

**使用文件**:
- `public/converter-no-threads.html`

**要求**:
- ✅ 任何环境都可用
- ✅ 不需要特殊配置

**优点**:
- ✅ 兼容性好
- ✅ 配置简单
- ✅ 适合生产环境

**缺点**:
- ⚠️ 单线程
- ⚠️ 性能稍慢

## 🧪 测试方法

### 测试 1: 检查 SharedArrayBuffer

在浏览器控制台运行：
```javascript
console.log(typeof SharedArrayBuffer);
// 应该输出 "function"，如果是 "undefined" 则不支持
```

### 测试 2: 检查 HTTP 头部

在浏览器控制台的 Network 标签中：
1. 刷新页面
2. 选择任意请求
3. 查看 Response Headers
4. 确认有 `cross-origin-opener-policy` 和 `cross-origin-embedder-policy`

### 测试 3: 使用兼容版

访问：
```
http://your-server:3000/converter-no-threads.html
```

如果兼容版可以工作，说明问题确实是 SharedArrayBuffer。

## 💡 推荐方案

### 开发环境
使用 localhost + 标准版：
```
http://localhost:3000/index-browser.html
```

### 生产环境（有 HTTPS）
使用域名 + HTTPS + 标准版：
```
https://your-domain.com/index-browser.html
```

### 生产环境（无 HTTPS）
使用兼容版：
```
http://your-server:3000/converter-no-threads.html
```

### 临时测试（IP 访问）
使用兼容版：
```
http://39.108.89.255:3000/converter-no-threads.html
```

## 🔍 调试步骤

1. **打开浏览器控制台**（F12）
2. **查看 Console 标签**，检查错误信息
3. **查看 Network 标签**，检查 HTTP 头部
4. **运行测试命令**：
   ```javascript
   console.log('SharedArrayBuffer:', typeof SharedArrayBuffer);
   console.log('HTTPS:', location.protocol === 'https:');
   console.log('Localhost:', location.hostname === 'localhost');
   ```

## 📚 相关文档

- [MDN: SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [FFmpeg.wasm 文档](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [COOP/COEP 说明](https://web.dev/coop-coep/)

---

**总结**: 如果遇到 SharedArrayBuffer 错误，最简单的解决方案是使用兼容版 `converter-no-threads.html`。
