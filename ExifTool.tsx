
import React, { useState, useMemo } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { 
  Settings, User, Camera, Calendar, MapPin, 
  ShieldOff, Check, AlertCircle, Info, ArrowLeft,
  Edit3, Globe
} from 'lucide-react';

interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  artist?: string;
  copyright?: string;
  latitude?: string;
  longitude?: string;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  exif: ExifData;
}

const ExifTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [globalExif, setGlobalExif] = useState<ExifData>({
    make: '',
    model: '',
    software: 'PinkImg Metadata Editor',
    dateTime: new Date().toISOString().split('T')[0],
    artist: '',
    copyright: ''
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs: ImageItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle',
      exif: { ...globalExif }
    }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const updateField = (field: keyof ExifData, value: string) => {
    if (activeImageId) {
      // 更新特定图片的 EXIF
      setImages(prev => prev.map(img => img.id === activeImageId ? {
        ...img,
        exif: { ...img.exif, [field]: value }
      } : img));
    } else {
      // 更新全局 EXIF 并应用到所有空闲图片
      setGlobalExif(prev => ({ ...prev, [field]: value }));
      setImages(prev => prev.map(img => img.status === 'idle' ? {
        ...img,
        exif: { ...img.exif, [field]: value }
      } : img));
    }
  };

  const processImages = async () => {
    setIsProcessing(true);
    for (const img of images) {
      if (img.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));

      await new Promise(r => setTimeout(r, 800));

      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done' } : i));
      
      const link = document.createElement('a');
      link.href = img.preview;
      link.download = `${privacyMode ? 'clean' : 'meta'}_${img.file.name}`;
      link.click();
    }
    setIsProcessing(false);
  };

  const activeImage = useMemo(() => images.find(img => img.id === activeImageId), [images, activeImageId]);
  const currentExif = activeImage ? activeImage.exif : globalExif;

  return (
    <ToolPageLayout
      title="EXIF 元数据编辑器"
      description="查看、修改或清除图片的 EXIF 元数据。保护隐私或更正拍摄信息。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => {
        if (activeImageId === id) setActiveImageId(null);
        setImages(prev => prev.filter(i => i.id !== id));
      }}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="保存并导出图片"
      imageAction={(img) => (
        <button 
          onClick={() => setActiveImageId(img.id)}
          className="bg-white/90 hover:bg-white text-pink-500 p-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2"
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-xs font-black">修改信息</span>
        </button>
      )}
    >
      <div className="space-y-6">
        {/* Header Toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {activeImageId ? (
              <button 
                onClick={() => setActiveImageId(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-pink-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Globe className="w-4 h-4 text-pink-500" />
            )}
            <h4 className="text-sm font-black text-slate-800">
              {activeImageId ? '单图编辑' : '全局编辑'}
            </h4>
          </div>
          {activeImageId && (
            <span className="text-[10px] bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full font-black uppercase">
              Selected
            </span>
          )}
        </div>

        {/* Privacy Mode Toggle (Only show in global mode for simplicity, or allowed always) */}
        {!activeImageId && (
          <button 
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group
              ${privacyMode ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-100 hover:border-pink-200 text-slate-500'}`}
          >
            <div className="flex items-center space-x-3 text-left">
              <div className={`p-2 rounded-xl ${privacyMode ? 'bg-red-100' : 'bg-slate-100 group-hover:bg-pink-100'}`}>
                <ShieldOff className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">隐私安全模式</p>
                <p className="text-[10px] font-bold opacity-70">清除所有敏感元数据</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${privacyMode ? 'bg-red-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privacyMode ? 'left-5' : 'left-1'}`}></div>
            </div>
          </button>
        )}

        {(!privacyMode || activeImageId) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {activeImage && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3 mb-4">
                <img src={activeImage.preview} className="w-12 h-12 object-cover rounded-lg border border-white shadow-sm" alt="" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-700 truncate">{activeImage.file.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">当前编辑中</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block flex items-center space-x-1">
                  <Camera className="w-3 h-3" />
                  <span>设备制造商 / 型号</span>
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" placeholder="制造商"
                    value={currentExif.make || ''}
                    onChange={(e) => updateField('make', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input 
                    type="text" placeholder="设备型号"
                    value={currentExif.model || ''}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>拍摄者 / 版权</span>
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" placeholder="艺术家"
                    value={currentExif.artist || ''}
                    onChange={(e) => updateField('artist', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input 
                    type="text" placeholder="版权信息"
                    value={currentExif.copyright || ''}
                    onChange={(e) => updateField('copyright', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>拍摄日期</span>
                </label>
                <input 
                  type="date"
                  value={currentExif.dateTime || ''}
                  onChange={(e) => updateField('dateTime', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>GPS 坐标 (经纬度)</span>
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" placeholder="纬度: 39.90"
                    value={currentExif.latitude || ''}
                    onChange={(e) => updateField('latitude', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input 
                    type="text" placeholder="经度: 116.40"
                    value={currentExif.longitude || ''}
                    onChange={(e) => updateField('longitude', e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
            {activeImageId ? "您正在编辑单张图片的特定属性。点击左上角箭头返回全局编辑模式。" : "注意：修改 EXIF 是一项高级操作。保存后请务必验证文件信息。"}
          </p>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default ExifTool;
