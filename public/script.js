let selectedFile = null;
let downloadUrl = null;

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
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const downloadBtn = document.getElementById('downloadBtn');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const errorMessage = document.getElementById('errorMessage');

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
    
    // 检查文件扩展名（有些浏览器可能不正确识别 MIME 类型）
    const fileName = file.name.toLowerCase();
    if (!file.type.includes('webm') && !fileName.endsWith('.webm')) {
        alert('请选择 WebM 格式的视频文件');
        return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
        alert('文件大小不能超过 100MB');
        return;
    }
    
    selectedFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
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
    
    const formData = new FormData();
    formData.append('video', selectedFile);
    
    try {
        console.log('发送请求到服务器...');
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });
        
        console.log('服务器响应状态:', response.status);
        const data = await response.json();
        console.log('服务器响应数据:', data);
        
        if (response.ok && data.success) {
            downloadUrl = data.downloadUrl;
            showResult();
        } else {
            showError(data.error || data.details || '转换失败，请重试');
        }
    } catch (error) {
        console.error('转换错误:', error);
        showError('网络错误: ' + error.message);
    }
});

// 下载文件
downloadBtn.addEventListener('click', () => {
    if (downloadUrl) {
        window.location.href = downloadUrl;
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
    downloadUrl = null;
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
