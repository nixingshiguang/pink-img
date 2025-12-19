
import React, { useState, useRef, useEffect } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { MousePointer2, Settings2, Check, X, ShieldAlert, Eraser, PenTool, Square, Info, History, Zap, Circle, Wind } from 'lucide-react';

type BlurType = 'mosaic' | 'blur' | 'pixelate' | 'motion-blur';

interface BlurAction {
  points: {x: number, y: number}[];
  size: number;
  type: BlurType;
  strength: number;
  angle?: number; // Only for motion blur
}

const BlurEditor: React.FC<{
  image: string,
  onSave: (result: string) => void,
  onClose: () => void
}> = ({ image, onSave, onClose }) => {
  const [blurType, setBlurType] = useState<BlurType>('mosaic');
  const [brushSize, setBrushSize] = useState(50);
  const [strength, setStrength] = useState(25);
  const [angle, setAngle] = useState(0);
  const [actions, setActions] = useState<BlurAction[]>([]);
  const [currentPoints, setCurrentPoints] = useState<{x: number, y: number}[]>([]);
  
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.width;
        maskCanvasRef.current.height = img.height;
      }
    };
    img.src = image;
  }, [image]);

  const drawMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    [...actions, { points: currentPoints, size: brushSize, type: blurType, strength, angle }].forEach(action => {
      if (action.points.length === 0) return;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = action.size;
      ctx.strokeStyle = 'rgba(255, 0, 122, 0.4)';
      ctx.moveTo(action.points[0].x, action.points[0].y);
      action.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  };

  useEffect(() => {
    drawMask();
  }, [actions, currentPoints]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDrawing.current = true;
    const rect = maskCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = maskCanvasRef.current!.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    setCurrentPoints([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    const rect = maskCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = maskCanvasRef.current!.width / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    setActions(prev => [...prev, { points: currentPoints, size: brushSize, type: blurType, strength, angle }]);
    setCurrentPoints([]);
  };

  const applyEffects = () => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;
    
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = mainCanvas.width;
    finalCanvas.height = mainCanvas.height;
    const fCtx = finalCanvas.getContext('2d')!;
    fCtx.drawImage(mainCanvas, 0, 0);

    actions.forEach(action => {
      const effectCanvas = document.createElement('canvas');
      effectCanvas.width = mainCanvas.width;
      effectCanvas.height = mainCanvas.height;
      const eCtx = effectCanvas.getContext('2d')!;
      
      const s = Math.max(2, action.strength);

      if (action.type === 'mosaic') {
        // 高级马赛克逻辑：像素精确对齐
        eCtx.imageSmoothingEnabled = false;
        eCtx.drawImage(mainCanvas, 0, 0, mainCanvas.width / s, mainCanvas.height / s);
        eCtx.drawImage(effectCanvas, 0, 0, mainCanvas.width / s, mainCanvas.height / s, 0, 0, mainCanvas.width, mainCanvas.height);
      } else if (action.type === 'pixelate') {
        // 圆点像素化：使用缓冲数据提升性能
        const sourceData = mainCanvas.getContext('2d')!.getImageData(0, 0, mainCanvas.width, mainCanvas.height).data;
        eCtx.fillStyle = '#f0f0f0';
        eCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
        for (let y = 0; y < mainCanvas.height; y += s) {
          for (let x = 0; x < mainCanvas.width; x += s) {
            const i = (Math.floor(y) * mainCanvas.width + Math.floor(x)) * 4;
            eCtx.fillStyle = `rgb(${sourceData[i]}, ${sourceData[i+1]}, ${sourceData[i+2]})`;
            eCtx.beginPath();
            eCtx.arc(x + s/2, y + s/2, s/2 * 0.85, 0, Math.PI * 2);
            eCtx.fill();
          }
        }
      } else if (action.type === 'motion-blur') {
        // 增强型运动模糊
        const steps = 15;
        const rad = (action.angle || 0) * (Math.PI / 180);
        eCtx.globalAlpha = 1 / steps;
        for (let i = 0; i < steps; i++) {
          const shift = (i / steps) * action.strength;
          eCtx.drawImage(mainCanvas, Math.cos(rad) * shift, Math.sin(rad) * shift);
        }
      } else {
        eCtx.filter = `blur(${action.strength}px)`;
        eCtx.drawImage(mainCanvas, 0, 0);
      }

      // 笔刷涂抹应用
      const pattern = fCtx.createPattern(effectCanvas, 'no-repeat')!;
      fCtx.save();
      fCtx.beginPath();
      fCtx.lineCap = 'round';
      fCtx.lineJoin = 'round';
      fCtx.lineWidth = action.size;
      fCtx.moveTo(action.points[0].x, action.points[0].y);
      action.points.forEach(p => fCtx.lineTo(p.x, p.y));
      fCtx.strokeStyle = pattern;
      fCtx.stroke();
      fCtx.restore();
    });

    onSave(finalCanvas.toDataURL('image/png'));
  };

  const handleUndo = () => {
    setActions(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex flex-col md:flex-row h-screen">
      <div className="flex-grow flex flex-col min-h-0 overflow-hidden relative">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors"><X /></button>
            <h3 className="text-xl font-black text-white tracking-tight">隐私遮盖编辑器</h3>
          </div>
          <div className="flex space-x-3">
             <button onClick={handleUndo} disabled={actions.length === 0} className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20 disabled:opacity-30">
              <History className="w-4 h-4" />
              <span>撤销上一步</span>
            </button>
            <button onClick={applyEffects} className="px-8 py-2 bg-pink-500 text-white rounded-xl font-black shadow-lg shadow-pink-500/30 hover:bg-pink-600 transition-all flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>确认修改</span>
            </button>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center p-8 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden">
          <div className="relative shadow-2xl bg-white select-none touch-none" style={{ maxWidth: '100%', maxHeight: '80vh' }}>
            <canvas ref={mainCanvasRef} className="max-w-full max-h-[80vh] block" />
            <canvas 
              ref={maskCanvasRef} 
              className="absolute inset-0 max-w-full max-h-[80vh] opacity-100 pointer-events-auto cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 bg-white border-l border-slate-100 p-8 flex flex-col overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-800">遮盖工具箱</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase">多样化笔刷样式</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">遮盖样式</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'mosaic', label: '高清马赛克', icon: <Square className="w-5 h-5" /> },
                { id: 'pixelate', label: '几何像素点', icon: <Circle className="w-5 h-5" /> },
                { id: 'blur', label: '精密模糊', icon: <PenTool className="w-5 h-5" /> },
                { id: 'motion-blur', label: '动感拖影', icon: <Wind className="w-5 h-5" /> },
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setBlurType(opt.id as BlurType)} 
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${blurType === opt.id ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-md' : 'border-slate-50 text-slate-400 hover:border-pink-100'}`}
                >
                  <div className="mb-2">{opt.icon}</div>
                  <span className="text-[10px] font-black">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-50">
            <div>
              <div className="flex justify-between text-[11px] font-black text-slate-600 mb-4 uppercase">
                <span>笔触大小</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{brushSize}px</span>
              </div>
              <input type="range" min="10" max="250" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-black text-slate-600 mb-4 uppercase">
                <span>效果强度</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-full">{strength}</span>
              </div>
              <input type="range" min="4" max="100" value={strength} onChange={(e) => setStrength(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            </div>

            {blurType === 'motion-blur' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between text-[11px] font-black text-slate-600 mb-4 uppercase">
                  <span>模糊方向</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full">{angle}°</span>
                </div>
                <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500" />
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed font-medium">
             <div className="flex items-center space-x-2 text-pink-500 mb-2">
                <Zap className="w-3 h-3" />
                <span className="font-black uppercase">处理提示</span>
             </div>
             马赛克强度越高像素块越大。几何像素点适用于遮挡人像，既能隐藏身份又具有艺术感。所有操作均在本地 Canvas 离屏渲染，保证隐私安全。
          </div>
        </div>
      </div>
    </div>
  );
};

const BlurTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
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

  const handleSave = (result: string) => {
    if (editingImageId) {
      setImages(prev => prev.map(img => img.id === editingImageId ? { ...img, result, status: 'done' } : img));
      setEditingImageId(null);
    }
  };

  const processImages = async () => {
    setIsProcessing(true);
    for (const img of images) {
      if (!img.result) continue;
      const link = document.createElement('a');
      link.href = img.result;
      link.download = `pink_privacy_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  const editingImage = images.find(img => img.id === editingImageId);

  return (
    <>
      <ToolPageLayout
        title="隐私遮盖与马赛克"
        description="专业级的本地图像脱敏工具。提供马赛克、圆点像素化等多种艺术化遮盖方案。"
        images={images}
        onAddFiles={addFiles}
        onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
        onProcess={processImages}
        isProcessing={isProcessing}
        actionText="导出已遮盖图片"
        imageAction={(img) => (
          <button 
            onClick={() => setEditingImageId(img.id)}
            className="bg-white/90 hover:bg-white text-pink-500 p-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2"
          >
            <PenTool className="w-4 h-4" />
            <span className="text-xs font-black">进入编辑器</span>
          </button>
        )}
      >
        <div className="bg-pink-50 p-6 rounded-3xl border border-pink-100 space-y-3">
          <div className="flex items-center space-x-3 text-pink-500">
            <ShieldAlert className="w-6 h-6" />
            <span className="text-sm font-black">100% 本地脱敏</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            本工具不涉及任何服务端上传，您的原始图像和处理逻辑全部在本地浏览器内存中运行。
          </p>
        </div>
      </ToolPageLayout>

      {editingImageId && editingImage && (
        <BlurEditor 
          image={editingImage.preview}
          onSave={handleSave}
          onClose={() => setEditingImageId(null)}
        />
      )}
    </>
  );
};

export default BlurTool;
