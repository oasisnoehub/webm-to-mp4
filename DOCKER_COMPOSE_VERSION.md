# Docker Compose 版本说明

## 命令格式变更

本项目已更新为支持 **Docker Compose V2** 命令格式。

### Docker Compose V2 (推荐)

```bash
docker compose up -d
docker compose down
docker compose logs -f
```

### Docker Compose V1 (旧版)

```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 自动检测

项目中的脚本会自动检测您使用的 Docker Compose 版本：

- **start.sh** - 自动检测并使用正确的命令
- **Makefile** - 自动检测并使用正确的命令

## 检查您的版本

```bash
# 检查 Docker Compose V2
docker compose version

# 检查 Docker Compose V1
docker-compose version
```

## 升级到 V2

### macOS / Linux

Docker Compose V2 已包含在 Docker Desktop 中，无需单独安装。

### 手动安装 V2

```bash
# 下载最新版本
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose

# 添加执行权限
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# 验证安装
docker compose version
```

## 兼容性

本项目的所有脚本和文档都已更新为：
- ✅ 优先使用 Docker Compose V2 (`docker compose`)
- ✅ 自动兼容 Docker Compose V1 (`docker-compose`)
- ✅ 自动检测可用版本

## 推荐

建议使用 **Docker Compose V2**，因为：
- 更快的性能
- 更好的错误提示
- 官方推荐
- 未来的默认版本

---

**无需担心**: 项目脚本会自动处理版本差异！
