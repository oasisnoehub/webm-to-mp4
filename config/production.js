// 生产环境配置
module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: 'production'
  },

  // 文件上传配置
  upload: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedTypes: ['video/webm', '.webm'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    outputDir: process.env.OUTPUT_DIR || './output',
    tempDir: process.env.TEMP_DIR || './temp'
  },

  // 用户限制配置
  limits: {
    free: {
      dailyConversions: 3,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      features: ['basic']
    },
    pro: {
      dailyConversions: -1, // 无限制
      maxFileSize: 500 * 1024 * 1024, // 500MB
      features: ['basic', 'batch', 'priority', 'no-ads']
    },
    enterprise: {
      dailyConversions: -1, // 无限制
      maxFileSize: -1, // 无限制
      features: ['basic', 'batch', 'priority', 'no-ads', 'api', 'team', 'sla']
    }
  },

  // 安全配置
  security: {
    enableCORS: true,
    enableCSRF: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 分钟
      max: 100 // 最多 100 个请求
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    destination: process.env.LOG_FILE || './logs/app.log'
  },

  // 数据库配置（如果需要）
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'videoconvert',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || ''
  },

  // Redis 配置（用于会话和缓存）
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },

  // 支付配置
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'stripe',
    publicKey: process.env.PAYMENT_PUBLIC_KEY || '',
    secretKey: process.env.PAYMENT_SECRET_KEY || '',
    webhook: process.env.PAYMENT_WEBHOOK_SECRET || ''
  },

  // 邮件配置
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@videoconvert.com'
  },

  // 监控配置
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    sentryDSN: process.env.SENTRY_DSN || '',
    googleAnalytics: process.env.GA_ID || ''
  },

  // CDN 配置
  cdn: {
    enabled: process.env.CDN_ENABLED === 'true',
    url: process.env.CDN_URL || '',
    bucket: process.env.CDN_BUCKET || ''
  },

  // 清理配置
  cleanup: {
    enabled: true,
    interval: 60 * 60 * 1000, // 每小时
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  }
};
