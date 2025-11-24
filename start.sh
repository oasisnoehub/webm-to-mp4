#!/bin/bash

# VideoConvert 快速启动脚本

set -e

echo "🎬 VideoConvert 快速启动"
echo "=========================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "访问: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否可用（支持 V1 和 V2）
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
    echo "✅ Docker 和 Docker Compose V2 已安装"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
    echo "✅ Docker 和 Docker Compose V1 已安装"
else
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    echo "访问: https://docs.docker.com/compose/install/"
    exit 1
fi

echo ""

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads output ssl
echo "✅ 目录创建完成"
echo ""

# 构建镜像
echo "🔨 构建 Docker 镜像..."
$DOCKER_COMPOSE build
echo "✅ 镜像构建完成"
echo ""

# 启动服务
echo "🚀 启动服务..."
$DOCKER_COMPOSE up -d
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
echo "=========================="
echo "🎉 启动完成！"
echo ""
echo "访问地址:"
echo "  - 主页: http://localhost:3000"
echo "  - Nginx: http://localhost:80 (如果启用)"
echo ""
echo "常用命令:"
echo "  - 查看日志: $DOCKER_COMPOSE logs -f"
echo "  - 停止服务: $DOCKER_COMPOSE down"
echo "  - 重启服务: $DOCKER_COMPOSE restart"
echo ""
echo "详细文档: 查看 DEPLOYMENT.md"
echo "=========================="
