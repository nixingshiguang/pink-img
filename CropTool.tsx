
import React, { useState, useRef, useEffect } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { MousePointer2, Settings2, Check, Crop as CropIcon } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: string;
  customCropArea?: CropArea;
  customRatio?: string;
  error?: string;
}

const InteractiveCropper: React.FC<{ 
  image: string, 
  onSave: (area: CropArea) => void, 
  onClose: () => void,
  initialArea?: CropArea,
  fixedRatio?: string
}> = ({ image, onSave, onClose, initialArea, fixedRatio }) => {
  const [area, setArea] = useState<CropArea>(initialArea || { x: 10, y: 10, width: 80, height: 80 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<string | null>(null);
  const startPos = useRef({ x: 0, y: 0, area: { ...area } });

  // Handle fixed ratio adjustments if needed
  useEffect(() => {
    if (fixedRatio && fixedRatio !== 'free') {
      const [rw, rh] = fixedRatio.split(':').map(Number);
      setArea(prev => {
        const next = { ...prev };
        // Simple logic to force ratio on initial load
        if (next.width / next.height !== rw / rh) {
           next.height = next.width * (rh / rw);
           if (next.y + next.height > 100) {
             next.height = 100 - next.y;
             next.width = next.height * (rw / rh);
           }
        }
        return next;
      });
    }
  }, [fixedRatio]);

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
      const ratio = fixedRatio && fixedRatio !== 'free' ? fixedRatio.split(':').map(Number) : null;

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

        // Apply Aspect Ratio Constraint if set
        if (ratio) {
          const targetRatio = ratio[0] / ratio[1];
          if (h === 'e' || h === 'w' || h === 's' || h === 'n') {
             // Handle simple side dragging with ratio is tricky, usually disabled or locked
             // For now we'll allow corner ratio locking
          } else {
             // Corner dragging ratio lock
             if (h.includes('e') || h.includes('w')) {
               next.height = next.width / targetRatio;
               if (next.y + next.height > 100) {
                 next.height = 100 - next.y;
                 next.width = next.height * targetRatio;
               }
             }
          }
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
            <h3 className="text-xl font-black text-slate-800">设置裁剪区域</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              {fixedRatio && fixedRatio !== 'free' ? `比例锁定: ${fixedRatio}` : '自由拖拽边缘或中心来定义区域'}
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={onClose} className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors">取消</button>
            <button onClick={() => onSave(area)} className="px-8 py-2 bg-pink-500 text-white rounded-xl font-black shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>确认裁剪</span>
            </button>
          </div>
        </div>

        <div className="flex-grow p-8 bg-slate-50 flex items-center justify-center overflow-hidden">
          <div 
            ref={containerRef}
            className="relative shadow-2xl bg-white select-none touch-none"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalRatio, setGlobalRatio] = useState<string>('1:1');
  const [globalCropArea, setGlobalCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 80 });
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs: ImageItem[] = files.map(file => ({ 
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
          let sx, sy, sw, sh;

          // Use custom settings if available, else global
          const activeRatio = img.customRatio || globalRatio;
          const activeArea = img.customCropArea || globalCropArea;

          if (activeRatio === 'free' || img.customCropArea) {
            sx = (activeArea.x / 100) * tempImg.width;
            sy = (activeArea.y / 100) * tempImg.height;
            sw = (activeArea.width / 100) * tempImg.width;
            sh = (activeArea.height / 100) * tempImg.height;
          } else {
            const [rw, rh] = activeRatio.split(':').map(Number);
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

  const handleCustomCropSave = (area: CropArea) => {
    if (croppingImageId) {
      setImages(prev => prev.map(img => img.id === croppingImageId ? { ...img, customCropArea: area, customRatio: globalRatio } : img));
      setCroppingImageId(null);
    }
  };

  const croppingImage = images.find(img => img.id === croppingImageId);

  return (
    <>
      <ToolPageLayout
        title="裁剪图片"
        description="批量对图片进行裁剪。支持固定比例或为每张图片设置单独区域。"
        images={images}
        onAddFiles={addFiles}
        onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
        onProcess={processImages}
        isProcessing={isProcessing}
        actionText="开始批量裁剪"
        imageAction={(img) => (
          <button 
            onClick={() => setCroppingImageId(img.id)}
            className="bg-white/90 hover:bg-white text-pink-500 p-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2"
          >
            <CropIcon className="w-4 h-4" />
            <span className="text-xs font-black">调整此图</span>
          </button>
        )}
      >
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">全局默认比例</label>
          <div className="grid grid-cols-2 gap-2">
            {['1:1', '4:3', '16:9', '3:4'].map(r => (
              <button 
                key={r} 
                onClick={() => setGlobalRatio(r)} 
                className={`py-3 rounded-xl border-2 font-bold transition-all ${globalRatio === r ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
              >
                {r}
              </button>
            ))}
            <button 
              onClick={() => setGlobalRatio('free')} 
              className={`col-span-2 py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center space-x-2 
                ${globalRatio === 'free' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
            >
              <MousePointer2 className="w-4 h-4" />
              <span>自由比例</span>
            </button>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">如何操作</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              1. 选择全局比例作为默认。<br/>
              2. 鼠标悬停在上方单张图片，点击<b>“调整此图”</b>为特定图片定义精确区域。<br/>
              3. 点击右下角按钮一键应用并导出。
            </p>
          </div>
        </div>
      </ToolPageLayout>

      {croppingImageId && croppingImage && (
        <InteractiveCropper 
          image={croppingImage.preview} 
          initialArea={croppingImage.customCropArea || globalCropArea}
          fixedRatio={globalRatio}
          onSave={handleCustomCropSave}
          onClose={() => setCroppingImageId(null)}
        />
      )}
    </>
  );
};

export default CropTool;
