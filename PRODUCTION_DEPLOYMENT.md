# 🚀 VideoConvert 生产环境部署指南

## 目录
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [部署方式](#部署方式)
- [监控和维护](#监控和维护)
- [安全最佳实践](#安全最佳实践)

## 系统要求

### 硬件要求
- **CPU**: 2核心以上
- **内存**: 4GB 以上
- **存储**: 20GB 以上
- **网络**: 稳定的互联网连接

### 软件要求
- **Node.js**: 16.x 或更高版本
- **FFmpeg**: 4.x 或更高版本
- **Nginx**: 1.18 或更高版本（可选，用于反向代理）
- **Redis**: 6.x 或更高版本（可选，用于会话管理）
- **PM2**: 5.x 或更高版本（推荐用于进程管理）

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd videoconvert-saas
```

### 2. 安装依赖

```bash
npm install --production
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env  # 编辑配置文件
```

### 4. 启动服务

```bash
# 开发环境
npm run dev:prod

# 生产环境（使用 PM2）
npm run pm2:start
```

## 环境配置

### 必需配置

```env
# 服务器
PORT=3000
NODE_ENV=production

# 安全
JWT_SECRET=your_strong_random_secret_here
SESSION_SECRET=your_strong_random_secret_here
```

### 可选配置

```env
# 数据库（如果使用）
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videoconvert
DB_USER=admin
DB_PASSWORD=secure_password

# Redis（推荐用于生产环境）
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379

# 邮件服务
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# 支付（Stripe）
PAYMENT_PUBLIC_KEY=pk_live_xxxxx
PAYMENT_SECRET_KEY=sk_live_xxxxx
```

## 部署方式

### 方式 1: 使用 PM2（推荐）

PM2 是一个生产级的 Node.js 进程管理器。

#### 安装 PM2

```bash
npm install -g pm2
```

#### 启动应用

```bash
# 启动
pm2 start server-production.js --name videoconvert

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs videoconvert

# 重启
pm2 restart videoconvert

# 停止
pm2 stop videoconvert
```

#### PM2 配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'videoconvert',
    script: './server-production.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

启动：
```bash
pm2 start ecosystem.config.js
```

### 方式 2: 使用 Docker

#### 构建镜像

```bash
docker build -t videoconvert:latest .
```

#### 运行容器

```bash
docker run -d \
  --name videoconvert \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/output:/app/output \
  --env-file .env \
  --restart unless-stopped \
  videoconvert:latest
```

#### 使用 Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 方式 3: 使用 Systemd

创建 `/etc/systemd/system/videoconvert.service`:

```ini
[Unit]
Description=VideoConvert Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/videoconvert
ExecStart=/usr/bin/node server-production.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable videoconvert
sudo systemctl start videoconvert
sudo systemctl status videoconvert
```

## Nginx 反向代理

### 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 配置 Nginx

创建 `/etc/nginx/sites-available/videoconvert`:

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name videoconvert.com www.videoconvert.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name videoconvert.com www.videoconvert.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/videoconvert.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videoconvert.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # FFmpeg.wasm 需要的头部
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Resource-Policy "cross-origin" always;

    # 文件上传大小限制
    client_max_body_size 500M;

    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|wasm)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 日志
    access_log /var/log/nginx/videoconvert_access.log;
    error_log /var/log/nginx/videoconvert_error.log;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/videoconvert /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 获取 SSL 证书（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d videoconvert.com -d www.videoconvert.com
```

## 监控和维护

### 日志管理

#### 查看应用日志

```bash
# PM2 日志
pm2 logs videoconvert

# 系统日志
sudo journalctl -u videoconvert -f

# Nginx 日志
sudo tail -f /var/log/nginx/videoconvert_access.log
sudo tail -f /var/log/nginx/videoconvert_error.log
```

#### 日志轮转

创建 `/etc/logrotate.d/videoconvert`:

```
/var/www/videoconvert/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 性能监控

#### 使用 PM2 监控

```bash
pm2 monit
```

#### 系统资源监控

```bash
# CPU 和内存
htop

# 磁盘使用
df -h

# 网络连接
netstat -tulpn | grep :3000
```

### 备份策略

#### 数据库备份

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/videoconvert"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump videoconvert > $BACKUP_DIR/db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/db_$DATE.sql

# 删除 30 天前的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR/db_$DATE.sql.gz"
```

添加到 crontab：

```bash
crontab -e
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

### 自动清理

应用已内置自动清理功能，每小时清理 24 小时前的临时文件。

手动清理：

```bash
# 清理上传文件
find ./uploads -type f -mtime +1 -delete

# 清理输出文件
find ./output -type f -mtime +1 -delete

# 清理临时文件
find ./temp -type f -mtime +1 -delete
```

## 安全最佳实践

### 1. 防火墙配置

```bash
# 安装 UFW
sudo apt install ufw

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

### 2. 限制文件权限

```bash
# 设置正确的文件权限
chmod 755 /var/www/videoconvert
chmod 644 /var/www/videoconvert/*.js
chmod 600 /var/www/videoconvert/.env

# 设置正确的所有者
chown -R www-data:www-data /var/www/videoconvert
```

### 3. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Node.js 依赖
npm audit
npm audit fix

# 更新 PM2
npm install -g pm2@latest
pm2 update
```

### 4. 速率限制

应用已内置速率限制，默认每 15 分钟最多 100 个请求。

可以在 `.env` 中调整：

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 分钟
RATE_LIMIT_MAX=100           # 最多 100 个请求
```

### 5. 监控异常

使用 Sentry 进行错误监控：

```env
MONITORING_ENABLED=true
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## 性能优化

### 1. 启用 Redis 缓存

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. 使用 CDN

```env
CDN_ENABLED=true
CDN_URL=https://cdn.videoconvert.com
```

### 3. 启用 Gzip 压缩

应用已内置 compression 中间件。

### 4. 数据库优化

- 添加适当的索引
- 定期清理过期数据
- 使用连接池

### 5. 负载均衡

使用 PM2 集群模式：

```bash
pm2 start server-production.js -i max
```

或使用 Nginx 负载均衡多个实例。

## 故障排查

### 应用无法启动

```bash
# 检查端口占用
sudo lsof -i :3000

# 检查日志
pm2 logs videoconvert --lines 100

# 检查环境变量
pm2 env 0
```

### 转换失败

```bash
# 检查 FFmpeg 是否安装
ffmpeg -version

# 检查磁盘空间
df -h

# 检查文件权限
ls -la uploads/ output/
```

### 内存泄漏

```bash
# 监控内存使用
pm2 monit

# 设置内存限制
pm2 start server-production.js --max-memory-restart 1G
```

## 扩展和升级

### 水平扩展

1. 使用负载均衡器（Nginx/HAProxy）
2. 部署多个应用实例
3. 使用共享存储（NFS/S3）
4. 使用 Redis 共享会话

### 垂直扩展

1. 增加服务器资源（CPU/内存）
2. 优化数据库查询
3. 使用缓存策略
4. 优化文件处理流程

## 支持和帮助

- 📧 Email: support@videoconvert.com
- 📚 文档: https://docs.videoconvert.com
- 🐛 问题反馈: https://github.com/your-repo/issues

---

**祝您部署顺利！** 🚀
