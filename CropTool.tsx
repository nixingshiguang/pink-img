
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';

const CropTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [ratio, setRatio] = useState('1:1');
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file), status: 'idle' }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const processImages = async () => {
    setIsProcessing(true);
    const [rw, rh] = ratio.split(':').map(Number);
    
    for (const img of images) {
      if (img.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));
      
      const res = await new Promise<string>((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          let tw = tempImg.width;
          let th = tempImg.height;
          
          if (tw / th > rw / rh) {
            tw = th * (rw / rh);
          } else {
            th = tw * (rh / rw);
          }

          canvas.width = tw;
          canvas.height = th;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(tempImg, (tempImg.width - tw) / 2, (tempImg.height - th) / 2, tw, th, 0, 0, tw, th);
          resolve(canvas.toDataURL(img.file.type));
        };
        tempImg.src = img.preview;
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `cropped_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="裁剪图片"
      description="批量对图片进行中心裁剪至指定比例。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="开始裁剪"
    >
      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">选择裁剪比例</label>
        <div className="grid grid-cols-2 gap-2">
          {['1:1', '4:3', '16:9', '3:4'].map(r => (
            <button key={r} onClick={() => setRatio(r)} className={`py-3 rounded-xl border-2 font-bold transition-all ${ratio === r ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default CropTool;
