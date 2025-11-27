# 🐳 Docker 部署指南

## 快速开始

### 方式 1: 最简单部署（推荐新手）

只部署应用，不包含 Redis 和 Nginx。

```bash
# 1. 构建并启动
docker-compose -f docker-compose.simple.yml up -d

# 2. 查看日志
docker-compose -f docker-compose.simple.yml logs -f

# 3. 访问应用
http://localhost:3000
```

### 方式 2: 完整部署

包含应用、Redis 缓存和 Nginx 反向代理。

```bash
# 1. 构建并启动
docker-compose -f docker-compose.full.yml up -d

# 2. 查看日志
docker-compose -f docker-compose.full.yml logs -f

# 3. 访问应用
http://localhost  # 通过 Nginx
http://localhost:3000  # 直接访问应用
```

### 方式 3: 原始 Docker 命令

```bash
# 1. 构建镜像
docker build -f Dockerfile.fixed -t videoconvert:latest .

# 2. 运行容器
docker run -d \
  --name videoconvert \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/output:/app/output \
  -e NODE_ENV=production \
  --restart unless-stopped \
  videoconvert:latest

# 3. 查看日志
docker logs -f videoconvert
```

## 文件说明

### Dockerfile 文件

| 文件 | 说明 | 推荐 |
|------|------|------|
| `Dockerfile.fixed` | 简化版，易于构建 | ⭐⭐⭐⭐⭐ |
| `Dockerfile.production` | 多阶段构建，优化版 | ⭐⭐⭐ |
| `Dockerfile` | 基础版 | ⭐⭐ |

### Docker Compose 文件

| 文件 | 说明 | 包含服务 | 推荐 |
|------|------|----------|------|
| `docker-compose.simple.yml` | 最简单 | 仅应用 | ⭐⭐⭐⭐⭐ |
| `docker-compose.full.yml` | 完整版 | 应用+Redis+Nginx | ⭐⭐⭐⭐ |
| `docker-compose.production.yml` | 生产版 | 应用+Redis+Nginx（高级配置） | ⭐⭐⭐ |
| `docker-compose.yml` | 基础版 | 应用+Nginx | ⭐⭐ |

## 常用命令

### 启动和停止

```bash
# 启动（后台运行）
docker-compose -f docker-compose.simple.yml up -d

# 启动（前台运行，查看日志）
docker-compose -f docker-compose.simple.yml up

# 停止
docker-compose -f docker-compose.simple.yml down

# 停止并删除数据卷
docker-compose -f docker-compose.simple.yml down -v
```

### 查看状态

```bash
# 查看运行状态
docker-compose -f docker-compose.simple.yml ps

# 查看日志
docker-compose -f docker-compose.simple.yml logs

# 实时查看日志
docker-compose -f docker-compose.simple.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.simple.yml logs app
```

### 重启和重建

```bash
# 重启服务
docker-compose -f docker-compose.simple.yml restart

# 重启特定服务
docker-compose -f docker-compose.simple.yml restart app

# 重新构建并启动
docker-compose -f docker-compose.simple.yml up -d --build

# 强制重新构建
docker-compose -f docker-compose.simple.yml build --no-cache
```

### 进入容器

```bash
# 进入应用容器
docker exec -it videoconvert-app sh

# 进入 Redis 容器
docker exec -it videoconvert-redis sh

# 进入 Nginx 容器
docker exec -it videoconvert-nginx sh
```

### 清理

```bash
# 停止并删除容器
docker-compose -f docker-compose.simple.yml down

# 删除所有相关容器、网络、卷
docker-compose -f docker-compose.simple.yml down -v

# 删除镜像
docker rmi videoconvert:latest

# 清理所有未使用的资源
docker system prune -a
```

## 故障排查

### 问题 1: 构建失败

**错误**: `npm ci` 失败

**解决方案**:
```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重新构建
docker-compose -f docker-compose.simple.yml build --no-cache
```

### 问题 2: 容器无法启动

**错误**: 容器启动后立即退出

**解决方案**:
```bash
# 查看日志
docker-compose -f docker-compose.simple.yml logs app

# 检查健康状态
docker-compose -f docker-compose.simple.yml ps

# 进入容器调试
docker run -it --rm videoconvert:latest sh
```

### 问题 3: 端口被占用

**错误**: `port is already allocated`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 停止占用进程
kill -9 <PID>

# 或修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"  # 改为 3001
```

### 问题 4: 无法访问应用

**错误**: 浏览器无法访问 http://localhost:3000

**解决方案**:
```bash
# 1. 检查容器是否运行
docker ps | grep videoconvert

# 2. 检查端口映射
docker port videoconvert-app

# 3. 检查健康状态
docker inspect videoconvert-app | grep Health

# 4. 查看日志
docker logs videoconvert-app

# 5. 测试健康检查
curl http://localhost:3000/api/health
```

### 问题 5: FFmpeg 不可用

**错误**: 转换失败，FFmpeg 未找到

**解决方案**:
```bash
# 进入容器检查
docker exec -it videoconvert-app sh

# 检查 FFmpeg
ffmpeg -version

# 如果没有，重新构建镜像
docker-compose -f docker-compose.simple.yml build --no-cache
```

### 问题 6: 文件权限问题

**错误**: 无法写入 uploads 或 output 目录

**解决方案**:
```bash
# 修改目录权限
chmod 777 uploads output temp logs

# 或在 docker-compose.yml 中添加用户配置
user: "1000:1000"
```

### 问题 7: Redis 连接失败

**错误**: 无法连接到 Redis

**解决方案**:
```bash
# 检查 Redis 是否运行
docker-compose -f docker-compose.full.yml ps redis

# 测试 Redis 连接
docker exec -it videoconvert-redis redis-cli ping

# 检查网络连接
docker exec -it videoconvert-app ping redis
```

## 性能优化

### 1. 使用多阶段构建

使用 `Dockerfile.production` 而不是 `Dockerfile.fixed`：

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 2. 限制资源使用

在 docker-compose.yml 中添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

### 3. 使用 Redis 缓存

```bash
docker-compose -f docker-compose.full.yml up -d
```

### 4. 启用日志轮转

在 docker-compose.yml 中添加：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 生产环境部署

### 1. 使用环境变量

创建 `.env` 文件：

```env
NODE_ENV=production
PORT=3000
REDIS_ENABLED=true
REDIS_HOST=redis
```

在 docker-compose.yml 中引用：

```yaml
env_file:
  - .env
```

### 2. 配置 SSL

将 SSL 证书放在 `ssl/` 目录：

```bash
mkdir -p ssl
# 复制证书文件
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/
```

更新 nginx 配置以使用 HTTPS。

### 3. 使用 Docker Swarm 或 Kubernetes

对于大规模部署，考虑使用：
- Docker Swarm
- Kubernetes
- AWS ECS
- Google Cloud Run

### 4. 监控和日志

使用以下工具：
- Prometheus + Grafana（监控）
- ELK Stack（日志）
- Sentry（错误追踪）

## 备份和恢复

### 备份数据

```bash
# 备份上传文件
tar -czf backup-uploads.tar.gz uploads/

# 备份输出文件
tar -czf backup-output.tar.gz output/

# 备份 Redis 数据
docker exec videoconvert-redis redis-cli SAVE
docker cp videoconvert-redis:/data/dump.rdb ./backup-redis.rdb
```

### 恢复数据

```bash
# 恢复上传文件
tar -xzf backup-uploads.tar.gz

# 恢复输出文件
tar -xzf backup-output.tar.gz

# 恢复 Redis 数据
docker cp ./backup-redis.rdb videoconvert-redis:/data/dump.rdb
docker-compose -f docker-compose.full.yml restart redis
```

## 测试部署

### 1. 健康检查

```bash
# 测试应用健康
curl http://localhost:3000/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2024-11-27T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### 2. 功能测试

```bash
# 访问主页
curl http://localhost:3000/

# 访问 API 信息
curl http://localhost:3000/api/info
```

### 3. 性能测试

```bash
# 使用 ab (Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/

# 使用 wrk
wrk -t12 -c400 -d30s http://localhost:3000/
```

## 推荐配置

### 开发环境

```bash
docker-compose -f docker-compose.simple.yml up
```

### 测试环境

```bash
docker-compose -f docker-compose.full.yml up -d
```

### 生产环境

```bash
docker-compose -f docker-compose.production.yml up -d
```

## 总结

| 场景 | 推荐配置 | 命令 |
|------|----------|------|
| 快速测试 | simple | `docker-compose -f docker-compose.simple.yml up` |
| 本地开发 | simple | `docker-compose -f docker-compose.simple.yml up` |
| 功能测试 | full | `docker-compose -f docker-compose.full.yml up -d` |
| 生产部署 | production | `docker-compose -f docker-compose.production.yml up -d` |

---

**推荐**: 新手使用 `docker-compose.simple.yml`，生产环境使用 `docker-compose.full.yml`。
