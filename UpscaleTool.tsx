
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { GoogleGenAI } from "@google/genai";

const UpscaleTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [scaleFactor, setScaleFactor] = useState('2x');
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file), status: 'idle' }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const processImages = async () => {
    setIsProcessing(true);

    const manualKey = localStorage.getItem('GEMINI_API_KEY');
    const finalKey = manualKey || process.env.API_KEY;

    if (!finalKey) {
      alert("请先在设置中配置 Gemini API Key");
      setIsProcessing(false);
      return;
    }

    for (const img of images) {
      if (img.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
          reader.readAsDataURL(img.file);
        });

        // Initialize GoogleGenAI with either the manual key or environment key
        const ai = new GoogleGenAI({ apiKey: finalKey as string });
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [
              { inlineData: { data: base64, mimeType: img.file.type } },
              { text: `Enhance and upscale this image by ${scaleFactor} while preserving textures and removing noise. Return high quality image data.` }
            ]
          },
          config: {
            imageConfig: {
              imageSize: "1K"
            }
          }
        });

        // Find the image part in the response
        let resultUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            resultUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (resultUrl) {
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: resultUrl } : i));
        } else {
          throw new Error("No image data returned from AI");
        }
      } catch (err: any) {
        console.error(err);
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', error: 'AI处理失败: ' + (err as Error).message } : i));
      }
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="提升图片质量"
      description="批量利用 AI 放大并修复图片细节。此功能需要您在设置中手动输入 API Key。"
      isAi={true}
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="开始提升"
    >
      <div className="space-y-4">
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">放大倍率</label>
        <div className="flex bg-slate-50 p-1 rounded-xl">
          {['2x', '4x'].map(f => (
            <button key={f} onClick={() => setScaleFactor(f)} className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${scaleFactor === f ? 'bg-white shadow text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default UpscaleTool;
