const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== 中间件配置 ====================

// 安全头部
app.use(helmet({
  contentSecurityPolicy: false, // 禁用 CSP 以支持内联脚本
  crossOriginEmbedderPolicy: false // 自定义 COEP
}));

// 压缩响应
app.use(compression());

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// 解析 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 添加必要的头部以支持 SharedArrayBuffer（FFmpeg.wasm 需要）
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // 缓存控制
  if (req.url.includes('.wasm') || req.url.includes('ffmpeg')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 静态文件服务
app.use(express.static('public', {
  maxAge: NODE_ENV === 'production' ? '1d' : 0
}));

// ==================== 目录管理 ====================

const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const outputDir = path.join(__dirname, process.env.OUTPUT_DIR || 'output');
const tempDir = path.join(__dirname, process.env.TEMP_DIR || 'temp');

[uploadsDir, outputDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== 文件上传配置 ====================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'video/webm' || ext === '.webm') {
      cb(null, true);
    } else {
      cb(new Error('只支持 WebM 格式的视频文件'));
    }
  }
});

// ==================== API 路由 ====================

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// 系统信息
app.get('/api/info', (req, res) => {
  res.json({
    version: '1.0.0',
    features: {
      browserConversion: true,
      serverConversion: true,
      maxFileSize: '500MB',
      supportedFormats: ['webm']
    },
    limits: {
      free: {
        dailyConversions: 3,
        maxFileSize: '50MB'
      },
      pro: {
        dailyConversions: 'unlimited',
        maxFileSize: '500MB'
      }
    }
  });
});

// 转换 API（服务器端）
app.post('/api/convert', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '没有上传文件'
    });
  }

  const inputPath = req.file.path;
  const outputFilename = req.file.filename.replace(/\.webm$/i, '.mp4');
  const outputPath = path.join(outputDir, outputFilename);

  console.log(`[${new Date().toISOString()}] 开始转换: ${req.file.originalname}`);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('start', (cmd) => {
          console.log('FFmpeg 命令:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`转换进度: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log(`[${new Date().toISOString()}] 转换完成: ${outputFilename}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg 错误:', err);
          reject(err);
        })
        .run();
    });

    // 删除输入文件
    fs.unlinkSync(inputPath);

    // 设置自动删除输出文件（1小时后）
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`[${new Date().toISOString()}] 已删除: ${outputFilename}`);
      }
    }, 60 * 60 * 1000);

    res.json({
      success: true,
      message: '转换成功',
      downloadUrl: `/api/download/${outputFilename}`,
      filename: outputFilename
    });

  } catch (error) {
    // 清理文件
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    console.error('转换错误:', error);
    res.status(500).json({
      success: false,
      error: '转换失败',
      details: error.message
    });
  }
});

// 下载转换后的文件
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(outputDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({
      success: false,
      error: '文件不存在或已过期'
    });
  }

  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('下载错误:', err);
      res.status(500).json({
        success: false,
        error: '下载失败'
      });
    }
  });
});

// ==================== 用户认证 API（简化版） ====================

// 模拟用户数据库
const users = new Map();

// 注册
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: '请提供完整的注册信息'
    });
  }

  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      error: '该邮箱已被注册'
    });
  }

  const user = {
    id: Date.now().toString(),
    email,
    name,
    password, // 生产环境应该加密
    plan: 'free',
    createdAt: new Date().toISOString()
  };

  users.set(email, user);

  res.json({
    success: true,
    message: '注册成功',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan
    }
  });
});

// 登录
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '请提供邮箱和密码'
    });
  }

  const user = users.get(email);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    });
  }

  res.json({
    success: true,
    message: '登录成功',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan
    }
  });
});

// ==================== 订阅 API（简化版） ====================

app.post('/api/subscribe', (req, res) => {
  const { email, plan } = req.body;

  if (!email || !plan) {
    return res.status(400).json({
      success: false,
      error: '请提供邮箱和订阅计划'
    });
  }

  const user = users.get(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    });
  }

  user.plan = plan;
  user.subscriptionDate = new Date().toISOString();

  res.json({
    success: true,
    message: '订阅成功',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan
    }
  });
});

// ==================== 错误处理 ====================

// 404 处理
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ==================== 定时清理 ====================

// 清理过期文件
function cleanupOldFiles() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 小时

  [uploadsDir, outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;

    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error(`清理目录错误 ${dir}:`, err);
        return;
      }

      files.forEach(file => {
        const filepath = path.join(dir, file);
        fs.stat(filepath, (err, stats) => {
          if (err) return;

          if (now - stats.mtimeMs > maxAge) {
            fs.unlink(filepath, (err) => {
              if (!err) {
                console.log(`[${new Date().toISOString()}] 已清理: ${file}`);
              }
            });
          }
        });
      });
    });
  });
}

// 每小时执行一次清理
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// ==================== 启动服务器 ====================

const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 VideoConvert 服务器已启动`);
  console.log(`📍 环境: ${NODE_ENV}`);
  console.log(`🌐 地址: http://localhost:${PORT}`);
  console.log(`⏰ 时间: ${new Date().toISOString()}`);
  console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
