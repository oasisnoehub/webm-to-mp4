# Docker 部署指南

## 📦 快速开始

### 方式 1: 使用 Docker Compose（推荐）

```bash
# 1. 构建并启动服务
docker compose up -d

# 2. 查看日志
docker compose logs -f

# 3. 访问应用
# http://localhost:80 (通过 Nginx)
# http://localhost:3000 (直接访问)
```

> **注意**: 如果使用 Docker Compose V1，请使用 `docker-compose` 命令（带连字符）

### 方式 2: 使用 Docker 命令

```bash
# 1. 构建镜像
docker build -t videoconvert:latest .

# 2. 运行容器
docker run -d \
  --name videoconvert \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/output:/app/output \
  --restart unless-stopped \
  videoconvert:latest

# 3. 查看日志
docker logs -f videoconvert

# 4. 访问应用
# http://localhost:3000
```

## 🏗️ 架构说明

### 服务组件

1. **videoconvert** - Node.js 应用服务
   - 端口: 3000
   - 提供 Web 界面和 API
   - 处理视频转换请求

2. **nginx** - 反向代理（可选）
   - 端口: 80 (HTTP), 443 (HTTPS)
   - 负载均衡
   - 静态文件缓存
   - 请求限流
   - SSL/TLS 终止

### 目录结构

```
.
├── Dockerfile              # Docker 镜像构建文件
├── docker-compose.yml      # Docker Compose 配置
├── nginx.conf             # Nginx 配置
├── .dockerignore          # Docker 忽略文件
├── server.js              # Node.js 服务器
├── package.json           # 依赖配置
├── public/                # 静态文件
├── uploads/               # 上传文件目录（持久化）
└── output/                # 输出文件目录（持久化）
```

## 🚀 部署步骤

### 1. 准备环境

确保已安装：
- Docker (>= 20.10)
- Docker Compose (>= 2.0)

```bash
# 检查版本
docker --version
docker-compose --version
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd videoconvert
```

### 3. 配置环境变量（可选）

创建 `.env` 文件：

```env
# 应用配置
NODE_ENV=production
PORT=3000

# 文件大小限制（字节）
MAX_FILE_SIZE=524288000  # 500MB

# 其他配置
LOG_LEVEL=info
```

### 4. 构建和启动

```bash
# 使用 Docker Compose
docker compose up -d --build

# 或者分步执行
docker compose build
docker compose up -d
```

### 5. 验证部署

```bash
# 检查容器状态
docker compose ps

# 查看日志
docker compose logs -f videoconvert

# 健康检查
curl http://localhost:3000/api/health
```

## 🔧 常用命令

### 容器管理

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose stop

# 重启服务
docker compose restart

# 停止并删除容器
docker compose down

# 停止并删除容器和卷
docker compose down -v
```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f videoconvert

# 查看最近 100 行日志
docker compose logs --tail=100 videoconvert
```

### 进入容器

```bash
# 进入应用容器
docker compose exec videoconvert sh

# 进入 Nginx 容器
docker compose exec nginx sh
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker compose build

# 3. 重启服务
docker compose up -d

# 或者一步完成
docker compose up -d --build
```

## 🌐 生产环境部署

### 1. 使用 Nginx 反向代理

编辑 `docker-compose.yml`，确保 nginx 服务已启用：

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    # ...
```

### 2. 配置 SSL/TLS

```bash
# 1. 创建 SSL 目录
mkdir -p ssl

# 2. 放置证书文件
# ssl/cert.pem
# ssl/key.pem

# 3. 取消 nginx.conf 中 HTTPS 配置的注释

# 4. 重启 Nginx
docker-compose restart nginx
```

### 3. 配置域名

更新 `nginx.conf` 中的 `server_name`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    # ...
}
```

### 4. 设置防火墙

```bash
# 允许 HTTP 和 HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 📊 监控和维护

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查容器健康状态
docker-compose ps
```

### 资源监控

```bash
# 查看容器资源使用
docker stats

# 查看特定容器资源使用
docker stats videoconvert-app
```

### 日志管理

```bash
# 清理旧日志
docker-compose logs --tail=0 -f > /dev/null

# 限制日志大小（在 docker-compose.yml 中）
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 数据备份

```bash
# 备份上传和输出目录
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ output/

# 恢复备份
tar -xzf backup-20240101.tar.gz
```

## 🔒 安全建议

### 1. 限制文件大小

在 `nginx.conf` 中已配置：
```nginx
client_max_body_size 500M;
```

### 2. 请求限流

已配置 API 限流：
- API 接口: 10 请求/秒
- 上传接口: 2 请求/秒

### 3. 使用 HTTPS

生产环境必须使用 HTTPS：
- 使用 Let's Encrypt 免费证书
- 或购买商业 SSL 证书

### 4. 定期更新

```bash
# 更新基础镜像
docker-compose pull

# 重新构建
docker-compose up -d --build
```

## 🐛 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker compose logs videoconvert

# 检查端口占用
lsof -i :3000

# 检查磁盘空间
df -h
```

### 应用无响应

```bash
# 重启容器
docker compose restart videoconvert

# 检查容器状态
docker compose ps

# 进入容器检查
docker compose exec videoconvert sh
```

### 文件上传失败

```bash
# 检查目录权限
ls -la uploads/ output/

# 修复权限
chmod 755 uploads/ output/
```

## 📈 性能优化

### 1. 增加资源限制

在 `docker-compose.yml` 中：

```yaml
services:
  videoconvert:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. 使用多个实例

```bash
# 扩展到 3 个实例
docker compose up -d --scale videoconvert=3
```

### 3. 启用缓存

Nginx 已配置静态文件缓存，有效期 7 天。

## 🌍 云平台部署

### AWS ECS

```bash
# 1. 推送镜像到 ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag videoconvert:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/videoconvert:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/videoconvert:latest

# 2. 创建 ECS 任务定义和服务
```

### Google Cloud Run

```bash
# 1. 构建并推送镜像
gcloud builds submit --tag gcr.io/<project-id>/videoconvert

# 2. 部署到 Cloud Run
gcloud run deploy videoconvert \
  --image gcr.io/<project-id>/videoconvert \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# 1. 推送镜像到 ACR
az acr build --registry <registry-name> --image videoconvert:latest .

# 2. 创建容器实例
az container create \
  --resource-group <resource-group> \
  --name videoconvert \
  --image <registry-name>.azurecr.io/videoconvert:latest \
  --dns-name-label videoconvert \
  --ports 3000
```

## 📝 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| NODE_ENV | production | 运行环境 |
| PORT | 3000 | 应用端口 |
| MAX_FILE_SIZE | 524288000 | 最大文件大小（字节） |
| LOG_LEVEL | info | 日志级别 |

## 🆘 获取帮助

- 查看日志: `docker compose logs -f`
- 检查状态: `docker compose ps`
- 健康检查: `curl http://localhost:3000/api/health`
- 进入容器: `docker compose exec videoconvert sh`

---

**部署完成后访问**: http://localhost (Nginx) 或 http://localhost:3000 (直接访问)
