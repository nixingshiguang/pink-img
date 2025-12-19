
import React, { useState, useRef, useEffect } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { MousePointer2, Settings2, Check } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const InteractiveCropper: React.FC<{ 
  image: string, 
  onSave: (area: CropArea) => void, 
  onClose: () => void,
  initialArea?: CropArea
}> = ({ image, onSave, onClose, initialArea }) => {
  const [area, setArea] = useState<CropArea>(initialArea || { x: 10, y: 10, width: 80, height: 80 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<string | null>(null);
  const startPos = useRef({ x: 0, y: 0, area: { ...area } });

  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDragging.current = handle;
    startPos.current = { x: e.clientX, y: e.clientY, area: { ...area } };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - startPos.current.x) / rect.width) * 100;
    const dy = ((e.clientY - startPos.current.y) / rect.height) * 100;

    setArea(prev => {
      let next = { ...startPos.current.area };
      const h = isDragging.current;

      if (h === 'box') {
        next.x = Math.max(0, Math.min(100 - next.width, next.x + dx));
        next.y = Math.max(0, Math.min(100 - next.height, next.y + dy));
      } else {
        if (h.includes('e')) next.width = Math.max(5, Math.min(100 - next.x, next.width + dx));
        if (h.includes('w')) {
          const newX = Math.max(0, Math.min(next.x + next.width - 5, next.x + dx));
          next.width += (next.x - newX);
          next.x = newX;
        }
        if (h.includes('s')) next.height = Math.max(5, Math.min(100 - next.y, next.height + dy));
        if (h.includes('n')) {
          const newY = Math.max(0, Math.min(next.y + next.height - 5, next.y + dy));
          next.height += (next.y - newY);
          next.y = newY;
        }
      }
      return next;
    });
  };

  const handlePointerUp = () => {
    isDragging.current = null;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12">
      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800">自由裁剪设置</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">拖拽边缘或中心来定义区域</p>
          </div>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">取消</button>
            <button onClick={() => onSave(area)} className="px-8 py-2 bg-pink-500 text-white rounded-xl font-black shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>确认裁剪区域</span>
            </button>
          </div>
        </div>

        <div className="flex-grow p-8 bg-slate-50 flex items-center justify-center overflow-hidden">
          <div 
            ref={containerRef}
            className="relative shadow-2xl bg-white select-none touch-none"
            style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: 'auto' }}
          >
            <img src={image} alt="Crop preview" className="max-w-full max-h-[60vh] block pointer-events-none" />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>
            
            {/* Selection Area */}
            <div 
              className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
              style={{ 
                left: `${area.x}%`, 
                top: `${area.y}%`, 
                width: `${area.width}%`, 
                height: `${area.height}%` 
              }}
              onPointerDown={(e) => handlePointerDown(e, 'box')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div className="border-r border-white/30"></div>
              </div>

              {/* Handles */}
              {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(h => (
                <div 
                  key={h}
                  className={`absolute w-4 h-4 bg-white border-2 border-pink-500 rounded-full z-20 
                    ${h.includes('n') ? '-top-2' : h.includes('s') ? '-bottom-2' : 'top-1/2 -translate-y-1/2'}
                    ${h.includes('w') ? '-left-2' : h.includes('e') ? '-right-2' : 'left-1/2 -translate-x-1/2'}
                    ${h.length === 1 ? (h === 'n' || h === 's' ? 'cursor-ns-resize' : 'cursor-ew-resize') : (h === 'nw' || h === 'se' ? 'cursor-nwse-resize' : 'cursor-nesw-resize')}
                  `}
                  onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, h); }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CropTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [ratio, setRatio] = useState<string>('1:1');
  const [freeCropArea, setFreeCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
  const [isConfiguringFreeCrop, setIsConfiguringFreeCrop] = useState(false);
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
          let sx, sy, sw, sh;

          if (ratio === 'free') {
            sx = (freeCropArea.x / 100) * tempImg.width;
            sy = (freeCropArea.y / 100) * tempImg.height;
            sw = (freeCropArea.width / 100) * tempImg.width;
            sh = (freeCropArea.height / 100) * tempImg.height;
          } else {
            const [rw, rh] = ratio.split(':').map(Number);
            sw = tempImg.width;
            sh = tempImg.height;
            
            if (sw / sh > rw / rh) {
              sw = sh * (rw / rh);
            } else {
              sh = sw * (rh / rw);
            }
            sx = (tempImg.width - sw) / 2;
            sy = (tempImg.height - sh) / 2;
          }

          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(tempImg, sx, sy, sw, sh, 0, 0, sw, sh);
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
    <>
      <ToolPageLayout
        title="裁剪图片"
        description="批量对图片进行裁剪。支持固定比例或自由选择区域。"
        images={images}
        onAddFiles={addFiles}
        onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
        onProcess={processImages}
        isProcessing={isProcessing}
        actionText="开始裁剪"
      >
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">选择裁剪模式</label>
          <div className="grid grid-cols-2 gap-2">
            {['1:1', '4:3', '16:9', '3:4'].map(r => (
              <button 
                key={r} 
                onClick={() => setRatio(r)} 
                className={`py-3 rounded-xl border-2 font-bold transition-all ${ratio === r ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
              >
                {r}
              </button>
            ))}
            <button 
              onClick={() => setRatio('free')} 
              className={`col-span-2 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center space-x-2 
                ${ratio === 'free' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-4 h-4" />
              <span>自由裁剪</span>
            </button>
          </div>

          {ratio === 'free' && images.length > 0 && (
            <div className="mt-6 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => setIsConfiguringFreeCrop(true)}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-slate-700 transition-all shadow-xl"
              >
                <Settings2 className="w-5 h-5" />
                <span>配置裁剪区域</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">配置将应用于所有待处理图片</p>
            </div>
          )}
        </div>
      </ToolPageLayout>

      {isConfiguringFreeCrop && images.length > 0 && (
        <InteractiveCropper 
          image={images[0].preview} 
          initialArea={freeCropArea}
          onSave={(area) => {
            setFreeCropArea(area);
            setIsConfiguringFreeCrop(false);
          }}
          onClose={() => setIsConfiguringFreeCrop(false)}
        />
      )}
    </>
  );
};

export default CropTool;
