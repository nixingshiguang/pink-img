
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const CompressTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [quality, setQuality] = useState(0.7);
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
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const tempImg = new Image();
          tempImg.onload = () => {
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
            ctx?.drawImage(tempImg, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          tempImg.src = e.target?.result as string;
        };
        reader.readAsDataURL(img.file);
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `compressed_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="压缩图像文件"
      description="在保持最佳质量的前提下减少图片文件的大小。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="压缩图片"
    >
      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider">压缩级别</label>
        <div className="grid grid-cols-1 gap-2">
          {[0.9, 0.7, 0.4].map((q, idx) => (
            <button key={q} onClick={() => setQuality(q)} className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${quality === q ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-100 text-slate-500 hover:border-pink-100'}`}>
              {idx === 0 ? '极致质量 (低压缩)' : idx === 1 ? '推荐 (平衡)' : '小文件 (高压缩)'}
            </button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default CompressTool;
