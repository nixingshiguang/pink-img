
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCode, Globe, Layout, Monitor, Save, Download, 
  RefreshCcw, Settings2, Check, AlertCircle, Loader2
} from 'lucide-react';

const HtmlToImgTool: React.FC = () => {
  const [mode, setMode] = useState<'html' | 'url'>('html');
  const [htmlContent, setHtmlContent] = useState<string>(
    `<div style="padding: 40px; background: linear-gradient(135deg, #FF007A, #FF7EB3); color: white; font-family: sans-serif; border-radius: 24px; text-align: center; box-shadow: 0 20px 40px rgba(255, 0, 122, 0.3);">
  <h1 style="margin: 0; font-size: 48px; font-weight: 900;">PinkImg</h1>
  <p style="font-size: 20px; opacity: 0.9; margin-top: 10px;">HTML to Image Transformation</p>
  <div style="margin-top: 30px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; display: inline-block;">
    Ready for your creativity
  </div>
</div>`
  );
  const [url, setUrl] = useState<string>('https://google.com');
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'svg'>('jpg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [viewSize, setViewSize] = useState({ width: 800, height: 600 });
  const previewRef = useRef<HTMLDivElement>(null);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      if (mode === 'url') {
        // In a real app, this would use a backend like Puppeteer
        alert("由于浏览器安全限制(CORS)，网页链接转换功能通常需要后台支持。本演示将主要展示HTML代码转换。");
        setIsProcessing(false);
        return;
      }

      if (!previewRef.current) return;

      const element = previewRef.current.firstChild as HTMLElement;
      if (!element) return;

      // Use the SVG foreignObject trick for client-side HTML to Image
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${viewSize.width}" height="${viewSize.height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${htmlContent}
            </div>
          </foreignObject>
        </svg>
      `;

      if (targetFormat === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `pinkimg_export_${Date.now()}.svg`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = viewSize.width;
        canvas.height = viewSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const imgUrl = URL.createObjectURL(blob);

        img.onload = () => {
          ctx.fillStyle = 'white'; // White background for JPG
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.href = jpgUrl;
          link.download = `pinkimg_export_${Date.now()}.jpg`;
          link.click();
          URL.revokeObjectURL(imgUrl);
        };
        img.src = imgUrl;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-grow container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-200 mb-4">
            <Layout className="w-3 h-3" />
            <span>Web to Canvas</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">HTML转图片</h1>
          <p className="text-slate-500 font-medium">将HTML片段或网页代码实时渲染为高质量图片。</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Editor */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-xl shadow-pink-50/50">
              <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setMode('html')}
                  className={`flex-1 py-2 rounded-lg text-sm font-black transition-all flex items-center justify-center space-x-2 ${mode === 'html' ? 'bg-white shadow text-pink-500' : 'text-slate-400'}`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>HTML 代码</span>
                </button>
                <button 
                  onClick={() => setMode('url')}
                  className={`flex-1 py-2 rounded-lg text-sm font-black transition-all flex items-center justify-center space-x-2 ${mode === 'url' ? 'bg-white shadow text-pink-500' : 'text-slate-400'}`}
                >
                  <Globe className="w-4 h-4" />
                  <span>网页链接</span>
                </button>
              </div>

              {mode === 'html' ? (
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">输入代码 (HTML/CSS)</label>
                  <textarea 
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full h-80 p-4 bg-slate-900 text-pink-400 font-mono text-sm rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none border-none resize-none"
                    placeholder="在这里输入 HTML 代码..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">输入网址 URL</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                      placeholder="https://example.com"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-500">
                      <Globe className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-4 bg-pink-50 border border-pink-100 rounded-2xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-pink-600 leading-relaxed">
                      提示：由于跨域资源共享 (CORS) 安全策略，直接加载第三方网页预览受限。建议使用“HTML代码”模式。
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-50">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">渲染设置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 mb-1 block">宽度 (px)</span>
                    <input 
                      type="number" 
                      value={viewSize.width}
                      onChange={(e) => setViewSize({...viewSize, width: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 mb-1 block">高度 (px)</span>
                    <input 
                      type="number" 
                      value={viewSize.height}
                      onChange={(e) => setViewSize({...viewSize, height: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview & Actions */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-pink-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-black text-slate-800">渲染预览</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>

              <div className="flex-grow overflow-auto bg-slate-200 p-8 flex items-center justify-center">
                <div 
                  ref={previewRef}
                  className="bg-white shadow-2xl relative"
                  style={{ width: `${viewSize.width}px`, height: `${viewSize.height}px`, zoom: '0.6' }}
                  dangerouslySetInnerHTML={{ __html: mode === 'html' ? htmlContent : `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>` }}
                />
              </div>

              <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-black text-slate-400 uppercase">输出格式</span>
                  <div className="flex space-x-2">
                    {['jpg', 'svg'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setTargetFormat(f as 'jpg' | 'svg')}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${targetFormat === f ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-pink-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className={`flex items-center space-x-3 px-8 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95
                    ${isProcessing ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700 shadow-slate-200'}`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isProcessing ? '正在导出...' : '导出图像'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-pink-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500">
                  <Settings2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">渲染就绪</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">当前模式: {mode.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase">实时预览</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlToImgTool;
