let selectedFile = null;
let ffmpeg = null;
let ffmpegLoaded = false;

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const fileSelected = document.getElementById('fileSelected');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const convertBtn = document.getElementById('convertBtn');
const progressSection = document.getElementById('progressSection');
const progressTitle = document.getElementById('progressTitle');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const downloadBtn = document.getElementById('downloadBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const errorMessage = document.getElementById('errorMessage');

let convertedBlob = null;

// 初始化 FFmpeg
async function loadFFmpeg() {
    if (ffmpegLoaded) return true;
    
    try {
        const { createFFmpeg, fetchFile } = FFmpeg;
        ffmpeg = createFFmpeg({ 
            log: true,
            logger: ({ type, message }) => {
                if (type === 'fferr' && message.includes('error')) {
                    console.error(`FFmpeg: ${message}`);
                }
            },
            progress: ({ ratio }) => {
                const percent = Math.round(ratio * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `转换进度: ${percent}%`;
            }
        });
        
        progressTitle.textContent = '正在加载转换工具...';
        progressText.textContent = '首次使用需要下载约 30MB 的转换工具';
        
        await ffmpeg.load();
        
        // 验证 FFmpeg 是否真的加载成功
        if (!ffmpeg.isLoaded || !ffmpeg.isLoaded()) {
            throw new Error('FFmpeg 未完全加载');
        }
        
        ffmpegLoaded = true;
        console.log('✓ FFmpeg 加载成功');
        return true;
    } catch (error) {
        console.error('FFmpeg 加载失败:', error);
        ffmpegLoaded = false;
        ffmpeg = null;
        return false;
    }
}

// 点击选择文件
selectFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

uploadArea.addEventListener('click', (e) => {
    if (e.target === uploadArea || e.target.closest('.upload-area')) {
        fileInput.click();
    }
});

// 文件选择
fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
});

// 拖放功能
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});

// 处理文件
function handleFile(file) {
    if (!file) return;
    
    const fileNameLower = file.name.toLowerCase();
    if (!file.type.includes('webm') && !fileNameLower.endsWith('.webm')) {
        alert('请选择 WebM 格式的视频文件');
        return;
    }
    
    if (file.size > 500 * 1024 * 1024) {
        alert('文件大小不能超过 500MB');
        return;
    }
    
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    uploadArea.style.display = 'none';
    fileSelected.style.display = 'block';
}

// 移除文件
removeFileBtn.addEventListener('click', () => {
    resetUpload();
});

// 防止重复点击
let isConverting = false;

// 开始转换
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('请先选择文件');
        return;
    }
    
    // 防止重复点击
    if (isConverting) {
        alert('转换正在进行中，请稍候...');
        return;
    }
    
    isConverting = true;
    convertBtn.disabled = true;
    convertBtn.style.opacity = '0.6';
    convertBtn.style.cursor = 'not-allowed';
    
    console.log('开始转换文件:', selectedFile.name);
    
    fileSelected.style.display = 'none';
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    
    try {
        // 加载 FFmpeg
        if (!ffmpegLoaded) {
            const loaded = await loadFFmpeg();
            if (!loaded) {
                throw new Error('无法加载转换工具，请刷新页面重试');
            }
        }
        
        // 再次验证 FFmpeg 是否准备好
        if (!ffmpeg || !ffmpeg.isLoaded || !ffmpeg.isLoaded()) {
            throw new Error('FFmpeg 未完全加载，请刷新页面重试');
        }
        
        // 验证文件系统是否可用
        if (!ffmpeg.FS) {
            throw new Error('FFmpeg 文件系统不可用，请刷新页面重试');
        }
        
        progressTitle.textContent = '正在转换...';
        progressText.textContent = '正在处理您的视频';
        
        const inputFileName = 'input.webm';
        const outputFileName = 'output.mp4';
        
        // 写入文件到 FFmpeg 虚拟文件系统
        console.log('写入输入文件...');
        const inputData = await FFmpeg.fetchFile(selectedFile);
        ffmpeg.FS('writeFile', inputFileName, inputData);
        console.log(`✓ 输入文件写入成功: ${inputData.length} 字节`);
        
        // 尝试多种转换方法
        const methods = [
            {
                name: '快速转换',
                args: ['-i', inputFileName, '-c', 'copy', outputFileName]
            },
            {
                name: '标准转换',
                args: ['-i', inputFileName, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outputFileName]
            },
            {
                name: '兼容转换',
                args: ['-i', inputFileName, '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputFileName]
            }
        ];
        
        let success = false;
        let data = null;
        
        for (const method of methods) {
            console.log(`尝试${method.name}...`);
            progressText.textContent = `正在尝试${method.name}...`;
            
            try {
                await ffmpeg.run(...method.args);
                data = ffmpeg.FS('readFile', outputFileName);
                
                if (data && data.length > 0) {
                    console.log(`✓ ${method.name}成功！输出大小: ${data.length} 字节`);
                    success = true;
                    
                    // 清理输出文件
                    try {
                        ffmpeg.FS('unlink', outputFileName);
                    } catch (e) {
                        console.warn('清理输出文件失败:', e);
                    }
                    break;
                }
            } catch (error) {
                console.warn(`${method.name}失败:`, error.message);
            }
        }
        
        // 清理输入文件
        try {
            ffmpeg.FS('unlink', inputFileName);
        } catch (e) {
            console.warn('清理输入文件失败:', e);
        }
        
        if (success && data) {
            convertedBlob = new Blob([data.buffer], { type: 'video/mp4' });
            showResult();
        } else {
            throw new Error('所有转换方法都失败了，请尝试其他文件或刷新页面重试');
        }
        
    } catch (error) {
        console.error('转换错误:', error);
        
        // 显示友好的错误提示
        let errorMsg = error.message;
        if (errorMsg.includes('not ready') || errorMsg.includes('未完全加载')) {
            errorMsg = 'FFmpeg 加载未完成，请刷新页面后重试';
        } else if (errorMsg.includes('load') || errorMsg.includes('加载')) {
            errorMsg = 'FFmpeg 加载失败，可能是网络问题，请检查网络连接后刷新页面重试';
        }
        
        showError(errorMsg);
        
        // 重置 FFmpeg 状态
        ffmpegLoaded = false;
        ffmpeg = null;
    } finally {
        // 恢复按钮状态
        isConverting = false;
        convertBtn.disabled = false;
        convertBtn.style.opacity = '1';
        convertBtn.style.cursor = 'pointer';
    }
});

// 下载文件
downloadBtn.addEventListener('click', () => {
    if (convertedBlob) {
        const url = URL.createObjectURL(convertedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name.replace(/\.webm$/i, '.mp4');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

// 转换另一个文件
convertAnotherBtn.addEventListener('click', () => {
    resetUpload();
});

// 重试
tryAgainBtn.addEventListener('click', () => {
    resetUpload();
});

// 显示结果
function showResult() {
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';
}

// 显示错误
function showError(message) {
    progressSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// 重置上传
function resetUpload() {
    selectedFile = null;
    convertedBlob = null;
    fileInput.value = '';
    
    uploadArea.style.display = 'block';
    fileSelected.style.display = 'none';
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 预加载 FFmpeg（提升用户体验）
let ffmpegPreloading = false;

function preloadFFmpeg() {
    if (ffmpegLoaded || ffmpegPreloading || ffmpeg) return;
    
    ffmpegPreloading = true;
    console.log('开始预加载 FFmpeg...');
    
    loadFFmpeg()
        .then((success) => {
            if (success) {
                console.log('✓ FFmpeg 预加载成功');
            } else {
                console.warn('FFmpeg 预加载失败');
            }
        })
        .catch((error) => {
            console.warn('FFmpeg 预加载错误:', error);
        })
        .finally(() => {
            ffmpegPreloading = false;
        });
}

// 页面加载完成后延迟预加载（避免影响页面加载速度）
window.addEventListener('load', () => {
    setTimeout(() => {
        preloadFFmpeg();
    }, 3000); // 3秒后开始预加载
});
