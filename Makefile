.PHONY: help build up down restart logs shell clean

# 检测 Docker Compose 命令
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# 默认目标
help:
	@echo "VideoConvert Docker 管理命令:"
	@echo ""
	@echo "  make build      - 构建 Docker 镜像"
	@echo "  make up         - 启动所有服务"
	@echo "  make down       - 停止所有服务"
	@echo "  make restart    - 重启所有服务"
	@echo "  make logs       - 查看日志"
	@echo "  make shell      - 进入应用容器"
	@echo "  make clean      - 清理容器和镜像"
	@echo "  make ps         - 查看容器状态"
	@echo "  make health     - 健康检查"
	@echo ""
	@echo "使用的命令: $(DOCKER_COMPOSE)"
	@echo ""

# 构建镜像
build:
	@echo "🔨 构建 Docker 镜像..."
	$(DOCKER_COMPOSE) build

# 启动服务
up:
	@echo "🚀 启动服务..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ 服务已启动"
	@echo "访问: http://localhost:3000"

# 停止服务
down:
	@echo "🛑 停止服务..."
	$(DOCKER_COMPOSE) down

# 重启服务
restart:
	@echo "🔄 重启服务..."
	$(DOCKER_COMPOSE) restart

# 查看日志
logs:
	$(DOCKER_COMPOSE) logs -f

# 进入容器
shell:
	$(DOCKER_COMPOSE) exec videoconvert sh

# 查看状态
ps:
	$(DOCKER_COMPOSE) ps

# 健康检查
health:
	@echo "🏥 检查应用健康状态..."
	@curl -f http://localhost:3000/api/health && echo "\n✅ 应用运行正常" || echo "\n❌ 应用异常"

# 清理
clean:
	@echo "🧹 清理容器和镜像..."
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

# 更新应用
update:
	@echo "📦 更新应用..."
	git pull
	$(DOCKER_COMPOSE) up -d --build
	@echo "✅ 更新完成"

# 备份数据
backup:
	@echo "💾 备份数据..."
	tar -czf backup-$$(date +%Y%m%d-%H%M%S).tar.gz uploads/ output/
	@echo "✅ 备份完成"

# 查看资源使用
stats:
	docker stats videoconvert-app

# 生产环境部署
deploy-prod:
	@echo "🚀 部署到生产环境..."
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	@echo "✅ 部署完成"
