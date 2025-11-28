import { useEffect, useState } from 'react';
import { Settings, BookOpen, PenTool, Power, PowerOff } from 'lucide-react';
import { storage } from '../lib/storage';
import { cn } from '../lib/utils';

export default function Popup() {
    const [readingMode, setReadingMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReadingMode();
    }, []);

    async function loadReadingMode() {
        const mode = await storage.getReadingMode();
        setReadingMode(mode);
        setLoading(false);
    }

    async function toggleReadingMode() {
        const newMode = !readingMode;
        setReadingMode(newMode);
        await storage.setReadingMode(newMode);

        // Notify content script
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'READING_MODE_CHANGED', enabled: newMode });
        }
    }

    async function openSidePanel() {
        const window = await chrome.windows.getCurrent();
        if (window.id) {
            await chrome.sidePanel.open({ windowId: window.id });
        }
    }

    function openOptions() {
        chrome.runtime.openOptionsPage();
    }

    if (loading) {
        return (
            <div className="w-80 h-48 flex items-center justify-center bg-[#0a0a0a]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-80 bg-[#0a0a0a] text-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center gap-3">
                <img 
                    src="/icons/logo.png" 
                    alt="Logo" 
                    width="32" 
                    height="32" 
                    className="rounded-lg"
                />
                <div>
                    <h1 className="text-lg font-semibold text-white">
                        松鼠收藏夹
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">智能推文助手</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Reading Mode Toggle */}
                <div className="bg-[#141414] rounded-xl p-3 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <div>
                                <h3 className="text-sm font-medium text-white">读取模式</h3>
                                <p className="text-xs text-gray-500">自动收集推文</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleReadingMode}
                            className={cn(
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                readingMode ? 'bg-blue-600' : 'bg-gray-700'
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                                    readingMode ? 'translate-x-5' : 'translate-x-0.5'
                                )}
                            />
                        </button>
                    </div>
                    {readingMode && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-500">
                            <Power className="w-3 h-3" />
                            <span>已启用</span>
                        </div>
                    )}
                    {!readingMode && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                            <PowerOff className="w-3 h-3" />
                            <span>已关闭</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    <button
                        onClick={openSidePanel}
                        className="w-full flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-3 rounded-xl transition-colors text-sm"
                    >
                        <PenTool className="w-4 h-4" />
                        <span>打开创作面板</span>
                    </button>

                    <button
                        onClick={openOptions}
                        className="w-full flex items-center gap-2.5 bg-[#141414] hover:bg-[#1a1a1a] text-gray-300 font-medium py-2.5 px-3 rounded-xl transition-colors text-sm"
                    >
                        <Settings className="w-4 h-4" />
                        <span>设置</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 text-center text-xs text-gray-600">
                v1.0.0
            </div>
        </div>
    );
}
