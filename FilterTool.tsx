
import React, { useState, useRef, useEffect } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { Palette, Sun, Contrast as ContrastIcon, Droplets, Zap, Settings2, Check, X, MousePointer2 } from 'lucide-react';

interface FilterConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
  blur: number;
}

const PRESETS = [
  { id: 'none', label: '原图', config: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 } },
  { id: 'grayscale', label: '黑白', config: { brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 100, hueRotate: 0, blur: 0 } },
  { id: 'sepia', label: '怀旧', config: { brightness: 100, contrast: 100, saturation: 100, sepia: 100, grayscale: 0, hueRotate: 0, blur: 0 } },
  { id: 'vintage', label: '复古', config: { brightness: 90, contrast: 120, saturation: 80, sepia: 50, grayscale: 0, hueRotate: 0, blur: 0 } },
  { id: 'vibrant', label: '鲜艳', config: { brightness: 110, contrast: 110, saturation: 150, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0 } },
  { id: 'dramatic', label: '戏剧', config: { brightness: 80, contrast: 150, saturation: 120, sepia: 20, grayscale: 0, hueRotate: 0, blur: 0 } },
];

const FilterDesigner: React.FC<{
  previewImage: string;
  config: FilterConfig;
  setConfig: React.Dispatch<React.SetStateAction<FilterConfig>>;
  onSave: () => void;
  onClose: () => void;
}> = ({ previewImage, config, setConfig, onSave, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const constructFilterString = (c: FilterConfig) => {
    return `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) sepia(${c.sepia}%) grayscale(${c.grayscale}%) hue-rotate(${c.hueRotate}deg) blur(${c.blur}px)`;
  };

  const handlePointerDown = () => { isDragging.current = true; };
  const handlePointerUp = () => { isDragging.current = false; };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Comparison Preview Area */}
      <div className="flex-grow flex flex-col min-h-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:20px_20px] relative">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors"><X /></button>
            <h3 className="text-xl font-black text-white">滤镜实时对比</h3>
          </div>
          <button onClick={onSave} className="px-8 py-2 bg-pink-500 text-white rounded-xl font-black shadow-lg shadow-pink-500/30 hover:bg-pink-600 transition-all flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>应用此配置</span>
          </button>
        </div>

        <div className="flex-grow flex items-center justify-center p-8 select-none">
          <div 
            ref={containerRef}
            className="relative shadow-2xl bg-black rounded-lg overflow-hidden cursor-ew-resize touch-none"
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          >
            {/* Base Image (Original) */}
            <img src={previewImage} className="max-w-full max-h-[70vh] block pointer-events-none" alt="Original" />
            <div className="absolute top-4 left-4 bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest z-10">BEFORE (原图)</div>

            {/* Filtered Image Overlay */}
            <div 
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
            >
              <img 
                src={previewImage} 
                className="max-w-full max-h-[70vh] block" 
                style={{ filter: constructFilterString(config) }} 
                alt="Filtered" 
              />
              <div className="absolute top-4 right-4 bg-pink-500/80 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest z-10">AFTER (滤镜)</div>
            </div>

            {/* Comparison Slider Handle */}
            <div 
              className="absolute inset-y-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-pink-500">
                <div className="flex space-x-1 text-pink-500">
                  <div className="w-1 h-3 bg-current rounded-full"></div>
                  <div className="w-1 h-3 bg-current rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 text-center text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
          左右拖动滑块查看对比效果
        </div>
      </div>

      {/* Side Control Panel */}
      <div className="w-full md:w-96 bg-white border-l border-slate-100 p-8 flex flex-col overflow-y-auto">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-800 text-lg">滤镜参数调节</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">实时渲染预览</p>
            </div>
          </div>

          {/* Presets Grid */}
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center space-x-2">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>快速预设</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setConfig({ ...config, ...p.config })}
                  className={`py-3 px-1 rounded-2xl border-2 text-[10px] font-black transition-all hover:scale-105 active:scale-95 ${config.grayscale === p.config.grayscale && config.sepia === p.config.sepia && config.brightness === p.config.brightness ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-lg shadow-pink-100' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Controls */}
          <div className="space-y-6 pt-6 border-t border-slate-50">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">精细化参数</label>
            
            <div className="space-y-6">
              {[
                { label: '亮度', icon: <Sun className="w-4 h-4" />, key: 'brightness', min: 0, max: 200, unit: '%' },
                { label: '对比度', icon: <ContrastIcon className="w-4 h-4" />, key: 'contrast', min: 0, max: 200, unit: '%' },
                { label: '饱和度', icon: <Droplets className="w-4 h-4" />, key: 'saturation', min: 0, max: 200, unit: '%' },
                { label: '色调旋转', icon: <Palette className="w-4 h-4" />, key: 'hueRotate', min: 0, max: 360, unit: '°' },
                { label: '模糊程度', icon: <X className="w-4 h-4" />, key: 'blur', min: 0, max: 20, unit: 'px' }
              ].map(ctrl => (
                <div key={ctrl.key}>
                  <div className="flex justify-between text-[11px] font-black text-slate-600 mb-2 uppercase tracking-wide">
                    <span className="flex items-center space-x-2">
                      <span className="text-pink-500">{ctrl.icon}</span>
                      <span>{ctrl.label}</span>
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full">{(config as any)[ctrl.key]}{ctrl.unit}</span>
                  </div>
                  <input 
                    type="range" 
                    min={ctrl.min} max={ctrl.max} step="1"
                    value={(config as any)[ctrl.key]}
                    onChange={(e) => setConfig({ ...config, [ctrl.key]: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
              提示：您可以直接点击预览图查看特定位置细节。调节后的参数将自动同步至所有待处理图片。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [config, setConfig] = useState<FilterConfig>(PRESETS[0].config as FilterConfig);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ 
      id: Math.random().toString(36).substr(2, 9), 
      file, 
      preview: URL.createObjectURL(file), 
      status: 'idle' 
    }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const constructFilterString = (c: FilterConfig) => {
    return `brightness(${c.brightness}%) contrast(${c.contrast}%) saturate(${c.saturation}%) sepia(${c.sepia}%) grayscale(${c.grayscale}%) hue-rotate(${c.hueRotate}deg) blur(${c.blur}px)`;
  };

  const processImages = async () => {
    setIsProcessing(true);
    const filterStr = constructFilterString(config);

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
          if (!ctx) return resolve('');

          ctx.filter = filterStr;
          ctx.drawImage(tempImg, 0, 0);
          resolve(canvas.toDataURL(img.file.type));
        };
        tempImg.src = img.preview;
      });

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `filtered_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <>
      <ToolPageLayout
        title="照片滤镜"
        description="批量为您的图片添加艺术滤镜或调整基础参数。支持实时对比预览。"
        images={images}
        onAddFiles={addFiles}
        onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
        onProcess={processImages}
        isProcessing={isProcessing}
        actionText="应用滤镜并批量下载"
      >
        <div className="space-y-6">
          <button 
            disabled={images.length === 0}
            onClick={() => setIsDesigning(true)}
            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all shadow-xl
              ${images.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-slate-200'}`}
          >
            <Settings2 className="w-5 h-5" />
            <span>配置滤镜参数 & 对比</span>
          </button>

          {images.length > 0 && (
            <div className="bg-pink-50/50 p-6 rounded-3xl border border-pink-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] mb-4">效果缩略预览</span>
              <div className="relative w-40 h-40 rounded-2xl border-2 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center group cursor-pointer" onClick={() => setIsDesigning(true)}>
                <img 
                  src={images[0].preview} 
                  className="max-w-full max-h-full object-cover transition-all duration-700 group-hover:scale-110" 
                  style={{ filter: constructFilterString(config) }}
                  alt="Quick Preview"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <MousePointer2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                 {Object.entries(config).filter(([k, v]) => (k !== 'brightness' && k !== 'contrast' && k !== 'saturation' && v !== 100) || (['brightness', 'contrast', 'saturation'].includes(k) && v !== 100) || v !== 0).map(([k, v]) => (
                   <span key={k} className="px-2 py-0.5 bg-white border border-pink-100 rounded-full text-[9px] font-bold text-pink-500 uppercase">{k}: {v}</span>
                 ))}
              </div>
            </div>
          )}
        </div>
      </ToolPageLayout>

      {isDesigning && images.length > 0 && (
        <FilterDesigner
          previewImage={images[0].preview}
          config={config}
          setConfig={setConfig}
          onSave={() => setIsDesigning(false)}
          onClose={() => setIsDesigning(false)}
        />
      )}
    </>
  );
};

export default FilterTool;
