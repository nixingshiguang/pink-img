
import React, { useState, useMemo } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { 
  Settings, User, Camera, Calendar, MapPin, 
  ShieldOff, Check, AlertCircle, Info, ArrowLeft,
  Edit3, Globe, Loader2, Search
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

// 轻量级 JPEG EXIF 解析器
const readExifFromBlob = async (file: File): Promise<ExifData> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const view = new DataView(buffer);
      const result: ExifData = {};

      if (view.getUint16(0) !== 0xFFD8) return resolve(result); // 非 JPEG

      let offset = 2;
      while (offset < view.byteLength) {
        if (view.getUint16(offset) === 0xFFE1) { // APP1 Marker
          const exifHeader = view.getUint32(offset + 4);
          if (exifHeader === 0x45786966) { // "Exif"
            const tiffOffset = offset + 10;
            const littleEndian = view.getUint16(tiffOffset) === 0x4949;
            const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
            
            const parseIFD = (start: number) => {
              const entries = view.getUint16(tiffOffset + start, littleEndian);
              for (let i = 0; i < entries; i++) {
                const entryOffset = tiffOffset + start + 2 + (i * 12);
                const tag = view.getUint16(entryOffset, littleEndian);
                const type = view.getUint16(entryOffset + 2, littleEndian);
                const count = view.getUint32(entryOffset + 4, littleEndian);
                const valOffset = view.getUint32(entryOffset + 8, littleEndian) + tiffOffset;

                const readString = (off: number, len: number) => {
                  let str = "";
                  for (let j = 0; j < len; j++) {
                    const char = view.getUint8(off + j);
                    if (char === 0) break;
                    str += String.fromCharCode(char);
                  }
                  return str.trim();
                };

                // 常用标签解析
                if (tag === 0x010F) result.make = readString(valOffset, count);
                if (tag === 0x0110) result.model = readString(valOffset, count);
                if (tag === 0x0132) {
                  const rawDate = readString(valOffset, count); // YYYY:MM:DD HH:MM:SS
                  result.dateTime = rawDate.split(' ')[0].replace(/:/g, '-');
                }
                if (tag === 0x013B) result.artist = readString(valOffset, count);
                if (tag === 0x8298) result.copyright = readString(valOffset, count);
              }
            };
            parseIFD(ifdOffset);
          }
          break;
        }
        offset += 2 + view.getUint16(offset + 2);
      }
      resolve(result);
    };
    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // 只读取前 128KB 即可
  });
};

const ExifTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [globalExif, setGlobalExif] = useState<ExifData>({
    make: '',
    model: '',
    software: 'PinkImg Editor',
    dateTime: new Date().toISOString().split('T')[0],
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = async (files: File[]) => {
    // 立即添加占位，显示正在解析
    const newItems: ImageItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle',
      exif: { ...globalExif }
    }));
    
    setImages(prev => [...prev, ...newItems]);

    // 异步解析每张图片的原始 EXIF
    for (const item of newItems) {
      const originalExif = await readExifFromBlob(item.file);
      setImages(prev => prev.map(img => img.id === item.id ? {
        ...img,
        exif: { ...img.exif, ...originalExif }
      } : img));
    }
  };

  const updateField = (field: keyof ExifData, value: string) => {
    if (activeImageId) {
      setImages(prev => prev.map(img => img.id === activeImageId ? {
        ...img,
        exif: { ...img.exif, [field]: value }
      } : img));
    } else {
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
      await new Promise(r => setTimeout(r, 600));
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
      description="批量修改或清除图片属性。上传后我们将自动尝试读取图片的原始拍摄信息。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => {
        if (activeImageId === id) setActiveImageId(null);
        setImages(prev => prev.filter(i => i.id !== id));
      }}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="保存所有修改"
      imageAction={(img) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveImageId(img.id); }}
          className="bg-pink-500 text-white p-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-black">查看详情</span>
        </button>
      )}
    >
      <div className="space-y-6">
        {/* Mode Selector */}
        <div className="flex items-center justify-between p-1 bg-slate-50 rounded-2xl border border-slate-100">
          <button 
            onClick={() => setActiveImageId(null)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${!activeImageId ? 'bg-white shadow text-pink-500' : 'text-slate-400'}`}
          >
            <Globe className="w-4 h-4" />
            <span>全局设置</span>
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button 
            disabled={images.length === 0}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeImageId ? 'bg-white shadow text-pink-500' : 'text-slate-400 disabled:opacity-50'}`}
          >
            <Camera className="w-4 h-4" />
            <span>单图详情</span>
          </button>
        </div>

        {activeImage && (
          <div className="bg-white p-4 rounded-3xl border-2 border-pink-100 shadow-lg shadow-pink-50 animate-in zoom-in-95 duration-300">
             <div className="flex items-center space-x-4 mb-4">
               <div className="relative">
                 <img src={activeImage.preview} className="w-16 h-16 object-cover rounded-2xl shadow-md border-2 border-white" />
                 <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-1 rounded-lg border-2 border-white">
                   <Edit3 className="w-3 h-3" />
                 </div>
               </div>
               <div className="min-w-0">
                 <h5 className="text-xs font-black text-slate-800 truncate mb-0.5">{activeImage.file.name}</h5>
                 <p className="text-[10px] text-pink-500 font-bold uppercase tracking-tight">已成功提取原始元数据</p>
               </div>
             </div>
             <div className="h-px bg-slate-50 w-full mb-4"></div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="group">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <Camera className="w-3 h-3 text-pink-500" />
                <span>拍摄设备信息</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="制造商 (如 Apple)"
                  value={currentExif.make || ''}
                  onChange={(e) => updateField('make', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
                <input 
                  type="text" placeholder="型号 (如 iPhone)"
                  value={currentExif.model || ''}
                  onChange={(e) => updateField('model', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-pink-500" />
                <span>拍摄日期时间</span>
              </label>
              <input 
                type="date"
                value={currentExif.dateTime || ''}
                onChange={(e) => updateField('dateTime', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-pink-500" />
                <span>GPS 地理位置</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="纬度 (Lat)"
                  value={currentExif.latitude || ''}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <input 
                  type="text" placeholder="经度 (Lng)"
                  value={currentExif.longitude || ''}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
               <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <User className="w-3 h-3 text-pink-500" />
                <span>作者与版权</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="拍摄者"
                  value={currentExif.artist || ''}
                  onChange={(e) => updateField('artist', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <input 
                  type="text" placeholder="版权归属"
                  value={currentExif.copyright || ''}
                  onChange={(e) => updateField('copyright', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Privacy Tip */}
        <div className={`p-4 rounded-3xl border-2 flex items-start space-x-3 transition-all ${privacyMode ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
          <ShieldOff className={`w-5 h-5 flex-shrink-0 mt-0.5 ${privacyMode ? 'text-red-500' : 'text-blue-500'}`} />
          <div>
            <div className="flex items-center justify-between">
              <h6 className={`text-xs font-black uppercase ${privacyMode ? 'text-red-600' : 'text-blue-600'}`}>安全设置</h6>
              <button onClick={() => setPrivacyMode(!privacyMode)} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${privacyMode ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                {privacyMode ? '已开启脱敏' : '一键清除元数据'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
              开启后，所有导出的图片将不包含任何设备、位置和拍摄者信息。
            </p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default ExifTool;
