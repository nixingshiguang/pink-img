
import React, { useState, useRef, useEffect } from 'react';
import {
    Palette, MousePointer2, Type, Sticker, Layout,
    Trash2, Download, Settings2, Undo, Move, X, ArrowRightLeft
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface Element {
    id: string;
    type: 'text' | 'sticker' | 'shape';
    content: string;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color?: string;
    fontSize?: number;
}

const CreateImageTool: React.FC = () => {
    // Views: 'setup' -> 'editor'
    const [view, setView] = useState<'setup' | 'editor'>('setup');

    // Configuration
    const [config, setConfig] = useState({
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff'
    });

    // Editor State
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Sticker/Emoji list
    const stickers = ['😀', '😍', '🎉', '🔥', '💖', '👍', '🚀', '💡', '🌈', '⭐'];

    const presets = [
        { label: 'Instagram Square', w: 1080, h: 1080 },
        { label: 'Instagram Story', w: 1080, h: 1920 },
        { label: 'Twitter Post', w: 1200, h: 675 },
        { label: 'YouTube Thumb', w: 1280, h: 720 },
        { label: 'Portrait 9:16', w: 1080, h: 1920 },
        { label: 'Standard 3:4', w: 1536, h: 2048 },
        { label: 'Tall 1:2', w: 1000, h: 2000 },
    ];

    const addElement = (type: 'text' | 'sticker' | 'shape', content: string) => {
        const newEl: Element = {
            id: Date.now().toString(),
            type,
            content,
            x: config.width / 2,
            y: config.height / 2,
            rotation: 0,
            scale: 1,
            color: type === 'text' ? '#000000' : undefined,
            fontSize: type === 'text' ? 40 : undefined
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const updateElement = (id: string, updates: Partial<Element>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const removeElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleExport = async () => {
        if (!canvasRef.current) return;
        setIsExporting(true);
        setSelectedId(null); // Deselect before capture

        try {
            // Simple delay to ensure render
            await new Promise(r => setTimeout(r, 100));
            const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
            const link = document.createElement('a');
            link.download = `pinkimg-create-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (view === 'setup') {
        return (
            <div className="flex-grow container mx-auto px-4 flex items-center justify-center">
                <div className="max-w-6xl w-full bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-pink-100 flex flex-col md:flex-row md:space-x-12 items-center">
                    <div className="md:w-1/3 text-center md:text-left mb-10 md:mb-0">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-3xl mb-6 text-pink-500 shadow-lg shadow-pink-100">
                            <Palette className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">开始<br /><span className="text-pink-500">创意之旅</span></h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            自定义画布尺寸，选择背景颜色，添加文字与贴纸。<br />
                            一切准备就绪，只等你来创作。
                        </p>
                    </div>

                    <div className="md:w-2/3 space-y-8 w-full">
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">常用尺寸</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {presets.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => setConfig({ ...config, width: p.w, height: p.h })}
                                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${config.width === p.w && config.height === p.h
                                            ? 'bg-slate-800 text-white border-slate-800 scale-105 shadow-md'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-pink-300'
                                            }`}
                                    >
                                        <div className="mb-1 truncate">{p.label}</div>
                                        <div className="opacity-60">{p.w} x {p.h}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end justify-between space-x-4">
                            <div className="flex-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">宽度 (PX)</label>
                                <input
                                    type="number"
                                    value={config.width}
                                    onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, width: config.height, height: config.width })}
                                className="mb-2 p-2 rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 transition-colors shadow-sm"
                                title="交换宽高"
                            >
                                <ArrowRightLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">高度 (PX)</label>
                                <input
                                    type="number"
                                    value={config.height}
                                    onChange={(e) => setConfig({ ...config, height: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">背景颜色</label>
                                <div className="flex items-center space-x-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    <input
                                        type="color"
                                        value={config.backgroundColor}
                                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent overflow-hidden"
                                    />
                                    <span className="font-mono text-sm font-bold text-slate-600 uppercase">{config.backgroundColor}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <button
                                    onClick={() => setView('editor')}
                                    className="w-full h-full py-4 bg-pink-500 text-white rounded-2xl font-black text-lg hover:bg-pink-600 transition-all shadow-lg shadow-pink-200 active:scale-95 flex items-center justify-center space-x-2 mt-6"
                                >
                                    <span>创建底图</span>
                                    <Layout className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Editor View
    return (
        <div className="flex-grow flex flex-col h-screen max-h-[calc(100vh-80px)]">
            {/* Toolbar */}
            <div className="bg-white border-b border-pink-100 p-4 flex items-center justify-between z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setView('setup')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <Settings2 className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <button
                        onClick={() => addElement('text', '双击编辑文本')}
                        className="flex items-center space-x-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl font-bold text-sm hover:bg-pink-100 transition-colors"
                    >
                        <Type className="w-4 h-4" />
                        <span>添加文字</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        {stickers.slice(0, 5).map(s => (
                            <button
                                key={s}
                                onClick={() => addElement('sticker', s)}
                                className="text-2xl hover:scale-125 transition-transform"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center space-x-2 hover:bg-slate-800 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>生成图片</span>
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-grow bg-slate-100 overflow-auto flex items-center justify-center p-8 relative">
                <div
                    ref={canvasRef}
                    style={{
                        width: config.width,
                        height: config.height,
                        backgroundColor: config.backgroundColor,
                    }}
                    className="shadow-2xl relative overflow-hidden transition-all duration-300"
                    onClick={() => setSelectedId(null)}
                >
                    {elements.map(el => (
                        <div
                            key={el.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                            }}
                            className={`absolute cursor-move select-none group ${selectedId === el.id ? 'z-50' : 'z-10'}`}
                            style={{
                                left: el.x,
                                top: el.y,
                                transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                            }}
                        >
                            <div className={`relative px-4 py-2 ${selectedId === el.id ? 'border-2 border-blue-500 rounded-lg bg-blue-50/20' : 'border-2 border-transparent hover:border-blue-300/50 rounded-lg'}`}>
                                {selectedId === el.id && (
                                    <>
                                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeElement(el.id);
                                            }}>
                                            <X className="w-3 h-3" />
                                        </div>
                                    </>
                                )}

                                {el.type === 'text' ? (
                                    <div
                                        contentEditable={selectedId === el.id}
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateElement(el.id, { content: e.currentTarget.innerText })}
                                        style={{
                                            color: el.color,
                                            fontSize: `${el.fontSize}px`,
                                            fontWeight: 'bold',
                                            fontFamily: 'sans-serif',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {el.content}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '64px' }}>{el.content}</div>
                                )}
                            </div>

                            {/* Simple Controls for Selected Item (Simulated for this MVP) */}
                            {selectedId === el.id && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-800 rounded-lg p-2 flex space-x-2 shadow-xl" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => updateElement(el.id, { scale: el.scale + 0.1 })} className="p-1 text-white hover:bg-slate-700 rounded"><Layout className="w-4 h-4" /></button>
                                    <button onClick={() => updateElement(el.id, { scale: Math.max(0.1, el.scale - 0.1) })} className="p-1 text-white hover:bg-slate-700 rounded"><Layout className="w-3 h-3" /></button>
                                    {el.type === 'text' && (
                                        <input
                                            type="color"
                                            value={el.color}
                                            onChange={(e) => updateElement(el.id, { color: e.target.value })}
                                            className="w-6 h-6 rounded cursor-pointer overflow-hidden border-0 p-0"
                                        />
                                    )}

                                    {/* Movement controls for better UX without drag-n-drop lib */}
                                    <div className="grid grid-cols-3 gap-0.5 w-16">
                                        <div></div>
                                        <button onClick={() => updateElement(el.id, { y: el.y - 10 })} className="bg-slate-700 hover:bg-slate-600 h-4 flex items-center justify-center rounded-sm"><Move className="w-2 h-2 text-white rotate-180" /></button>
                                        <div></div>
                                        <button onClick={() => updateElement(el.id, { x: el.x - 10 })} className="bg-slate-700 hover:bg-slate-600 h-4 flex items-center justify-center rounded-sm"><Move className="w-2 h-2 text-white -rotate-90" /></button>
                                        <div className="bg-slate-900 h-4 rounded-sm"></div>
                                        <button onClick={() => updateElement(el.id, { x: el.x + 10 })} className="bg-slate-700 hover:bg-slate-600 h-4 flex items-center justify-center rounded-sm"><Move className="w-2 h-2 text-white rotate-90" /></button>
                                        <div></div>
                                        <button onClick={() => updateElement(el.id, { y: el.y + 10 })} className="bg-slate-700 hover:bg-slate-600 h-4 flex items-center justify-center rounded-sm"><Move className="w-2 h-2 text-white" /></button>
                                        <div></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreateImageTool;
