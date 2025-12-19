
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { Palette, Sun, Contrast as ContrastIcon, Droplets, Zap } from 'lucide-react';

interface FilterConfig {
  preset: string;
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

const FilterTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [config, setConfig] = useState<FilterConfig>(PRESETS[0].config as FilterConfig);
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

  const handlePresetSelect = (presetConfig: any) => {
    setConfig({ ...config, ...presetConfig });
  };

  return (
    <ToolPageLayout
      title="照片滤镜"
      description="批量为您的图片添加艺术滤镜或调整基础参数，提升视觉表现力。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="应用滤镜并下载"
    >
      <div className="space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3 flex items-center space-x-2">
            <Zap className="w-3 h-3" />
            <span>风格预设</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.config)}
                className={`py-2 px-1 rounded-xl border-2 text-[10px] font-black transition-all ${config.grayscale === p.config.grayscale && config.sepia === p.config.sepia && config.brightness === p.config.brightness ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 text-slate-500 hover:bg-slate-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3 flex items-center space-x-2">
            <Palette className="w-3 h-3" />
            <span>精细调节</span>
          </label>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="flex items-center space-x-1"><Sun className="w-3 h-3"/><span>亮度</span></span>
                <span>{config.brightness}%</span>
              </div>
              <input 
                type="range" min="0" max="200" step="1" 
                value={config.brightness} 
                onChange={(e) => setConfig({...config, brightness: parseInt(e.target.value)})}
                className="w-full accent-pink-500" 
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="flex items-center space-x-1"><ContrastIcon className="w-3 h-3"/><span>对比度</span></span>
                <span>{config.contrast}%</span>
              </div>
              <input 
                type="range" min="0" max="200" step="1" 
                value={config.contrast} 
                onChange={(e) => setConfig({...config, contrast: parseInt(e.target.value)})}
                className="w-full accent-pink-500" 
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span className="flex items-center space-x-1"><Droplets className="w-3 h-3"/><span>饱和度</span></span>
                <span>{config.saturation}%</span>
              </div>
              <input 
                type="range" min="0" max="200" step="1" 
                value={config.saturation} 
                onChange={(e) => setConfig({...config, saturation: parseInt(e.target.value)})}
                className="w-full accent-pink-500" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">模糊 ({config.blur}px)</label>
                <input 
                  type="range" min="0" max="20" step="1" 
                  value={config.blur} 
                  onChange={(e) => setConfig({...config, blur: parseInt(e.target.value)})}
                  className="w-full accent-pink-500" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1 block">色调 ({config.hueRotate}°)</label>
                <input 
                  type="range" min="0" max="360" step="1" 
                  value={config.hueRotate} 
                  onChange={(e) => setConfig({...config, hueRotate: parseInt(e.target.value)})}
                  className="w-full accent-pink-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Preview Indicator */}
        {images.length > 0 && (
          <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 mt-6 flex flex-col items-center">
            <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-3">效果预览</p>
            <div className="relative w-32 h-32 rounded-xl border border-pink-100 bg-white overflow-hidden flex items-center justify-center">
              <img 
                src={images[0].preview} 
                className="max-w-full max-h-full object-cover transition-all duration-300" 
                style={{ filter: constructFilterString(config) }}
                alt="Preview"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-2 italic text-center leading-tight">以上仅为第一张图预览<br/>处理将应用于所有图片</p>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default FilterTool;
