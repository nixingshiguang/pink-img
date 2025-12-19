
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { RotateCw, RotateCcw } from 'lucide-react';

const RotateTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [angle, setAngle] = useState(90);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ 
      id: Math.random().toString(36).substr(2, 9), 
      file, 
      preview: URL.createObjectURL(file), 
      status: 'idle' 
    }));
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
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            resolve('');
            return;
          }

          // Adjust canvas size based on rotation
          if (angle === 90 || angle === 270) {
            canvas.width = tempImg.height;
            canvas.height = tempImg.width;
          } else {
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
          }

          // Clear and rotate
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);
          
          resolve(canvas.toDataURL(img.file.type));
        };
        tempImg.src = img.preview;
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `rotated_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="旋转一个图片"
      description="同时旋转多个 JPG, PNG 或 GIF 图片。支持 90°, 180°, 270° 旋转。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="旋转图片"
    >
      <div className="space-y-6">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-4">选择旋转角度</label>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: '顺时针 90°', val: 90, icon: <RotateCw className="w-4 h-4" /> },
            { label: '顺时针 180°', val: 180, icon: <RotateCw className="w-4 h-4" /> },
            { label: '顺时针 270°', val: 270, icon: <RotateCw className="w-4 h-4" /> },
            { label: '逆时针 90°', val: -90, icon: <RotateCcw className="w-4 h-4" /> }
          ].map(opt => (
            <button 
              key={opt.val} 
              onClick={() => setAngle(opt.val)} 
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 font-bold transition-all text-sm
                ${(angle === opt.val || (angle === 270 && opt.val === -90)) ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        
        <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 flex flex-col items-center">
          <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-3">旋转预览</p>
          <div className="w-24 h-24 bg-white rounded-lg shadow-sm border border-pink-100 flex items-center justify-center overflow-hidden">
             <div 
              className="w-12 h-16 bg-pink-100 rounded border-2 border-pink-200 transition-transform duration-500 flex items-center justify-center"
              style={{ transform: `rotate(${angle}deg)` }}
             >
               <div className="w-1 h-4 bg-pink-300 rounded-full mb-4"></div>
             </div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default RotateTool;
