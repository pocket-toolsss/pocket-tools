const imageInput = document.getElementById('imageInput');
const watermarkText = document.getElementById('watermarkText');
const textColor = document.getElementById('textColor');
const opacity = document.getElementById('opacity');
const fontSize = document.getElementById('fontSize');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const placeholderText = document.getElementById('placeholderText');
const chips = document.querySelectorAll('.chip');

let currentImg = null;

// 點擊 3 個常用情境 Chip 填入文字
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    watermarkText.value = chip.dataset.text;
    if (currentImg) drawWatermark();
  });
});

// 監聽圖片上傳
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      currentImg = img;
      canvas.style.display = 'block';
      placeholderText.style.display = 'none';
      downloadBtn.disabled = false;
      drawWatermark();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 監聽控制項變更
[watermarkText, textColor, opacity, fontSize].forEach(input => {
  input.addEventListener('input', () => {
    if (input === watermarkText) {
      chips.forEach(c => c.classList.remove('active')); // 手動打字時取消選取樣式
    }
    if (currentImg) drawWatermark();
  });
});

// 繪製圖片與浮水印
function drawWatermark() {
  if (!currentImg) return;

  canvas.width = currentImg.width;
  canvas.height = currentImg.height;

  // 1. 繪製原圖
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(currentImg, 0, 0);

  // 2. 設定文字樣式與動態縮放
  const text = watermarkText.value || '僅限特定用途使用';
  const size = parseInt(fontSize.value, 10) * (canvas.width / 1000) + 12;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = textColor.value;
  ctx.globalAlpha = parseFloat(opacity.value);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 3. 動態計算文字寬度與安全間距（徹底解決重疊問題）
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  
  // 水平間距 = 字寬 + 留白 (1.5倍字寬)
  const stepX = textWidth + size * 2.5; 
  // 垂直間距 = 行高 (3倍字高)
  const stepY = size * 3; 

  // 4. 傾斜繪製
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((-20 * Math.PI) / 180);

  // 擴大繪製區域以涵蓋旋轉後的四角
  const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  
  let row = 0;
  for (let y = -diagonal; y < diagonal; y += stepY) {
    // 奇數行交錯（Staggered）偏移，讓整體排列更美觀自然
    const shiftX = (row % 2 === 0) ? 0 : stepX / 2;
    for (let x = -diagonal; x < diagonal; x += stepX) {
      ctx.fillText(text, x + shiftX, y);
    }
    row++;
  }
  
  ctx.restore();
}

// 下載圖片
downloadBtn.addEventListener('click', () => {
  if (!currentImg) return;
  const link = document.createElement('a');
  link.download = 'watermarked-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});