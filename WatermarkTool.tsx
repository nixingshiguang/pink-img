
import React, { useState, useRef, useEffect } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { 
  Type, Image as ImageIcon, Settings2, Check, X, 
  Move, Maximize2, Trash2, Palette, Type as TypeIcon,
  ChevronDown, Layers
} from 'lucide-react';

type WatermarkType = 'text' | 'image';

interface WatermarkLayer {
  id: string;
  type: WatermarkType;
  content: string; // Text string or Image DataURL
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
  fontSize: number; // Percentage of image height
  color: string;
  opacity: number;
  rotation: number;
}

const WatermarkDesigner: React.FC<{
  previewImage: string;
  layers: WatermarkLayer[];
  setLayers: React.Dispatch<React.SetStateAction<WatermarkLayer[]>>;
  onSave: () => void;
  onClose: () => void;
}> = ({ previewImage, layers, setLayers, onSave, onClose }) => {
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-overlay')) {
      setActiveLayerId(null);
    }
  };

  const addTextLayer = () => {
    const newLayer: WatermarkLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: '点击编辑文字',
      x: 40,
      y: 45,
      width: 20,
      height: 10,
      fontSize: 5,
      color: '#FF007A',
      opacity: 0.8,
      rotation: 0
    };
    setLayers([...layers, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newLayer: WatermarkLayer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: ev.target?.result as string,
          x: 35,
          y: 35,
          width: 30,
          height: 30,
          fontSize: 0,
          color: '',
          opacity: 0.8,
          rotation: 0
        };
        setLayers([...layers, newLayer]);
        setActiveLayerId(newLayer.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrag = (e: React.PointerEvent, layerId: string) => {
    e.preventDefault();
    setActiveLayerId(layerId);
    isDragging.current = true;
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      dragStart.current = { 
        x: e.clientX, 
        y: e.clientY, 
        layerX: layer.x, 
        layerY: layer.y 
      };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDrag = (e: React.PointerEvent) => {
    if (!isDragging.current || !activeLayerId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;

    setLayers(prev => prev.map(l => l.id === activeLayerId ? {
      ...l,
      x: Math.max(0, Math.min(100 - l.width, dragStart.current.layerX + dx)),
      y: Math.max(0, Math.min(100 - l.height, dragStart.current.layerY + dy))
    } : l));
  };

  const stopDrag = () => {
    isDragging.current = false;
  };

  const removeLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    setActiveLayerId(null);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex flex-col md:flex-row h-screen">
      {/* Designer Area */}
      <div className="flex-grow flex flex-col min-h-0 overflow-hidden relative">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors"><X /></button>
            <h3 className="text-xl font-black text-white">交互式水印设计器</h3>
          </div>
          <div className="flex space-x-3">
            <button onClick={addTextLayer} className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20">
              <TypeIcon className="w-4 h-4" />
              <span>添加文字</span>
            </button>
            <button onClick={() => watermarkInputRef.current?.click()} className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20">
              <ImageIcon className="w-4 h-4" />
              <span>添加图片</span>
              <input type="file" ref={watermarkInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </button>
            <button onClick={onSave} className="px-6 py-2 bg-pink-500 text-white rounded-xl font-black shadow-lg shadow-pink-500/30 hover:bg-pink-600 transition-all flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>确认设计</span>
            </button>
          </div>
        </div>

        <div 
          className="flex-grow flex items-center justify-center p-8 overflow-auto bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]"
          onClick={handleContainerClick}
        >
          <div 
            ref={containerRef}
            className="relative shadow-2xl bg-white select-none touch-none canvas-overlay"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[70vh] block pointer-events-none" />
            
            {layers.map(layer => (
              <div
                key={layer.id}
                onPointerDown={(e) => startDrag(e, layer.id)}
                onPointerMove={onDrag}
                onPointerUp={stopDrag}
                className={`absolute cursor-move group ${activeLayerId === layer.id ? 'ring-2 ring-pink-500 ring-offset-2' : 'hover:ring-1 hover:ring-pink-300'}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  width: layer.type === 'image' ? `${layer.width}%` : 'auto',
                  opacity: layer.opacity,
                  transform: `rotate(${layer.rotation}deg)`,
                  zIndex: activeLayerId === layer.id ? 20 : 10
                }}
              >
                {layer.type === 'text' ? (
                  <div 
                    className="whitespace-nowrap font-bold"
                    style={{ 
                      fontSize: `${layer.fontSize}vw`, 
                      color: layer.color,
                      padding: '4px'
                    }}
                  >
                    {layer.content}
                  </div>
                ) : (
                  <img src={layer.content} className="w-full h-auto block" alt="" />
                )}
                
                {activeLayerId === layer.id && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-800 rounded-lg p-1.5 shadow-xl">
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="p-1.5 text-white hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-80 bg-white border-l border-slate-100 p-6 flex flex-col overflow-y-auto">
        {activeLayer ? (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500">
                {activeLayer.type === 'text' ? <TypeIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-black text-slate-800">编辑图层</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {activeLayer.id}</p>
              </div>
            </div>

            {activeLayer.type === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">文字内容</label>
                  <input 
                    type="text" 
                    value={activeLayer.content}
                    onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, content: e.target.value} : l))}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">字号 ({activeLayer.fontSize})</label>
                  <input 
                    type="range" min="1" max="20" step="0.5" 
                    value={activeLayer.fontSize}
                    onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, fontSize: parseFloat(e.target.value)} : l))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">颜色</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={activeLayer.color}
                      onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, color: e.target.value} : l))}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <span className="text-sm font-mono font-bold text-slate-500">{activeLayer.color}</span>
                  </div>
                </div>
              </div>
            )}

            {activeLayer.type === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block">图片大小 ({Math.round(activeLayer.width)}%)</label>
                  <input 
                    type="range" min="5" max="100" 
                    value={activeLayer.width}
                    onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, width: parseFloat(e.target.value)} : l))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 border-t border-slate-50 pt-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">透明度 ({Math.round(activeLayer.opacity * 100)}%)</label>
                <input 
                  type="range" min="0" max="1" step="0.01"
                  value={activeLayer.opacity}
                  onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, opacity: parseFloat(e.target.value)} : l))}
                  className="w-full accent-pink-500"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block">旋转角度 ({activeLayer.rotation}°)</label>
                <input 
                  type="range" min="-180" max="180" 
                  value={activeLayer.rotation}
                  onChange={(e) => setLayers(prev => prev.map(l => l.id === activeLayerId ? {...l, rotation: parseInt(e.target.value)} : l))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-300">
            <Layers className="w-12 h-12 opacity-20" />
            <p className="text-sm font-bold">选中一个图层<br/>进行调节</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WatermarkTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [layers, setLayers] = useState<WatermarkLayer[]>([]);
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

  const processImages = async () => {
    if (layers.length === 0) {
      alert('请先设计水印');
      return;
    }

    setIsProcessing(true);

    // Pre-load all image watermark data
    const preloadedImages = new Map<string, HTMLImageElement>();
    for (const layer of layers) {
      if (layer.type === 'image') {
        const img = await new Promise<HTMLImageElement>((resolve) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.src = layer.content;
        });
        preloadedImages.set(layer.id, img);
      }
    }

    for (const imgData of images) {
      if (imgData.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === imgData.id ? { ...i, status: 'processing' } : i));
      
      const res = await new Promise<string>((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve('');

          ctx.drawImage(tempImg, 0, 0);

          layers.forEach(layer => {
            ctx.save();
            ctx.globalAlpha = layer.opacity;

            const x = (layer.x / 100) * canvas.width;
            const y = (layer.y / 100) * canvas.height;
            const w = (layer.width / 100) * canvas.width;
            
            ctx.translate(x, y);
            ctx.rotate((layer.rotation * Math.PI) / 180);

            if (layer.type === 'text') {
              const fontSizeInPx = (layer.fontSize / 100) * canvas.height * 4; // Normalized scale
              ctx.font = `bold ${fontSizeInPx}px Arial, sans-serif`;
              ctx.fillStyle = layer.color;
              ctx.textBaseline = 'top';
              ctx.fillText(layer.content, 0, 0);
            } else {
              const imgWatermark = preloadedImages.get(layer.id);
              if (imgWatermark) {
                const h = (w / imgWatermark.width) * imgWatermark.height;
                ctx.drawImage(imgWatermark, 0, 0, w, h);
              }
            }
            ctx.restore();
          });

          resolve(canvas.toDataURL(imgData.file.type));
        };
        tempImg.src = imgData.preview;
      });

      setImages(prev => prev.map(i => i.id === imgData.id ? { ...i, status: 'done', result: res } : i));
      const link = document.createElement('a');
      link.href = res;
      link.download = `watermarked_${imgData.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  return (
    <>
      <ToolPageLayout
        title="交互式水印工具"
        description="自由设计您的水印，一键批量应用于所有图片。"
        images={images}
        onAddFiles={addFiles}
        onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
        onProcess={processImages}
        isProcessing={isProcessing}
        actionText="批量应用水印"
      >
        <div className="space-y-4">
          <button 
            disabled={images.length === 0}
            onClick={() => setIsDesigning(true)}
            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all shadow-xl
              ${images.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-slate-200'}`}
          >
            <Settings2 className="w-5 h-5" />
            <span>{layers.length > 0 ? '修改水印设计' : '设计水印'}</span>
          </button>
          
          {layers.length > 0 && (
            <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 flex flex-col items-center">
              <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-2">当前设计方案</span>
              <div className="flex -space-x-2">
                {layers.map((l, idx) => (
                  <div key={l.id} className="w-8 h-8 rounded-full bg-white border-2 border-pink-200 flex items-center justify-center text-pink-500 shadow-sm z-[${10-idx}]">
                    {l.type === 'text' ? <TypeIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-pink-600 font-bold mt-3">已配置 {layers.length} 个水印图层</p>
            </div>
          )}
        </div>
      </ToolPageLayout>

      {isDesigning && images.length > 0 && (
        <WatermarkDesigner
          previewImage={images[0].preview}
          layers={layers}
          setLayers={setLayers}
          onSave={() => setIsDesigning(false)}
          onClose={() => setIsDesigning(false)}
        />
      )}
    </>
  );
};

export default WatermarkTool;
