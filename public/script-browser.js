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
            progress: ({ ratio }) => {
                const percent = Math.round(ratio * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `转换进度: ${percent}%`;
            }
        });
        
        progressTitle.textContent = '正在加载转换工具...';
        progressText.textContent = '首次使用需要下载约 30MB 的转换工具';
        
        await ffmpeg.load();
        
        ffmpegLoaded = true;
        console.log('FFmpeg 加载成功');
        return true;
    } catch (error) {
        console.error('FFmpeg 加载失败:', error);
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

// 开始转换
convertBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        alert('请先选择文件');
        return;
    }
    
    console.log('开始转换文件:', selectedFile.name);
    
    fileSelected.style.display = 'none';
    progressSection.style.display = 'block';
    progressFill.style.width = '0%';
    
    try {
        // 加载 FFmpeg
        if (!ffmpegLoaded) {
            const loaded = await loadFFmpeg();
            if (!loaded) {
                throw new Error('无法加载转换工具');
            }
        }
        
        progressTitle.textContent = '正在转换...';
        progressText.textContent = '正在处理您的视频';
        
        const inputFileName = 'input.webm';
        const outputFileName = 'output.mp4';
        
        // 写入文件到 FFmpeg 虚拟文件系统
        ffmpeg.FS('writeFile', inputFileName, await FFmpeg.fetchFile(selectedFile));
        
        // 执行转换
        await ffmpeg.run(
            '-i', inputFileName,
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-movflags', '+faststart',
            outputFileName
        );
        
        // 读取输出文件
        const data = ffmpeg.FS('readFile', outputFileName);
        convertedBlob = new Blob([data.buffer], { type: 'video/mp4' });
        
        // 清理
        ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);
        
        showResult();
    } catch (error) {
        console.error('转换错误:', error);
        showError('转换失败: ' + error.message);
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
