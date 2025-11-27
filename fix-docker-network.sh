#!/bin/bash

# Docker 网络问题自动修复脚本

set -e

echo "🔧 Docker 网络问题修复工具"
echo "=============================="
echo ""

# 检查操作系统
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "检测到系统: $MACHINE"
echo ""

# 配置文件路径
if [ "$MACHINE" = "Mac" ]; then
    CONFIG_DIR="$HOME/.docker"
    CONFIG_FILE="$CONFIG_DIR/daemon.json"
    echo "ℹ️  macOS 用户请注意："
    echo "   如果使用 Docker Desktop，建议通过图形界面配置"
    echo "   设置 -> Docker Engine -> 添加镜像配置"
    echo ""
else
    CONFIG_DIR="/etc/docker"
    CONFIG_FILE="$CONFIG_DIR/daemon.json"
fi

# 创建配置目录
if [ ! -d "$CONFIG_DIR" ]; then
    echo "📁 创建配置目录: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
fi

# 备份现有配置
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 备份现有配置到: $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# 写入新配置
echo "✍️  写入镜像源配置..."
cat > "$CONFIG_FILE" << 'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "dns": ["8.8.8.8", "114.114.114.114"],
  "max-concurrent-downloads": 10
}
EOF

echo "✅ 配置已更新"
echo ""

# 显示配置内容
echo "📄 当前配置:"
cat "$CONFIG_FILE"
echo ""

# 重启提示
echo "=============================="
echo "⚠️  重要: 需要重启 Docker"
echo "=============================="
echo ""

if [ "$MACHINE" = "Mac" ]; then
    echo "macOS 用户:"
    echo "  1. 点击菜单栏的 Docker 图标"
    echo "  2. 选择 'Restart'"
    echo ""
    echo "或者使用 Docker Desktop 图形界面配置:"
    echo "  1. 打开 Docker Desktop"
    echo "  2. 设置 ⚙️  -> Docker Engine"
    echo "  3. 添加 registry-mirrors 配置"
    echo "  4. Apply & Restart"
else
    echo "Linux 用户:"
    echo "  sudo systemctl restart docker"
    echo ""
    
    # 尝试自动重启
    if command -v systemctl &> /dev/null; then
        read -p "是否现在重启 Docker? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 重启 Docker..."
            sudo systemctl restart docker
            echo "✅ Docker 已重启"
        fi
    fi
fi

echo ""
echo "=============================="
echo "✅ 修复完成"
echo "=============================="
echo ""
echo "下一步:"
echo "  1. 确保 Docker 已重启"
echo "  2. 测试连接: docker pull node:18-alpine"
echo "  3. 重新构建: ./start.sh"
echo ""
echo "如果仍有问题，请查看: DOCKER_NETWORK_FIX.md"
