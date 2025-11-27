#!/bin/bash

# VideoConvert 快速启动脚本（中国大陆优化版）

set -e

echo "🎬 VideoConvert 快速启动（中国大陆优化版）"
echo "=============================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "访问: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否可用
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Docker 和 Docker Compose V2 已安装"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ Docker 和 Docker Compose V1 已安装"
else
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo ""
echo "ℹ️  使用国内镜像源加速构建"
echo ""

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads output ssl
echo "✅ 目录创建完成"
echo ""

# 构建镜像（使用国内镜像）
echo "🔨 构建 Docker 镜像（使用阿里云镜像）..."
$DOCKER_COMPOSE -f docker-compose.cn.yml build
echo "✅ 镜像构建完成"
echo ""

# 启动服务
echo "🚀 启动服务..."
$DOCKER_COMPOSE -f docker-compose.cn.yml up -d
echo "✅ 服务启动完成"
echo ""

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 5

# 健康检查
echo "🏥 检查服务健康状态..."
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "⚠️  服务可能还在启动中，请稍后访问"
fi

echo ""
echo "=============================================="
echo "🎉 启动完成！"
echo ""
echo "访问地址:"
echo "  - 主页: http://localhost:3000"
echo "  - Nginx: http://localhost:80 (如果启用)"
echo ""
echo "常用命令:"
echo "  - 查看日志: $DOCKER_COMPOSE -f docker-compose.cn.yml logs -f"
echo "  - 停止服务: $DOCKER_COMPOSE -f docker-compose.cn.yml down"
echo "  - 重启服务: $DOCKER_COMPOSE -f docker-compose.cn.yml restart"
echo ""
echo "如遇网络问题，请运行: ./fix-docker-network.sh"
echo "=============================================="
