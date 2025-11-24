# 🐳 Docker 快速开始指南

## 一键启动

```bash
./start.sh
```

就这么简单！脚本会自动：
- ✅ 检查 Docker 环境
- ✅ 创建必要目录
- ✅ 构建镜像
- ✅ 启动服务
- ✅ 健康检查

## 访问应用

启动完成后访问：
- **主应用**: http://localhost:3000
- **Nginx 代理**: http://localhost:80

## 常用命令

### 使用 Makefile（推荐）

```bash
make up        # 启动服务
make down      # 停止服务
make logs      # 查看日志
make restart   # 重启服务
make shell     # 进入容器
make health    # 健康检查
make clean     # 清理环境
```

### 使用 Docker Compose

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 查看状态
docker compose ps
```

> **注意**: 如果使用 Docker Compose V1，请使用 `docker-compose` 命令（带连字符）

## 文件说明

| 文件 | 说明 |
|------|------|
| `Dockerfile` | Docker 镜像构建文件 |
| `docker-compose.yml` | Docker Compose 配置 |
| `docker-compose.prod.yml` | 生产环境配置 |
| `nginx.conf` | Nginx 反向代理配置 |
| `.dockerignore` | Docker 构建忽略文件 |
| `Makefile` | 常用命令快捷方式 |
| `start.sh` | 一键启动脚本 |

## 架构图

```
┌─────────────┐
│   用户      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Nginx     │ :80, :443
│  (可选)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ VideoConvert│ :3000
│   Node.js   │
└─────────────┘
```

## 环境要求

- Docker >= 20.10
- Docker Compose >= 2.0
- 磁盘空间 >= 2GB

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Node.js | 主应用服务 |
| 80 | Nginx | HTTP 访问 |
| 443 | Nginx | HTTPS 访问（需配置证书） |

## 数据持久化

以下目录会被持久化：
- `./uploads` - 上传的文件
- `./output` - 转换后的文件

## 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 修改端口（编辑 docker-compose.yml）
ports:
  - "8080:3000"  # 改为 8080
```

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs videoconvert

# 重新构建
docker-compose up -d --build
```

### 权限问题

```bash
# 修复目录权限
chmod 755 uploads/ output/
```

## 生产环境部署

```bash
# 使用生产配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 或使用 Makefile
make deploy-prod
```

## 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
make update

# 或手动执行
docker compose up -d --build
```

## 监控和维护

```bash
# 查看资源使用
make stats

# 备份数据
make backup

# 健康检查
make health
```

## 停止和清理

```bash
# 停止服务
make down

# 完全清理（包括数据）
make clean
```

## 获取帮助

```bash
# 查看所有命令
make help

# 查看详细文档
cat DEPLOYMENT.md
```

---

**快速开始**: `./start.sh`

**详细文档**: [DEPLOYMENT.md](DEPLOYMENT.md)

**问题反馈**: 查看日志 `make logs`
