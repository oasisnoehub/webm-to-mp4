# WebM 转 MP4 转换器

一个简单易用的 SaaS 应用，用于将 WebM 视频文件转换为 MP4 格式。

## 🎯 两种使用方式

### 方式 1: 浏览器版（推荐 - 无需安装 FFmpeg）

**优点**: 
- ✅ 无需安装任何软件
- ✅ 完全在浏览器中处理，隐私安全
- ✅ 支持更大的文件（最大 500MB）
- ✅ 无需服务器

**使用方法**:
直接打开 `public/index-browser.html` 文件，或访问 http://localhost:3000/index-browser.html

### 方式 2: 服务器版（需要安装 FFmpeg）

**优点**:
- ✅ 转换速度更快
- ✅ 支持更多高级选项
- ✅ 适合批量处理

**使用方法**:
需要先安装 FFmpeg，然后启动服务器

## 功能特性

- ✅ 上传 WebM 文件（支持拖放和点击选择）
- ✅ 自动转换为 MP4 格式
- ✅ 下载转换后的 MP4 文件
- ✅ 美观的用户界面
- ✅ 实时转换进度显示
- ✅ 两种转换模式可选

## 技术栈

### 浏览器版
- **前端**: 原生 HTML/CSS/JavaScript
- **视频处理**: FFmpeg.wasm (WebAssembly)

### 服务器版
- **后端**: Node.js + Express
- **视频处理**: FFmpeg (通过 fluent-ffmpeg)
- **文件上传**: Multer
- **前端**: 原生 HTML/CSS/JavaScript

## 安装步骤

### 1. 安装 FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
从 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装

### 2. 安装项目依赖

```bash
npm install
```

## 运行应用

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

应用将在 `http://localhost:3000` 启动

## 快速开始 - 浏览器版（推荐）

**无需安装任何东西！**

1. 启动服务器（仅用于提供静态文件）:
   ```bash
   npm start
   ```

2. 打开浏览器访问:
   ```
   http://localhost:3000/index-browser.html
   ```

3. 使用步骤:
   - 拖放或点击选择 WebM 文件
   - 点击"开始转换"按钮（首次使用会自动下载转换工具）
   - 等待转换完成
   - 点击"下载 MP4 文件"

## 使用方法 - 服务器版

**需要先安装 FFmpeg**（参见下方安装说明）

1. 打开浏览器访问 `http://localhost:3000`
2. 拖放或点击选择 WebM 文件
3. 点击"开始转换"按钮
4. 等待转换完成
5. 点击"下载 MP4 文件"按钮下载转换后的视频

## API 接口

### POST /api/convert
上传并转换 WebM 文件

**请求:**
- Content-Type: multipart/form-data
- Body: video (file)

**响应:**
```json
{
  "success": true,
  "message": "转换成功",
  "downloadUrl": "/api/download/filename.mp4",
  "filename": "filename.mp4"
}
```

### GET /api/download/:filename
下载转换后的 MP4 文件

## 项目结构

```
.
├── server.js           # Express 服务器
├── package.json        # 项目配置
├── public/            # 前端文件
│   ├── index.html     # 主页面
│   ├── style.css      # 样式文件
│   └── script.js      # 前端逻辑
├── uploads/           # 上传文件临时目录（自动创建）
└── output/            # 转换后文件目录（自动创建）
```

## 注意事项

- 确保已安装 FFmpeg
- 上传文件大小限制为 100MB
- 转换后的文件会在下载 1 分钟后自动删除
- 仅支持 WebM 格式的视频文件

## 部署建议

部署到生产环境时，建议：

1. 使用环境变量配置端口
2. 添加文件清理定时任务
3. 配置 Nginx 反向代理
4. 使用 PM2 管理进程
5. 添加日志记录
6. 实现用户认证（如需要）

## 许可证

MIT
