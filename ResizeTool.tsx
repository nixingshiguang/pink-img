
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const ResizeTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [scale, setScale] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file), status: 'idle' }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const processImages = async () => {
    setIsProcessing(true);
    for (const img of images) {
      if (img.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
      
      const res = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const tempImg = new Image();
          tempImg.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = tempImg.width * (scale / 100);
            canvas.height = tempImg.height * (scale / 100);
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(img.file.type));
          };
          tempImg.src = e.target?.result as string;
        };
        reader.readAsDataURL(img.file);
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `resized_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="调整图像的大小"
      description="按百分比缩放您的 JPG, PNG 或 WEBP 图片。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="调整大小"
    >
      <div className="space-y-6">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4">缩放百分比 ({scale}%)</label>
          <input type="range" min="10" max="200" value={scale} onChange={(e) => setScale(parseInt(e.target.value))} className="w-full accent-pink-500" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[25, 50, 75].map(s => (
            <button key={s} onClick={() => setScale(s)} className={`py-2 rounded-lg text-xs font-bold border ${scale === s ? 'bg-pink-500 text-white' : 'bg-white text-slate-500'}`}>{s}%</button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default ResizeTool;
