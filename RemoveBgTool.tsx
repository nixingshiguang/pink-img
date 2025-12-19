
import React, { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { GoogleGenAI } from "@google/genai";

const RemoveBgTool: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: File[]) => {
    const newImgs = files.map(file => ({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file), status: 'idle' }));
    setImages(prev => [...prev, ...newImgs]);
  };

  const processImages = async () => {
    setIsProcessing(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    for (const img of images) {
      if (img.status === 'done') continue;
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'processing' } : i));

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
          reader.readAsDataURL(img.file);
        });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64, mimeType: img.file.type } },
              { text: "Remove the background from this image. Output only the subject with a transparent background in high quality PNG format." }
            ]
          }
        });

        const resultPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (resultPart?.inlineData) {
          const res = `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
          setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'done', result: res } : i));
          const link = document.createElement('a');
          link.href = res;
          link.download = `no-bg_${img.file.name.split('.')[0]}.png`;
          link.click();
        }
      } catch (err) {
        setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', error: 'AI处理失败' } : i));
      }
    }
    setIsProcessing(false);
  };

  return (
    <ToolPageLayout
      title="去除背景"
      description="利用 AI 智能识别主体，一键移除复杂背景。"
      isAi={true}
      images={images}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setImages(prev => prev.filter(i => i.id !== id))}
      onProcess={processImages}
      isProcessing={isProcessing}
      actionText="移除背景"
    >
      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
        <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
          AI 将自动识别图像中的主体并精准移除背景。处理时间取决于图像复杂程度。
        </p>
      </div>
    </ToolPageLayout>
  );
};

export default RemoveBgTool;
