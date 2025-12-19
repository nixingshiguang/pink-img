
import React, { useState, useMemo } from 'react';
import { 
  Maximize, Crop as CropIcon, ArrowRightLeft, Type, RotateCcw, 
  FileCode, Image as ImageIcon, ShieldAlert, Stamp, Smile, 
  Sparkles, Layers, ChevronDown, Heart, ArrowLeft, Trash2,
  Palette
} from 'lucide-react';
import { Tool, ToolCategory } from './types';
import UpscaleTool from './UpscaleTool';
import CompressTool from './CompressTool';
import ResizeTool from './ResizeTool';
import CropTool from './CropTool';
import ConvertTool from './ConvertTool';
import RemoveBgTool from './RemoveBgTool';
import RotateTool from './RotateTool';
import WatermarkTool from './WatermarkTool';
import FilterTool from './FilterTool';

const Navbar: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 px-4 py-3">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
          <div className="bg-pink-500 p-1.5 rounded-lg shadow-lg shadow-pink-200">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">PINK<span className="text-pink-500">IMG</span></span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-pink-500 font-bold transition-all px-4 py-2 rounded-xl hover:bg-pink-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回主页</span>
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center border border-pink-200">
          <span className="text-pink-500 text-xs font-bold">G</span>
        </div>
      </div>
    </div>
  </nav>
);

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('全部');
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  const tools: Tool[] = [
    { id: 'compress', title: '压缩图像文件', description: '压缩JPG、PNG、SVG、以及GIF，同时节省空间。', icon: <Layers className="w-7 h-7 text-green-600" />, category: ['全部', '优化'], color: 'bg-green-50' },
    { id: 'resize', title: '调整图像的大小', description: '按照百分比或像素来定义尺寸，调整图片规格。', icon: <Maximize className="w-7 h-7 text-blue-600" />, category: ['全部', '编辑'], color: 'bg-blue-50' },
    { id: 'crop', title: '裁剪图片', description: '通过设定像素或比例来裁剪图像文件。', icon: <CropIcon className="w-7 h-7 text-sky-600" />, category: ['全部', '编辑'], color: 'bg-sky-50' },
    { id: 'upscale', title: '提升图片质量', description: '以 AI 高分辨率放大图像，保持视觉质量。', isNew: true, icon: <Sparkles className="w-7 h-7 text-lime-600" />, category: ['全部', '优化'], color: 'bg-lime-50' },
    { id: 'convert', title: '转换至图片格式', description: '批量转换图片格式至 JPG, PNG 或 WEBP。', icon: <ArrowRightLeft className="w-7 h-7 text-yellow-600" />, category: ['全部', '转换'], color: 'bg-yellow-50' },
    { id: 'remove-bg', title: '去除背景', description: '利用 AI 快速删除图像的背景，并保持高质量。', isNew: true, icon: <ImageIcon className="w-7 h-7 text-emerald-600" />, category: ['全部', '编辑'], color: 'bg-emerald-50' },
    { id: 'rotate', title: '旋转一个图片', description: '同时旋转多个 JPG, PNG 或 GIF 图片。', icon: <RotateCcw className="w-7 h-7 text-cyan-600" />, category: ['全部', '编辑'], color: 'bg-cyan-50' },
    { id: 'watermark', title: '给图片加水印', description: '快速给你的图片加上图像或文本水印。', icon: <Stamp className="w-7 h-7 text-indigo-600" />, category: ['全部', '编辑', '安全'], color: 'bg-indigo-50' },
    { id: 'filter', title: '照片滤镜', description: '利用预设滤镜、亮度或对比度调节让图片更生动。', icon: <Palette className="w-7 h-7 text-purple-600" />, category: ['全部', '编辑'], color: 'bg-purple-50' },
    { id: 'meme', title: '搞笑图片生成器', description: '在线制作搞笑创意图片，选择流行的模板。', icon: <Smile className="w-7 h-7 text-rose-600" />, category: ['全部', '创建'], color: 'bg-rose-50' },
    { id: 'html-to-img', title: 'HTML转图片', description: '将网页转换为JPG或SVG，复制链接即可。', icon: <FileCode className="w-7 h-7 text-orange-600" />, category: ['全部', '创建'], color: 'bg-orange-50' },
    { id: 'blur-face', title: '模糊面部', description: '简便地模糊照片中的人脸或隐私物体。', isNew: true, icon: <ShieldAlert className="w-7 h-7 text-slate-600" />, category: ['全部', '编辑', '安全'], color: 'bg-slate-50' }
  ];

  const filteredTools = useMemo(() => {
    if (activeCategory === '全部') return tools;
    return tools.filter(t => t.category.includes(activeCategory));
  }, [activeCategory]);

  const renderContent = () => {
    switch (currentTool) {
      case 'upscale': return <UpscaleTool />;
      case 'compress': return <CompressTool />;
      case 'resize': return <ResizeTool />;
      case 'crop': return <CropTool />;
      case 'convert': return <ConvertTool />;
      case 'remove-bg': return <RemoveBgTool />;
      case 'rotate': return <RotateTool />;
      case 'watermark': return <WatermarkTool />;
      case 'filter': return <FilterTool />;
      default: return (
        <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              可批量编辑图片 <span className="text-pink-500">的所有工具</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium">你的在线图片编辑器就在这里，而且永远免费！</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {['全部', '优化', '创建', '编辑', '转换', '安全'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as ToolCategory)}
                  className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border shadow-sm ${activeCategory === cat ? 'bg-slate-800 text-white border-slate-800 scale-105' : 'bg-white text-slate-600 border-pink-100 hover:border-pink-300 hover:bg-pink-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map((tool) => (
              <div key={tool.id} onClick={() => setCurrentTool(tool.id)} className="group relative bg-white p-6 rounded-2xl border border-pink-100 hover:border-pink-300 transition-all duration-300 hover:shadow-xl hover:shadow-pink-100/50 cursor-pointer flex flex-col h-full">
                {tool.isNew && <span className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">NEW</span>}
                <div className={`w-14 h-14 ${tool.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>{tool.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-pink-600 transition-colors">{tool.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </main>
      );
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/50 flex flex-col font-sans">
      <Navbar onBack={currentTool ? () => setCurrentTool(null) : undefined} />
      {renderContent()}
      <footer className="bg-white border-t border-pink-100 py-12 mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500 fill-current" />
            <span className="text-lg font-black text-slate-800 tracking-tight">PINK<span className="text-pink-500">IMG</span></span>
          </div>
          <div className="text-sm text-slate-400">© 2024 PinkImg. 为你的创意而生.</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
