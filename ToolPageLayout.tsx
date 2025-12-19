
import React, { useRef } from 'react';
import { Upload, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface ToolPageLayoutProps {
  title: string;
  description: string;
  isAi?: boolean;
  images: any[];
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (id: string) => void;
  onProcess: () => void;
  isProcessing: boolean;
  actionText: string;
  optionsArea?: React.ReactNode;
  children?: React.ReactNode;
  imageAction?: (img: any) => React.ReactNode;
}

const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  title, description, isAi, images, onAddFiles, onRemoveFile, onProcess, isProcessing, actionText, optionsArea, children, imageAction
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-grow container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="relative">
            {isAi && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-200 mb-4 animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>AI Powered By Gemini</span>
              </div>
            )}
            <h1 className="text-4xl font-black text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 font-medium">{description}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {optionsArea}
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
            <p className="text-slate-400 font-medium text-lg">支持批量上传 JPG, PNG, WEBP 格式</p>
            <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map(img => (
                  <div key={img.id} className="group relative bg-white p-3 rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 relative bg-slate-50 border border-slate-100">
                      <img src={img.result || img.preview} className="w-full h-full object-contain" alt="" />
                      
                      {imageAction && !isProcessing && img.status !== 'done' && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          {imageAction(img)}
                        </div>
                      )}

                      {img.status === 'processing' && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm text-white">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-xs font-bold">处理中...</span>
                        </div>
                      )}
                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center text-red-600 p-4 text-center">
                          <AlertCircle className="w-8 h-8 mb-2" />
                          <span className="text-xs font-bold">{img.error || '失败'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-slate-700 truncate">{img.file.name}</p>
                        <p className="text-[9px] text-slate-400">{(img.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button disabled={isProcessing} onClick={() => onRemoveFile(img.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-[4/3] border-2 border-dashed border-pink-100 rounded-2xl flex flex-col items-center justify-center text-pink-300 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 transition-all">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold text-center">添加更多图片</span>
                  <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={(e) => e.target.files && onAddFiles(Array.from(e.target.files))} />
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xl shadow-pink-50/50 sticky top-24">
                <h4 className="text-lg font-black text-slate-800 mb-6 flex items-center space-x-2">
                  <span>工具选项</span>
                </h4>
                {children}
                <button
                  onClick={onProcess}
                  disabled={isProcessing || images.every(i => i.status === 'done')}
                  className={`w-full mt-8 flex items-center justify-center space-x-3 py-4 rounded-2xl text-lg font-black transition-all shadow-xl
                    ${isProcessing || images.every(i => i.status === 'done') ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95 shadow-pink-200'}`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  <span>{isProcessing ? '正在处理...' : actionText}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolPageLayout;
