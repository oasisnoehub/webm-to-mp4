# FFmpeg 安装指南（macOS 15）

由于你使用的是 macOS 15（预发布版本），Homebrew 暂时不支持。以下是几种安装 FFmpeg 的方法：

## 方法 1: 使用 Conda（推荐 - 你已经有 conda）

```bash
conda install -c conda-forge ffmpeg -y
```

如果网络慢，可以尝试：
```bash
conda install ffmpeg -y
```

## 方法 2: 手动下载预编译二进制文件

1. 访问 FFmpeg 官方网站下载页面：
   https://evermeet.cx/ffmpeg/

2. 下载 ffmpeg 的 DMG 或 ZIP 文件

3. 解压并移动到系统路径：
```bash
# 假设下载到了 ~/Downloads/ffmpeg
sudo cp ~/Downloads/ffmpeg /usr/local/bin/
sudo chmod +x /usr/local/bin/ffmpeg
```

## 方法 3: 使用 MacPorts（如果已安装）

```bash
sudo port install ffmpeg
```

## 方法 4: 从源代码编译（高级用户）

```bash
git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
cd ffmpeg
./configure
make
sudo make install
```

## 验证安装

安装完成后，运行以下命令验证：

```bash
ffmpeg -version
```

应该看到类似这样的输出：
```
ffmpeg version 6.x.x ...
```

## 安装完成后

1. 重启终端
2. 验证 FFmpeg 可用：`ffmpeg -version`
3. 重启 Node.js 服务器：`npm start`
4. 测试应用：访问 http://localhost:3000

## 临时解决方案

如果暂时无法安装 FFmpeg，我可以为你创建一个使用在线 API 的版本，或者使用纯 JavaScript 的视频处理库（功能会受限）。

请告诉我你想使用哪种方法！
