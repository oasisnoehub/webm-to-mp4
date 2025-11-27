# Docker 网络问题解决方案

## 问题描述

```
failed to solve: DeadlineExceeded: node:18-alpine: failed to resolve source metadata
```

这是因为无法访问 Docker Hub (docker.io)，在中国大陆很常见。

## 解决方案

### 方案 1: 使用国内镜像源（推荐）

#### macOS / Linux

编辑或创建 Docker 配置文件：

```bash
# 创建配置目录
mkdir -p ~/.docker

# 编辑配置文件
nano ~/.docker/daemon.json
```

添加以下内容：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

#### Docker Desktop (macOS/Windows)

1. 打开 Docker Desktop
2. 点击设置图标 ⚙️
3. 选择 "Docker Engine"
4. 添加镜像配置：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
```

5. 点击 "Apply & Restart"

#### 重启 Docker

```bash
# macOS/Linux
sudo systemctl restart docker

# 或重启 Docker Desktop
```

### 方案 2: 使用阿里云镜像加速器

1. 访问 https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors
2. 登录阿里云账号
3. 获取专属加速器地址
4. 配置到 Docker：

```json
{
  "registry-mirrors": ["https://你的ID.mirror.aliyuncs.com"]
}
```

### 方案 3: 使用代理

如果有 VPN 或代理：

```bash
# 设置代理环境变量
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 然后构建
docker compose build
```

### 方案 4: 使用国内基础镜像

修改 `Dockerfile`，使用国内镜像：

```dockerfile
# 使用阿里云镜像
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine

# 或使用腾讯云镜像
FROM ccr.ccs.tencentyun.com/library/node:18-alpine
```

### 方案 5: 预先拉取镜像

```bash
# 使用镜像源拉取
docker pull docker.mirrors.ustc.edu.cn/library/node:18-alpine

# 重新标记
docker tag docker.mirrors.ustc.edu.cn/library/node:18-alpine node:18-alpine

# 然后构建
docker compose build
```

## 验证配置

```bash
# 查看 Docker 配置
docker info | grep -A 5 "Registry Mirrors"

# 测试拉取镜像
docker pull node:18-alpine
```

## 推荐的国内镜像源

| 镜像源 | 地址 | 说明 |
|--------|------|------|
| 中科大 | https://docker.mirrors.ustc.edu.cn | 稳定快速 |
| 网易 | https://hub-mirror.c.163.com | 老牌镜像 |
| 百度云 | https://mirror.baidubce.com | 速度快 |
| 阿里云 | https://你的ID.mirror.aliyuncs.com | 需注册 |
| 腾讯云 | https://mirror.ccs.tencentyun.com | 企业级 |

## 完整配置示例

创建 `~/.docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## 故障排查

### 检查网络连接

```bash
# 测试 Docker Hub 连接
curl -I https://registry-1.docker.io/v2/

# 测试镜像源连接
curl -I https://docker.mirrors.ustc.edu.cn/v2/
```

### 清理缓存

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker compose build --no-cache
```

### 查看详细日志

```bash
# 查看构建日志
docker compose build --progress=plain
```

## 快速修复脚本

创建 `fix-docker-network.sh`：

```bash
#!/bin/bash

echo "🔧 修复 Docker 网络问题"

# 创建配置目录
mkdir -p ~/.docker

# 备份现有配置
if [ -f ~/.docker/daemon.json ]; then
    cp ~/.docker/daemon.json ~/.docker/daemon.json.backup
    echo "✅ 已备份现有配置"
fi

# 写入新配置
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

echo "✅ 配置已更新"
echo ""
echo "请重启 Docker："
echo "  - Docker Desktop: 右键图标 -> Restart"
echo "  - Linux: sudo systemctl restart docker"
echo ""
echo "然后重新运行: ./start.sh"
```

运行：

```bash
chmod +x fix-docker-network.sh
./fix-docker-network.sh
```

## 成功后

配置完成并重启 Docker 后，重新运行：

```bash
./start.sh
```

或

```bash
make build
make up
```

---

**推荐**: 使用方案 1（国内镜像源）+ 方案 2（阿里云加速器）组合使用
