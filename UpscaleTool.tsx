
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle2, Loader2, Sparkles, ChevronRight, Eye } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  result?: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

const ImageComparator: React.FC<{ original: string, upscaled: string }> = ({ original, upscaled }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none bg-slate-200"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Before */}
      <img src={original} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
      
      {/* After */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPos}%` }}
      >
        <img src={upscaled} alt="Upscaled" className="absolute inset-0 w-full h-full object-contain max-w-none" style={{ width: `${10000 / sliderPos}%` }} />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-10"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center -ml-0.5">
          <ChevronRight className="w-4 h-4 text-pink-500 rotate-180" />
          <ChevronRight className="w-4 h-4 text-pink-500" />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 text-xs rounded backdrop-blur-sm">提升后</div>
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 text-xs rounded backdrop-blur-sm">提升前</div>
    </div>
  );
};

const UpscaleTool: React.FC = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleFactor, setScaleFactor] = useState<'2x' | '4x'>('2x');
  const [viewingImage, setViewingImage] = useState<ImageFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Explicitly convert FileList to File[] by checking for existence first to avoid 'unknown[]' type error
    const fileList = e.target.files;
    if (fileList) {
      const files = Array.from(fileList);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle'
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeFile = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
      reader.onerror = error => reject(error);
    });
  };

  const processImages = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    for (const img of images) {
      if (img.status === 'done') continue;

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));

      try {
        const base64Data = await fileToBase64(img.file);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: img.file.type
                }
              },
              {
                text: `Enhance this image to ${scaleFactor} resolution. Improve clarity, details, and remove artifacts. Return only the enhanced high-quality image.`
              }
            ]
          }
        });

        // Fixed: Added safety check for parts array
        const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (resultPart?.inlineData) {
          const resultUrl = `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: resultUrl } : i));
        } else {
          throw new Error('No image returned');
        }
      } catch (err) {
        console.error(err);
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', error: '提升失败' } : i));
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex-grow container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">提升图片质量</h1>
            <p className="text-slate-500 font-medium">批量放大 JPG 和 PNG 图片，同时保持清晰度和细节。</p>
          </div>
          
          <div className="flex items-center bg-white p-1 rounded-xl border border-pink-100 shadow-sm">
            {(['2x', '4x'] as const).map(factor => (
              <button
                key={factor}
                onClick={() => setScaleFactor(factor)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${scaleFactor === factor ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}
              >
                {factor}
              </button>
            ))}
          </div>
        </div>

        {images.length === 0 ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group bg-white border-4 border-dashed border-pink-100 rounded-[2.5rem] py-24 flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all duration-500"
          >
            <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-pink-200 transition-transform duration-500">
              <Upload className="w-10 h-10 text-pink-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">点击或拖拽图片到这里</h3>
            <p className="text-slate-400 font-medium text-lg">支持批量上传 JPG, PNG 格式</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              className="hidden" 
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map(img => (
                <div key={img.id} className="group relative bg-white p-3 rounded-2xl border border-pink-100 shadow-sm overflow-hidden transition-all hover:shadow-lg">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 relative bg-slate-100">
                    <img src={img.preview} className="w-full h-full object-cover" alt="" />
                    
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm text-white">
                        <Loader2 className="w-10 h-10 animate-spin mb-2" />
                        <span className="font-bold">提升中...</span>
                      </div>
                    )}
                    
                    {img.status === 'done' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingImage(img)}
                          className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold shadow-xl flex items-center space-x-2 hover:scale-105 transition-transform"
                        >
                          <Eye className="w-4 h-4" />
                          <span>点击对比效果</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 truncate">{img.file.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {(img.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    
                    {img.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <button 
                        disabled={isProcessing}
                        onClick={() => removeFile(img.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {!isProcessing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] border-2 border-dashed border-pink-100 rounded-2xl flex flex-col items-center justify-center text-pink-300 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all"
                >
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm font-bold">添加更多</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    className="hidden" 
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                  />
                </button>
              )}
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={processImages}
                disabled={isProcessing || images.every(i => i.status === 'done')}
                className={`flex items-center space-x-3 px-12 py-5 rounded-2xl text-xl font-black shadow-2xl transition-all
                  ${isProcessing || images.every(i => i.status === 'done')
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-pink-500 text-white hover:bg-pink-600 hover:scale-105 active:scale-95'}`}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
                <span>{isProcessing ? '处理批量任务中...' : '开始提升画质'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {viewingImage && viewingImage.result && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12">
          <button 
            onClick={() => setViewingImage(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-10 h-10" />
          </button>
          
          <div className="max-w-6xl w-full bg-white rounded-3xl p-6 md:p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800">对比提升效果</h2>
                <p className="text-slate-500 font-medium">拖动滑块查看处理前后的差异</p>
              </div>
              <a 
                href={viewingImage.result} 
                download={`upscaled_${viewingImage.file.name}`}
                className="bg-pink-500 text-white px-6 py-3 rounded-xl font-black hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200"
              >
                下载处理后的图片
              </a>
            </div>
            
            <ImageComparator original={viewingImage.preview} upscaled={viewingImage.result} />
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setViewingImage(null)}
                className="text-slate-400 font-bold hover:text-slate-600"
              >
                关闭预览
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpscaleTool;
