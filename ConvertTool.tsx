
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const ConvertTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [targetFormat, setTargetFormat] = useState('image/jpeg');
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
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(tempImg, 0, 0);
          resolve(canvas.toDataURL(targetFormat));
        };
        tempImg.src = img.preview;
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const ext = targetFormat.split('/')[1];
      const link = document.createElement('a');
      link.href = res;
      link.download = `${img.file.name.split('.')[0]}.${ext}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="转换至图片格式"
      description="批量转换图片文件格式。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="开始转换"
    >
      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">目标格式</label>
        <div className="space-y-2">
          {[
            { label: 'JPG (适合照片)', mime: 'image/jpeg' },
            { label: 'PNG (透明背景)', mime: 'image/png' },
            { label: 'WEBP (极致体积)', mime: 'image/webp' }
          ].map(f => (
            <button key={f.mime} onClick={() => setTargetFormat(f.mime)} className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm font-bold transition-all ${targetFormat === f.mime ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default ConvertTool;
