# 🚀 VideoConvert - 生产级 SaaS 服务

## 项目概述

VideoConvert 是一个专业的 WebM 转 MP4 在线转换服务，提供完整的 SaaS 功能。

### 核心功能

✅ **视频转换**
- WebM 转 MP4 格式
- 浏览器端转换（FFmpeg.wasm）
- 服务器端转换（FFmpeg）
- 支持最大 500MB 文件

✅ **用户系统**
- 用户注册/登录
- 免费版/专业版/企业版
- 使用次数限制
- 订阅管理

✅ **安全性**
- HTTPS 支持
- 速率限制
- CORS 配置
- 安全头部

✅ **性能优化**
- Redis 缓存
- Gzip 压缩
- 静态文件缓存
- 负载均衡

✅ **监控和日志**
- 健康检查
- 访问日志
- 错误日志
- 性能监控

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <your-repo-url>
cd videoconvert-saas

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env
```

### 2. 本地开发

```bash
# 开发模式
npm run dev

# 生产模式（本地测试）
npm run dev:prod
```

访问: http://localhost:3000

### 3. 生产部署

#### 方式 A: Docker Compose（推荐）

```bash
# 构建并启动
docker-compose -f docker-compose.production.yml up -d

# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 停止服务
docker-compose -f docker-compose.production.yml down
```

#### 方式 B: PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
pm2 logs videoconvert
```

## 项目结构

```
videoconvert-saas/
├── public/                      # 前端文件
│   ├── landing.html            # 落地页
│   ├── index.html              # 主应用（带用户系统）
│   ├── index-browser.html      # 浏览器版转换器
│   ├── choose-version.html     # 版本选择页
│   ├── auth.html               # 登录/注册
│   ├── account.html            # 用户账户
│   ├── subscribe.html          # 订阅页面
│   ├── style.css               # 样式文件
│   ├── script.js               # 主脚本
│   └── script-browser.js       # 浏览器版脚本
├── config/                      # 配置文件
│   └── production.js           # 生产环境配置
├── backup/                      # 备份的测试文件
├── uploads/                     # 上传文件目录
├── output/                      # 输出文件目录
├── temp/                        # 临时文件目录
├── logs/                        # 日志目录
├── server.js                    # 开发服务器
├── server-production.js         # 生产服务器
├── package.json                 # 项目配置
├── .env.example                 # 环境变量示例
├── Dockerfile.production        # 生产 Docker 文件
├── docker-compose.production.yml # 生产 Docker Compose
├── nginx.production.conf        # 生产 Nginx 配置
├── PRODUCTION_DEPLOYMENT.md     # 详细部署指南
└── PRODUCTION_README.md         # 本文档
```

## 功能模块

### 1. 视频转换

#### 浏览器版（推荐）
- 文件: `public/index-browser.html`
- 特点: 完全在浏览器中处理，隐私安全
- 技术: FFmpeg.wasm
- 限制: 最大 500MB

#### 服务器版
- API: `/api/convert`
- 特点: 转换速度更快
- 技术: FFmpeg
- 限制: 最大 500MB

### 2. 用户系统

#### 注册/登录
- 页面: `public/auth.html`
- API: `/api/auth/register`, `/api/auth/login`
- 存储: LocalStorage（简化版）

#### 用户计划

| 计划 | 价格 | 每日转换 | 文件大小 | 功能 |
|------|------|----------|----------|------|
| 免费版 | ¥0/月 | 3次 | 50MB | 基础功能 |
| 专业版 | ¥29/月 | 无限 | 500MB | 批量转换、无广告 |
| 企业版 | ¥199/月 | 无限 | 无限 | API、团队、SLA |

### 3. 订阅管理

- 页面: `public/subscribe.html`
- API: `/api/subscribe`
- 支付: Stripe（需配置）

### 4. 账户管理

- 页面: `public/account.html`
- 功能: 查看使用情况、管理订阅、修改信息

## API 文档

### 健康检查

```http
GET /api/health
```

响应:
```json
{
  "status": "ok",
  "timestamp": "2024-11-27T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### 系统信息

```http
GET /api/info
```

响应:
```json
{
  "version": "1.0.0",
  "features": {
    "browserConversion": true,
    "serverConversion": true,
    "maxFileSize": "500MB"
  }
}
```

### 视频转换

```http
POST /api/convert
Content-Type: multipart/form-data

video: <file>
```

响应:
```json
{
  "success": true,
  "message": "转换成功",
  "downloadUrl": "/api/download/filename.mp4",
  "filename": "filename.mp4"
}
```

### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 订阅

```http
POST /api/subscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "plan": "pro"
}
```

## 环境变量

### 必需配置

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secret_here
SESSION_SECRET=your_secret_here
```

### 可选配置

```env
# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# 支付
PAYMENT_PUBLIC_KEY=pk_live_xxxxx
PAYMENT_SECRET_KEY=sk_live_xxxxx

# 邮件
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_password

# 监控
MONITORING_ENABLED=true
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 部署清单

### 部署前检查

- [ ] 配置环境变量（`.env`）
- [ ] 安装 FFmpeg
- [ ] 配置 SSL 证书
- [ ] 设置域名 DNS
- [ ] 配置防火墙
- [ ] 准备数据库（如需要）
- [ ] 配置 Redis（推荐）
- [ ] 设置监控（推荐）

### 部署步骤

1. **服务器准备**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # 安装 FFmpeg
   sudo apt install -y ffmpeg
   
   # 安装 Docker（可选）
   curl -fsSL https://get.docker.com | sh
   ```

2. **部署应用**
   ```bash
   # 克隆代码
   git clone <your-repo-url>
   cd videoconvert-saas
   
   # 安装依赖
   npm install --production
   
   # 配置环境
   cp .env.example .env
   nano .env
   
   # 启动服务
   npm run pm2:start
   ```

3. **配置 Nginx**
   ```bash
   # 复制配置
   sudo cp nginx.production.conf /etc/nginx/sites-available/videoconvert
   sudo ln -s /etc/nginx/sites-available/videoconvert /etc/nginx/sites-enabled/
   
   # 测试配置
   sudo nginx -t
   
   # 重启 Nginx
   sudo systemctl restart nginx
   ```

4. **配置 SSL**
   ```bash
   # 安装 Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   ```

## 监控和维护

### 日志查看

```bash
# PM2 日志
pm2 logs videoconvert

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 应用日志
tail -f logs/app.log
```

### 性能监控

```bash
# PM2 监控
pm2 monit

# 系统资源
htop

# 磁盘使用
df -h
```

### 备份

```bash
# 备份数据库
pg_dump videoconvert > backup.sql

# 备份文件
tar -czf backup.tar.gz uploads/ output/

# 备份配置
cp .env .env.backup
```

## 故障排查

### 应用无法启动

1. 检查端口占用: `sudo lsof -i :3000`
2. 检查日志: `pm2 logs videoconvert`
3. 检查环境变量: `pm2 env 0`

### 转换失败

1. 检查 FFmpeg: `ffmpeg -version`
2. 检查磁盘空间: `df -h`
3. 检查文件权限: `ls -la uploads/ output/`

### 内存泄漏

1. 监控内存: `pm2 monit`
2. 设置内存限制: `pm2 start --max-memory-restart 1G`
3. 重启应用: `pm2 restart videoconvert`

## 性能优化

### 1. 启用 Redis 缓存

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
```

### 2. 使用 CDN

```env
CDN_ENABLED=true
CDN_URL=https://cdn.your-domain.com
```

### 3. 启用集群模式

```bash
pm2 start server-production.js -i max
```

### 4. 优化 Nginx

- 启用 Gzip 压缩
- 配置静态文件缓存
- 使用 HTTP/2

## 安全建议

1. **使用 HTTPS**
2. **定期更新依赖**: `npm audit fix`
3. **限制文件权限**: `chmod 600 .env`
4. **启用防火墙**: `sudo ufw enable`
5. **定期备份数据**
6. **监控异常访问**
7. **使用强密码**
8. **启用速率限制**

## 扩展功能

### 计划中的功能

- [ ] 批量转换
- [ ] 更多格式支持
- [ ] API 接口
- [ ] 团队协作
- [ ] 转换历史
- [ ] 云存储集成
- [ ] 移动应用

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **视频处理**: FFmpeg + FFmpeg.wasm
- **缓存**: Redis
- **反向代理**: Nginx
- **容器化**: Docker
- **进程管理**: PM2

## 支持

- 📧 Email: support@videoconvert.com
- 📚 文档: https://docs.videoconvert.com
- 🐛 问题: https://github.com/your-repo/issues
- 💬 社区: https://community.videoconvert.com

## 许可证

MIT License

---

**VideoConvert - 让视频转换更简单** 🎬
