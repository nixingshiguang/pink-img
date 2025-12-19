
import React, { useState, useMemo } from 'react';
import { 
  Maximize, 
  Crop, 
  ArrowRightLeft, 
  Type, 
  RotateCcw, 
  FileCode, 
  Image as ImageIcon, 
  ShieldAlert, 
  Stamp, 
  Smile, 
  Sparkles, 
  Layers,
  ChevronDown,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { Tool, ToolCategory } from './types';
import UpscaleTool from './UpscaleTool';

// Components
const Navbar: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 px-4 py-3">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
          <div className="bg-pink-500 p-1.5 rounded-lg">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">PINK<span className="text-pink-500">IMG</span></span>
        </div>
        
        {!onBack && (
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <button className="hover:text-pink-500 transition-colors">压缩图像文件</button>
            <button className="hover:text-pink-500 transition-colors">调整图像的大小</button>
            <button className="hover:text-pink-500 transition-colors">裁剪图片</button>
            <button className="hover:text-pink-500 transition-colors">转换至JPG文件</button>
            <button className="hover:text-pink-500 transition-colors">照片编辑器</button>
            <div className="flex items-center space-x-1 cursor-pointer hover:text-pink-500 transition-colors">
              <span>更多工具</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-pink-500 font-bold transition-colors"
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

const ToolCard: React.FC<{ tool: Tool, onClick: () => void }> = ({ tool, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative bg-white p-6 rounded-2xl border border-pink-100 hover:border-pink-300 transition-all duration-300 hover:shadow-xl hover:shadow-pink-100/50 cursor-pointer flex flex-col h-full"
  >
    {tool.isNew && (
      <span className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
        全新功能!
      </span>
    )}
    
    <div className={`w-14 h-14 ${tool.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300`}>
      {tool.icon}
    </div>
    
    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-pink-600 transition-colors">
      {tool.title}
    </h3>
    
    <p className="text-sm text-slate-500 leading-relaxed">
      {tool.description}
    </p>
  </div>
);

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('全部');
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  const categories: ToolCategory[] = ['全部', '优化', '创建', '编辑', '转换', '安全'];

  const tools: Tool[] = [
    {
      id: 'compress',
      title: '压缩图像文件',
      description: '压缩JPG、PNG、SVG、以及GIF，同时节省空间、保持质量。',
      icon: <Layers className="w-7 h-7 text-green-600" />,
      category: ['全部', '优化'],
      color: 'bg-green-50'
    },
    {
      id: 'resize',
      title: '调整图像的大小',
      description: '按照百分比或像素来定义尺寸，并调整JPG、PNG、SVG和GIF图片的尺寸。',
      icon: <Maximize className="w-7 h-7 text-blue-600" />,
      category: ['全部', '编辑'],
      color: 'bg-blue-50'
    },
    {
      id: 'crop',
      title: '裁剪图片',
      description: '通过设定像素来裁剪图像文件。裁剪JPG文件, PNG文件 或 GIF 图像文件。',
      icon: <Crop className="w-7 h-7 text-sky-600" />,
      category: ['全部', '编辑'],
      color: 'bg-sky-50'
    },
    {
      id: 'upscale',
      title: '提升图片质量',
      description: '以高分辨率放大图像。轻松提升JPG和PNG图片的大小，同时保持视觉质量。',
      isNew: true,
      icon: <Sparkles className="w-7 h-7 text-lime-600" />,
      category: ['全部', '优化'],
      color: 'bg-lime-50'
    },
    {
      id: 'convert-to-jpg',
      title: '转换至JPG文件',
      description: '轻松地批量转换 PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, 或者 原始 格式的图片至 JPG格式。',
      icon: <ArrowRightLeft className="w-7 h-7 text-yellow-600" />,
      category: ['全部', '转换'],
      color: 'bg-yellow-50'
    },
    {
      id: 'jpg-to-other',
      title: 'JPG文件转换至',
      description: '转换 JPG 图像文件至 PNG文件 或 GIF文件。用多个JPG文件创建一个GIF动画文件！',
      icon: <ImageIcon className="w-7 h-7 text-amber-600" />,
      category: ['全部', '转换'],
      color: 'bg-amber-50'
    },
    {
      id: 'photo-editor',
      title: '照片编辑器',
      description: '利用文字、效果、镜框或贴纸，让图片更加生动有趣。使用简便的编辑工具，满足你的创意需求。',
      icon: <Type className="w-7 h-7 text-purple-600" />,
      category: ['全部', '编辑'],
      color: 'bg-purple-50'
    },
    {
      id: 'remove-bg',
      title: '去除背景',
      description: '快速删除图像的背景，并保持高质量。快速探测到目标，并轻松地删除背景。',
      isNew: true,
      icon: <ImageIcon className="w-7 h-7 text-emerald-600" />,
      category: ['全部', '编辑'],
      color: 'bg-emerald-50'
    },
    {
      id: 'watermark',
      title: '给图片加水印',
      description: '快速给你的图片加上图像或文本水印。选择排版、透明度和位置。',
      icon: <Stamp className="w-7 h-7 text-indigo-600" />,
      category: ['全部', '编辑', '安全'],
      color: 'bg-indigo-50'
    },
    {
      id: 'meme',
      title: '搞笑创意图片生成器',
      description: '通过一个简单的步骤，在线制作搞笑创意图片。选择你自己的模板，或者从最流行的模板中选择。',
      icon: <Smile className="w-7 h-7 text-rose-600" />,
      category: ['全部', '创建'],
      color: 'bg-rose-50'
    },
    {
      id: 'rotate',
      title: '旋转一个图片',
      description: '同时旋转多个 JPG, PNG 或 GIF 图片。每次只选择横向或纵向图片！',
      icon: <RotateCcw className="w-7 h-7 text-cyan-600" />,
      category: ['全部', '编辑'],
      color: 'bg-cyan-50'
    },
    {
      id: 'html-to-img',
      title: 'HTML转图片',
      description: '将HTML中的网页转换为JPG或SVG。复制并粘贴网页的URL链接，然后单击，将其转换为图片。',
      icon: <FileCode className="w-7 h-7 text-orange-600" />,
      category: ['全部', '创建'],
      color: 'bg-orange-50'
    },
    {
      id: 'blur-face',
      title: '模糊面部',
      description: '简便地模糊照片中的人脸。此外，你还可以模糊车牌或其他物体，以隐藏隐私信息。',
      isNew: true,
      icon: <ShieldAlert className="w-7 h-7 text-slate-600" />,
      category: ['全部', '编辑', '安全'],
      color: 'bg-slate-50'
    }
  ];

  const filteredTools = useMemo(() => {
    if (activeCategory === '全部') return tools;
    return tools.filter(t => t.category.includes(activeCategory));
  }, [activeCategory, tools]);

  const renderContent = () => {
    if (currentTool === 'upscale') {
      return <UpscaleTool />;
    }

    return (
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            可批量编辑图片 <span className="text-pink-500">的所有工具</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            你的在线图片编辑器就在这里，而且永远免费！
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border shadow-sm
                  ${activeCategory === cat 
                    ? 'bg-slate-800 text-white border-slate-800 scale-105' 
                    : 'bg-white text-slate-600 border-pink-100 hover:border-pink-300 hover:bg-pink-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              onClick={() => setCurrentTool(tool.id)}
            />
          ))}
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-pink-50/50 flex flex-col font-sans">
      <Navbar onBack={currentTool ? () => setCurrentTool(null) : undefined} />
      
      {renderContent()}

      <footer className="bg-white border-t border-pink-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-500 fill-current" />
              <span className="text-lg font-black text-slate-800 tracking-tight">PINK<span className="text-pink-500">IMG</span></span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-pink-500" onClick={(e) => { e.preventDefault(); setCurrentTool(null); }}>主页</a>
              <a href="#" className="hover:text-pink-500">功能</a>
              <a href="#" className="hover:text-pink-500">价格</a>
              <a href="#" className="hover:text-pink-500">API</a>
              <a href="#" className="hover:text-pink-500">联系我们</a>
            </div>
            
            <div className="text-sm text-slate-400">
              © 2024 PinkImg. 为你的创意而生.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
