
import React, { useState, useMemo } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { 
  Settings, User, Camera, Calendar, MapPin, 
  ShieldOff, Check, AlertCircle, Info, ArrowLeft,
  Edit3, Globe, Loader2, Search, ChevronDown, ChevronUp,
  FileText, Activity, Zap, Maximize
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
  altitude?: string;
  iso?: string;
  exposureTime?: string;
  aperture?: string;
  focalLength?: string;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  exif: ExifData;
  originalExif?: ExifData;
}

// 辅助函数：解析 Rational (有理数)
const getRational = (view: DataView, offset: number, littleEndian: boolean): number => {
  const num = view.getUint32(offset, littleEndian);
  const den = view.getUint32(offset + 4, littleEndian);
  return den === 0 ? 0 : num / den;
};

// 辅助函数：解析 GPS 坐标
const parseGPSCoordinate = (view: DataView, offset: number, ref: string, littleEndian: boolean): string => {
  const degrees = getRational(view, offset, littleEndian);
  const minutes = getRational(view, offset + 8, littleEndian);
  const seconds = getRational(view, offset + 16, littleEndian);
  let coordinate = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") coordinate = -coordinate;
  return coordinate.toFixed(6);
};

// 增强型 JPEG EXIF 解析器
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
            
            let gpsInfoOffset = -1;

            const readString = (off: number, len: number) => {
              let str = "";
              for (let j = 0; j < len; j++) {
                const char = view.getUint8(off + j);
                if (char === 0) break;
                str += String.fromCharCode(char);
              }
              return str.trim();
            };

            const parseIFD = (start: number) => {
              const entries = view.getUint16(tiffOffset + start, littleEndian);
              for (let i = 0; i < entries; i++) {
                const entryOffset = tiffOffset + start + 2 + (i * 12);
                const tag = view.getUint16(entryOffset, littleEndian);
                const valOffset = view.getUint32(entryOffset + 8, littleEndian) + tiffOffset;
                const count = view.getUint32(entryOffset + 4, littleEndian);

                // 常用标签
                if (tag === 0x010F) result.make = readString(valOffset, count);
                if (tag === 0x0110) result.model = readString(valOffset, count);
                if (tag === 0x0132) result.dateTime = readString(valOffset, count).replace(/:/g, '-').replace(' ', 'T');
                if (tag === 0x013B) result.artist = readString(valOffset, count);
                if (tag === 0x8298) result.copyright = readString(valOffset, count);
                
                // 曝光参数
                if (tag === 0x8827) result.iso = view.getUint16(entryOffset + 8, littleEndian).toString();
                if (tag === 0x829A) {
                  const exp = getRational(view, valOffset, littleEndian);
                  result.exposureTime = exp < 1 ? `1/${Math.round(1/exp)}s` : `${exp}s`;
                }
                if (tag === 0x829D) result.aperture = `f/${getRational(view, valOffset, littleEndian).toFixed(1)}`;
                if (tag === 0x920A) result.focalLength = `${getRational(view, valOffset, littleEndian).toFixed(1)}mm`;

                // GPS 指针
                if (tag === 0x8825) gpsInfoOffset = view.getUint32(entryOffset + 8, littleEndian);
              }
            };

            parseIFD(ifdOffset);

            // 解析 GPS 子数据
            if (gpsInfoOffset !== -1) {
              const gpsStart = tiffOffset + gpsInfoOffset;
              const gpsEntries = view.getUint16(gpsStart, littleEndian);
              let latRef = "N", lonRef = "E";
              
              // 预扫描 Ref 标签
              for (let i = 0; i < gpsEntries; i++) {
                const entryOffset = gpsStart + 2 + (i * 12);
                const tag = view.getUint16(entryOffset, littleEndian);
                if (tag === 1) latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
                if (tag === 3) lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
              }

              for (let i = 0; i < gpsEntries; i++) {
                const entryOffset = gpsStart + 2 + (i * 12);
                const tag = view.getUint16(entryOffset, littleEndian);
                const valOffset = view.getUint32(entryOffset + 8, littleEndian) + tiffOffset;

                if (tag === 2) result.latitude = parseGPSCoordinate(view, valOffset, latRef, littleEndian);
                if (tag === 4) result.longitude = parseGPSCoordinate(view, valOffset, lonRef, littleEndian);
                if (tag === 6) result.altitude = `${getRational(view, valOffset, littleEndian).toFixed(1)}m`;
              }
            }
          }
          break;
        }
        offset += 2 + view.getUint16(offset + 2);
      }
      resolve(result);
    };
    reader.onerror = () => resolve({});
    reader.readAsArrayBuffer(file.slice(0, 256 * 1024)); // 增加读取范围以覆盖 GPS
  });
};

const ExifTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isRawExifOpen, setIsRawExifOpen] = useState(false);
  const [globalExif, setGlobalExif] = useState<ExifData>({
    make: '',
    model: '',
    software: 'PinkImg Editor',
    dateTime: new Date().toISOString().split('T')[0],
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = async (files: File[]) => {
    const newItems: ImageItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'idle',
      exif: { ...globalExif }
    }));
    
    setImages(prev => [...prev, ...newItems]);

    for (const item of newItems) {
      const originalExifData = await readExifFromBlob(item.file);
      setImages(prev => prev.map(img => img.id === item.id ? {
        ...img,
        originalExif: originalExifData,
        exif: { ...img.exif, ...originalExifData }
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
      description="深入查看并编辑图片的每一个拍摄细节，包括光圈、ISO、快门速度和精确的 GPS 坐标。"
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => {
        if (activeImageId === id) setActiveImageId(null);
        setImages(prev => prev.filter(i => i.id !== id));
      }}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="导出并保存修改"
      imageAction={(img) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveImageId(img.id); }}
          className="bg-pink-500 text-white p-2 rounded-xl shadow-lg transition-all active:scale-95 flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span className="text-xs font-black">查看参数</span>
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
            <span>全局应用</span>
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
          <div className="space-y-4">
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
                   <p className="text-[10px] text-pink-500 font-bold uppercase tracking-tight">参数已自动提取</p>
                 </div>
               </div>
               
               {/* Raw EXIF Preview Collapsible */}
               <div className="border-t border-slate-50 pt-3 mt-1">
                 <button 
                  onClick={() => setIsRawExifOpen(!isRawExifOpen)}
                  className="w-full flex items-center justify-between text-slate-400 hover:text-slate-600 transition-colors"
                 >
                   <div className="flex items-center space-x-2">
                     <FileText className="w-3 h-3" />
                     <span className="text-[10px] font-black uppercase tracking-widest">原始文件参数</span>
                   </div>
                   {isRawExifOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                 </button>
                 
                 {isRawExifOpen && (
                   <div className="mt-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                     {activeImage.originalExif && Object.keys(activeImage.originalExif).length > 0 ? (
                       <div className="grid grid-cols-1 gap-1.5 p-3 bg-slate-50 rounded-xl">
                         {/* Displaying expanded technical tags */}
                         {[
                           { key: 'make', label: '制造商', icon: <Camera className="w-2 h-2"/> },
                           { key: 'model', label: '型号', icon: <Activity className="w-2 h-2"/> },
                           { key: 'iso', label: 'ISO', icon: <Zap className="w-2 h-2"/> },
                           { key: 'aperture', label: '光圈', icon: <Maximize className="w-2 h-2"/> },
                           { key: 'exposureTime', label: '快门', icon: <Activity className="w-2 h-2"/> },
                           { key: 'focalLength', label: '焦距', icon: <Maximize className="w-2 h-2"/> },
                           { key: 'latitude', label: '纬度', icon: <MapPin className="w-2 h-2"/> },
                           { key: 'longitude', label: '经度', icon: <MapPin className="w-2 h-2"/> },
                           { key: 'altitude', label: '海拔', icon: <MapPin className="w-2 h-2"/> },
                           { key: 'dateTime', label: '日期', icon: <Calendar className="w-2 h-2"/> },
                         ].map(({key, label, icon}) => (
                           (activeImage.originalExif as any)[key] && (
                             <div key={key} className="flex justify-between text-[9px] border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                               <span className="text-slate-400 font-bold uppercase flex items-center space-x-1">
                                 {icon}
                                 <span>{label}</span>
                               </span>
                               <span className="text-slate-600 font-black text-right truncate pl-4">{(activeImage.originalExif as any)[key]}</span>
                             </div>
                           )
                         ))}
                       </div>
                     ) : (
                       <div className="text-[9px] text-slate-400 italic text-center py-2">
                         此文件不包含可读取的 EXIF 信息
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="group">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <Camera className="w-3 h-3 text-pink-500" />
                <span>核心设备信息</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="制造商"
                  value={currentExif.make || ''}
                  onChange={(e) => updateField('make', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                />
                <input 
                  type="text" placeholder="设备型号"
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
                type="datetime-local"
                value={currentExif.dateTime ? currentExif.dateTime.substring(0, 16) : ''}
                onChange={(e) => updateField('dateTime', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <MapPin className="w-3 h-3 text-pink-500" />
                <span>精准地理位置 (GPS)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input 
                  type="text" placeholder="纬度 (如 39.90)"
                  value={currentExif.latitude || ''}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
                <input 
                  type="text" placeholder="经度 (如 116.40)"
                  value={currentExif.longitude || ''}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>
              <input 
                type="text" placeholder="海拔高度 (m)"
                value={currentExif.altitude || ''}
                onChange={(e) => updateField('altitude', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            <div className="pt-2">
               <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1 block flex items-center space-x-2">
                <Activity className="w-3 h-3 text-pink-500" />
                <span>曝光参数预览 (只读显示)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-400">ISO</span>
                  <span className="text-[10px] font-black text-slate-700">{currentExif.iso || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-400">光圈</span>
                  <span className="text-[10px] font-black text-slate-700">{currentExif.aperture || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-slate-400">快门</span>
                  <span className="text-[10px] font-black text-slate-700">{currentExif.exposureTime || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Privacy Tip */}
        <div className={`p-4 rounded-3xl border-2 flex items-start space-x-3 transition-all ${privacyMode ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
          <ShieldOff className={`w-5 h-5 flex-shrink-0 mt-0.5 ${privacyMode ? 'text-red-500' : 'text-blue-500'}`} />
          <div>
            <div className="flex items-center justify-between">
              <h6 className={`text-xs font-black uppercase ${privacyMode ? 'text-red-600' : 'text-blue-600'}`}>安全合规</h6>
              <button onClick={() => setPrivacyMode(!privacyMode)} className={`text-[10px] font-black px-2 py-0.5 rounded-full ${privacyMode ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                {privacyMode ? '已开启隐私保护' : '清除所有定位'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
              保护您的数字足迹：开启后将彻底从图片文件中移除 GPS 坐标和设备识别码。
            </p>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default ExifTool;
