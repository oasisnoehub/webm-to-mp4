const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 添加必要的头部以支持 SharedArrayBuffer（FFmpeg.wasm 需要）
app.use((req, res, next) => {
  // 设置 COOP 和 COEP 头部
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  // 允许跨域资源共享（用于 CDN 资源）
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // 缓存控制
  if (req.url.includes('.wasm') || req.url.includes('ffmpeg')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  
  next();
});

app.use(express.static('public'));

// 创建必要的目录
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

[uploadsDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置文件上传
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
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'video/webm' || ext === '.webm') {
      cb(null, true);
    } else {
      cb(new Error('只支持 WebM 格式文件'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB 限制
});

// 上传并转换接口
app.post('/api/convert', upload.single('video'), (req, res) => {
  console.log('收到转换请求');
  
  if (!req.file) {
    console.log('没有文件上传');
    return res.status(400).json({ error: '请上传文件' });
  }

  console.log('上传的文件:', req.file.originalname, '大小:', req.file.size);

  const inputPath = req.file.path;
  const outputFilename = path.basename(req.file.filename, '.webm') + '.mp4';
  const outputPath = path.join(outputDir, outputFilename);

  // 使用 ffmpeg 转换
  ffmpeg(inputPath)
    .output(outputPath)
    .videoCodec('libx264')
    .audioCodec('aac')
    .on('start', (commandLine) => {
      console.log('开始转换:', commandLine);
    })
    .on('progress', (progress) => {
      if (progress.percent) {
        console.log('转换进度:', Math.round(progress.percent) + '%');
      }
    })
    .on('end', () => {
      console.log('转换完成');
      
      // 删除原始上传文件
      fs.unlink(inputPath, (err) => {
        if (err) console.error('删除上传文件失败:', err);
      });

      res.json({
        success: true,
        message: '转换成功',
        downloadUrl: `/api/download/${outputFilename}`,
        filename: outputFilename
      });
    })
    .on('error', (err) => {
      console.error('转换错误:', err);
      
      // 清理文件
      fs.unlink(inputPath, () => {});
      
      let errorMsg = err.message;
      if (errorMsg.includes('ffmpeg') || errorMsg.includes('spawn')) {
        errorMsg = 'FFmpeg 未安装或无法运行。请先安装 FFmpeg: brew install ffmpeg';
      }
      
      res.status(500).json({
        error: '转换失败',
        details: errorMsg
      });
    })
    .run();
});

// 下载接口
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('下载错误:', err);
    }
    
    // 下载完成后删除文件（可选）
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('删除输出文件失败:', err);
      });
    }, 60000); // 1分钟后删除
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '文件大小超过 100MB 限制' });
    }
    return res.status(400).json({ error: '文件上传错误: ' + err.message });
  }
  
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
