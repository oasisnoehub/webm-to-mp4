#!/bin/bash

# VideoConvert 生产环境启动脚本

set -e

echo "========================================="
echo "🚀 VideoConvert 生产环境启动"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "1. 检查 Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js 已安装: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查 FFmpeg
echo ""
echo "2. 检查 FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo -e "${GREEN}✓${NC} FFmpeg 已安装: $FFMPEG_VERSION"
else
    echo -e "${YELLOW}⚠${NC} FFmpeg 未安装（浏览器版不需要）"
fi

# 检查环境变量文件
echo ""
echo "3. 检查环境配置..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env 文件存在"
else
    echo -e "${YELLOW}⚠${NC} .env 文件不存在，正在创建..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} 已创建 .env 文件，请编辑配置"
    echo "   nano .env"
    read -p "按回车继续..."
fi

# 检查依赖
echo ""
echo "4. 检查依赖..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules 存在"
else
    echo -e "${YELLOW}⚠${NC} node_modules 不存在，正在安装..."
    npm install --production
fi

# 创建必要的目录
echo ""
echo "5. 创建必要的目录..."
mkdir -p uploads output temp logs
echo -e "${GREEN}✓${NC} 目录已创建"

# 检查端口
echo ""
echo "6. 检查端口..."
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} 端口 $PORT 已被占用"
    read -p "是否停止占用进程？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti:$PORT)
        kill -9 $PID
        echo -e "${GREEN}✓${NC} 已停止进程 $PID"
    fi
else
    echo -e "${GREEN}✓${NC} 端口 $PORT 可用"
fi

# 选择启动方式
echo ""
echo "========================================="
echo "选择启动方式:"
echo "========================================="
echo "1) 直接启动（前台运行）"
echo "2) PM2 启动（后台运行，推荐）"
echo "3) Docker 启动"
echo "4) 退出"
echo ""
read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "========================================="
        echo "🚀 正在启动服务..."
        echo "========================================="
        NODE_ENV=production node server-production.js
        ;;
    2)
        echo ""
        echo "========================================="
        echo "🚀 使用 PM2 启动服务..."
        echo "========================================="
        
        # 检查 PM2
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} PM2 未安装，正在安装..."
            npm install -g pm2
        fi
        
        # 停止旧进程
        pm2 stop videoconvert 2>/dev/null || true
        pm2 delete videoconvert 2>/dev/null || true
        
        # 启动新进程
        pm2 start server-production.js --name videoconvert
        pm2 save
        
        echo ""
        echo -e "${GREEN}✓${NC} 服务已启动"
        echo ""
        echo "常用命令:"
        echo "  pm2 status          - 查看状态"
        echo "  pm2 logs videoconvert - 查看日志"
        echo "  pm2 restart videoconvert - 重启服务"
        echo "  pm2 stop videoconvert - 停止服务"
        echo ""
        pm2 status
        ;;
    3)
        echo ""
        echo "========================================="
        echo "🐳 使用 Docker 启动服务..."
        echo "========================================="
        
        # 检查 Docker
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}✗${NC} Docker 未安装"
            echo "请先安装 Docker: https://docs.docker.com/get-docker/"
            exit 1
        fi
        
        # 检查 Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}✗${NC} Docker Compose 未安装"
            echo "请先安装 Docker Compose"
            exit 1
        fi
        
        # 启动服务
        docker-compose -f docker-compose.production.yml up -d
        
        echo ""
        echo -e "${GREEN}✓${NC} 服务已启动"
        echo ""
        echo "常用命令:"
        echo "  docker-compose -f docker-compose.production.yml ps - 查看状态"
        echo "  docker-compose -f docker-compose.production.yml logs -f - 查看日志"
        echo "  docker-compose -f docker-compose.production.yml restart - 重启服务"
        echo "  docker-compose -f docker-compose.production.yml down - 停止服务"
        echo ""
        docker-compose -f docker-compose.production.yml ps
        ;;
    4)
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
echo "✅ 启动完成！"
echo "========================================="
echo ""
echo "访问地址:"
echo "  🌐 主页: http://localhost:$PORT"
echo "  🎬 转换器: http://localhost:$PORT/index.html"
echo "  🚀 浏览器版: http://localhost:$PORT/index-browser.html"
echo "  📊 健康检查: http://localhost:$PORT/api/health"
echo ""
echo "文档:"
echo "  📚 生产部署: PRODUCTION_DEPLOYMENT.md"
echo "  📖 项目说明: PRODUCTION_README.md"
echo "  🔧 故障排查: PRODUCTION_DEPLOYMENT.md#故障排查"
echo ""
echo "========================================="
