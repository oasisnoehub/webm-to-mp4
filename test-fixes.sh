#!/bin/bash

echo "========================================="
echo "FFmpeg.wasm 修复验证脚本"
echo "========================================="
echo ""

# 检查 Node.js
echo "1. 检查 Node.js..."
if command -v node &> /dev/null; then
    echo "   ✓ Node.js 已安装: $(node --version)"
else
    echo "   ✗ Node.js 未安装"
    exit 1
fi

# 检查 npm 依赖
echo ""
echo "2. 检查 npm 依赖..."
if [ -d "node_modules" ]; then
    echo "   ✓ node_modules 存在"
else
    echo "   ⚠ node_modules 不存在，正在安装..."
    npm install
fi

# 检查关键文件
echo ""
echo "3. 检查关键文件..."
files=(
    "public/index.html"
    "public/index-browser.html"
    "public/script-browser.js"
    "public/style.css"
    "server.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ✗ $file 不存在"
    fi
done

# 检查修复标记
echo ""
echo "4. 检查修复内容..."

# 检查 script-browser.js 中的修复
if grep -q "isConverting" "public/script-browser.js"; then
    echo "   ✓ 防止重复点击机制已添加"
else
    echo "   ✗ 防止重复点击机制未找到"
fi

if grep -q "ffmpeg.isLoaded" "public/script-browser.js"; then
    echo "   ✓ FFmpeg 加载验证已添加"
else
    echo "   ✗ FFmpeg 加载验证未找到"
fi

if grep -q "preloadFFmpeg" "public/script-browser.js"; then
    echo "   ✓ 预加载功能已添加"
else
    echo "   ✗ 预加载功能未找到"
fi

# 检查 index.html 中的修复
if grep -q "isConverting" "public/index.html"; then
    echo "   ✓ index.html 防止重复点击机制已添加"
else
    echo "   ✗ index.html 防止重复点击机制未找到"
fi

# 启动服务器测试
echo ""
echo "5. 准备启动服务器..."
echo ""
echo "========================================="
echo "验证完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 运行 'npm start' 启动服务器"
echo "2. 访问 http://localhost:3000/index-browser.html"
echo "3. 测试文件转换功能"
echo ""
echo "如果遇到问题："
echo "- 查看 FIXES_APPLIED.md 了解修复详情"
echo "- 查看 FFMPEG_ERROR_FIX.md 了解错误解决方案"
echo "- 使用 http://localhost:3000/diagnose.html 进行诊断"
echo ""
