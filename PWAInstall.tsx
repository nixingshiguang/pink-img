import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const PWAInstall: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-bounce-in">
            <div className="bg-slate-900/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shrink-0">
                        <img src="/icon.svg" className="w-8 h-8" alt="App Icon" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">安装 PinkImg App</h3>
                        <p className="text-slate-300 text-xs">添加到主屏幕，离线也能使用！</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowInstallBanner(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-pink-500/20"
                    >
                        安装
                    </button>
                </div>
            </div>
        </div>
    );
};
