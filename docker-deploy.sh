#!/bin/bash

# Docker 快速部署脚本

set -e

echo "========================================="
echo "🐳 VideoConvert Docker 部署"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Docker
echo "1. 检查 Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker 已安装: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker 未安装"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose
echo ""
echo "2. 检查 Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose 已安装: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose 未安装"
    echo "请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo ""
echo "3. 创建必要的目录..."
mkdir -p uploads output temp logs ssl
chmod 777 uploads output temp logs
echo -e "${GREEN}✓${NC} 目录已创建"

# 选择部署方式
echo ""
echo "========================================="
echo "选择部署方式:"
echo "========================================="
echo "1) 简单部署（仅应用，推荐新手）"
echo "2) 完整部署（应用 + Redis + Nginx）"
echo "3) 生产部署（高级配置）"
echo "4) 停止所有服务"
echo "5) 查看日志"
echo "6) 退出"
echo ""
read -p "请选择 (1-6): " choice

case $choice in
    1)
        echo ""
        echo "========================================="
        echo "🚀 简单部署"
        echo "========================================="
        
        # 停止旧容器
        docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
        
        # 构建并启动
        echo "正在构建镜像..."
        docker-compose -f docker-compose.simple.yml build
        
        echo "正在启动服务..."
        docker-compose -f docker-compose.simple.yml up -d
        
        echo ""
        echo -e "${GREEN}✓${NC} 部署完成！"
        echo ""
        echo "访问地址:"
        echo "  🌐 http://localhost:3000"
        echo ""
        echo "常用命令:"
        echo "  docker-compose -f docker-compose.simple.yml ps      # 查看状态"
        echo "  docker-compose -f docker-compose.simple.yml logs -f # 查看日志"
        echo "  docker-compose -f docker-compose.simple.yml down    # 停止服务"
        echo ""
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 5
        
        # 显示状态
        docker-compose -f docker-compose.simple.yml ps
        
        # 测试健康检查
        echo ""
        echo "测试健康检查..."
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} 服务运行正常"
        else
            echo -e "${YELLOW}⚠${NC} 服务可能还在启动中，请稍后访问"
        fi
        ;;
        
    2)
        echo ""
        echo "========================================="
        echo "🚀 完整部署"
        echo "========================================="
        
        # 停止旧容器
        docker-compose -f docker-compose.full.yml down 2>/dev/null || true
        
        # 构建并启动
        echo "正在构建镜像..."
        docker-compose -f docker-compose.full.yml build
        
        echo "正在启动服务..."
        docker-compose -f docker-compose.full.yml up -d
        
        echo ""
        echo -e "${GREEN}✓${NC} 部署完成！"
        echo ""
        echo "访问地址:"
        echo "  🌐 http://localhost (通过 Nginx)"
        echo "  🌐 http://localhost:3000 (直接访问)"
        echo ""
        echo "服务:"
        echo "  📦 应用: videoconvert-app"
        echo "  🗄️  Redis: videoconvert-redis"
        echo "  🌐 Nginx: videoconvert-nginx"
        echo ""
        echo "常用命令:"
        echo "  docker-compose -f docker-compose.full.yml ps      # 查看状态"
        echo "  docker-compose -f docker-compose.full.yml logs -f # 查看日志"
        echo "  docker-compose -f docker-compose.full.yml down    # 停止服务"
        echo ""
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 10
        
        # 显示状态
        docker-compose -f docker-compose.full.yml ps
        ;;
        
    3)
        echo ""
        echo "========================================="
        echo "🚀 生产部署"
        echo "========================================="
        
        # 检查 .env 文件
        if [ ! -f ".env" ]; then
            echo -e "${YELLOW}⚠${NC} .env 文件不存在"
            read -p "是否创建 .env 文件？(y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                cp .env.example .env
                echo -e "${GREEN}✓${NC} 已创建 .env 文件"
                echo "请编辑 .env 文件后重新运行此脚本"
                exit 0
            else
                echo "取消部署"
                exit 0
            fi
        fi
        
        # 停止旧容器
        docker-compose -f docker-compose.production.yml down 2>/dev/null || true
        
        # 构建并启动
        echo "正在构建镜像..."
        docker-compose -f docker-compose.production.yml build
        
        echo "正在启动服务..."
        docker-compose -f docker-compose.production.yml up -d
        
        echo ""
        echo -e "${GREEN}✓${NC} 部署完成！"
        echo ""
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 10
        
        # 显示状态
        docker-compose -f docker-compose.production.yml ps
        ;;
        
    4)
        echo ""
        echo "========================================="
        echo "🛑 停止所有服务"
        echo "========================================="
        
        docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
        docker-compose -f docker-compose.full.yml down 2>/dev/null || true
        docker-compose -f docker-compose.production.yml down 2>/dev/null || true
        
        echo -e "${GREEN}✓${NC} 所有服务已停止"
        ;;
        
    5)
        echo ""
        echo "========================================="
        echo "📋 查看日志"
        echo "========================================="
        echo ""
        echo "选择要查看的服务:"
        echo "1) 简单部署"
        echo "2) 完整部署"
        echo "3) 生产部署"
        echo ""
        read -p "请选择 (1-3): " log_choice
        
        case $log_choice in
            1)
                docker-compose -f docker-compose.simple.yml logs -f
                ;;
            2)
                docker-compose -f docker-compose.full.yml logs -f
                ;;
            3)
                docker-compose -f docker-compose.production.yml logs -f
                ;;
            *)
                echo "无效选择"
                ;;
        esac
        ;;
        
    6)
        echo "退出"
        exit 0
        ;;
        
    *)
        echo -e "${RED}✗${NC} 无效选择"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "📚 更多信息"
echo "========================================="
echo ""
echo "文档:"
echo "  📖 DOCKER_部署指南.md - 完整的 Docker 部署文档"
echo "  📖 PRODUCTION_DEPLOYMENT.md - 生产环境部署指南"
echo ""
echo "故障排查:"
echo "  如果遇到问题，请查看 DOCKER_部署指南.md 的故障排查章节"
echo ""
echo "========================================="
