import { useEffect, useState } from 'react';
import { Save, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Eye, EyeOff, Link2, HelpCircle, Cloud } from 'lucide-react';
import { storage } from '../lib/storage';
import { Settings } from '../lib/types';
import { callAI, defaultSummaryRules, defaultCreationRules } from '../lib/ai';
import { parseFeishuDocUrl } from '../lib/feishu';

export default function Options() {
    const [settings, setSettings] = useState<Settings>({
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        defaultLanguage: 'zh',
        readingMode: false,
    });
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [expandSummaryPrompt, setExpandSummaryPrompt] = useState(false);
    const [expandCreationPrompt, setExpandCreationPrompt] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [showFeishuGuide, setShowFeishuGuide] = useState(false);
    const [feishuDocUrl, setFeishuDocUrl] = useState('');
    const [testingFeishu, setTestingFeishu] = useState(false);
    const [feishuTestResult, setFeishuTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [syncingFeishu, setSyncingFeishu] = useState(false);
    const [feishuSyncResult, setFeishuSyncResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    // 当 settings 中的飞书配置变化时，同步到 feishuDocUrl
    useEffect(() => {
        if (settings.feishu?.docToken && settings.feishu?.docType) {
            // 只在 feishuDocUrl 为空时设置，避免覆盖用户正在输入的内容
            if (!feishuDocUrl) {
                setFeishuDocUrl(`已配置 (${settings.feishu.docType}: ${settings.feishu.docToken})`);
            }
        }
    }, [settings.feishu?.docToken, settings.feishu?.docType, feishuDocUrl]);

    async function loadSettings() {
        const stored = await storage.getSettings();
        if (stored) {
            setSettings(stored);
        }
    }

    async function handleSave() {
        await storage.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    async function testConnection() {
        setTesting(true);
        setTestResult(null);

        try {
            await callAI(settings, [
                { role: 'user', content: 'Hello, please respond with "OK"' }
            ]);
            setTestResult({ success: true, message: '连接成功！' });
        } catch (error) {
            setTestResult({
                success: false,
                message: error instanceof Error ? error.message : '连接失败'
            });
        } finally {
            setTesting(false);
        }
    }

    function handleFeishuDocUrl(url: string) {
        setFeishuDocUrl(url);

        // 清空之前的测试结果
        setFeishuTestResult(null);

        if (!url.trim()) {
            // 清空配置
            setSettings({
                ...settings,
                feishu: {
                    ...settings.feishu,
                    docToken: undefined,
                    docType: undefined,
                }
            });
            return;
        }

        const parsed = parseFeishuDocUrl(url);
        if (parsed) {
            console.log('[Options] 文档链接解析成功:', parsed);
            setSettings({
                ...settings,
                feishu: {
                    ...settings.feishu,
                    docToken: parsed.docToken,
                    docType: parsed.docType,
                }
            });
            setFeishuTestResult({
                success: true,
                message: `✓ 成功识别为${parsed.docType === 'wiki' ? '知识库' : parsed.docType === 'docx' ? '新版文档' : parsed.docType === 'doc' ? '旧版文档' : '电子表格'}`
            });
        } else {
            console.error('[Options] 文档链接解析失败，无法识别的格式:', url);
            setFeishuTestResult({
                success: false,
                message: '✗ 无法识别的文档类型，请检查链接格式。支持：docx(新版文档)、docs(旧版文档)、sheets(表格)、wiki(知识库)'
            });
        }
    }

    async function testFeishuConfig() {
        if (!settings.feishu?.appId || !settings.feishu?.appSecret) {
            setFeishuTestResult({ success: false, message: '请先填写 App ID 和 App Secret' });
            return;
        }

        setTestingFeishu(true);
        setFeishuTestResult(null);

        try {
            // 通过 background service worker 调用,避免 CORS 问题
            const response = await chrome.runtime.sendMessage({
                type: 'FEISHU_TEST_CONNECTION',
                appId: settings.feishu.appId,
                appSecret: settings.feishu.appSecret,
            });

            if (response.success) {
                setFeishuTestResult({ success: true, message: '连接成功！' });
            } else {
                setFeishuTestResult({
                    success: false,
                    message: response.error || '连接失败，请检查 App ID 和 App Secret'
                });
            }
        } catch (error) {
            setFeishuTestResult({
                success: false,
                message: error instanceof Error ? error.message : '连接失败'
            });
        } finally {
            setTestingFeishu(false);
        }
    }

    async function handleManualSync() {
        if (!settings.feishu?.appId || !settings.feishu?.appSecret || !settings.feishu?.docToken) {
            setFeishuSyncResult({ success: false, message: '请先完成飞书配置' });
            return;
        }

        setSyncingFeishu(true);
        setFeishuSyncResult(null);

        try {
            // 获取所有收藏的内容
            const tweets = await storage.getTweets();

            if (tweets.length === 0) {
                setFeishuSyncResult({ success: false, message: '暂无内容可同步' });
                return;
            }

            // 通过 background service worker 同步
            const response = await chrome.runtime.sendMessage({
                type: 'FEISHU_SYNC',
                settings: settings,
                tweets: tweets,
            });

            if (response.success) {
                setFeishuSyncResult({ success: true, message: `✓ 已同步 ${tweets.length} 条内容到飞书` });
            } else {
                setFeishuSyncResult({
                    success: false,
                    message: response.error || '同步失败，请检查配置'
                });
            }
        } catch (error) {
            setFeishuSyncResult({
                success: false,
                message: error instanceof Error ? error.message : '同步失败'
            });
        } finally {
            setSyncingFeishu(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-3xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <img 
                        src="/icons/logo.png" 
                        alt="Logo" 
                        width="36" 
                        height="36" 
                        className="rounded-lg"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-white">松鼠收藏夹 · 设置</h1>
                        <p className="text-sm text-gray-400 mt-1">配置 AI 模型和偏好设置</p>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="bg-[#141414] rounded-lg border border-gray-800 p-6 space-y-6">
                    {/* API Settings */}
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-4">AI API 配置</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        placeholder="sk-..."
                                        className="w-full px-3 py-2 pr-10 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                                        title={showApiKey ? '隐藏密钥' : '显示密钥'}
                                    >
                                        {showApiKey ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Base URL
                                </label>
                                <input
                                    type="url"
                                    value={settings.baseUrl}
                                    onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    兼容 OpenAI API 格式的接口地址
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    模型名称
                                </label>
                                <input
                                    type="text"
                                    value={settings.model}
                                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                    placeholder="gpt-4o"
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    例如：gpt-4o, claude-sonnet-4-20250514, gemini-pro 等
                                </p>
                            </div>

                            <button
                                onClick={testConnection}
                                disabled={testing || !settings.apiKey || !settings.baseUrl}
                                className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#242424] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-sm border border-gray-800"
                            >
                                {testing ? '测试中...' : '测试连接'}
                            </button>

                            {testResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.success
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {testResult.success ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    <span>{testResult.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Language Preference */}
                    <div className="pt-4 border-t border-gray-800">
                        <h2 className="text-lg font-semibold text-white mb-4">默认设置</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    默认语言
                                </label>
                                <select
                                    value={settings.defaultLanguage}
                                    onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value as 'zh' | 'en' | 'ja' | 'ko' })}
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                >
                                    <option value="zh">中文</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                </select>
                            </div>

                            {/* Image Recognition Toggle */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="imageRecognition"
                                    checked={settings.enableImageRecognition || false}
                                    onChange={(e) => setSettings({ ...settings, enableImageRecognition: e.target.checked })}
                                    className="mt-1 w-4 h-4 rounded bg-[#0a0a0a] border-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <label htmlFor="imageRecognition" className="text-sm font-medium text-gray-300 cursor-pointer">
                                        启用图片识别
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        使用多模态大模型识别图片中的文字内容，收藏时自动分析图片并提取文字。需要模型支持视觉功能（如 GPT-4o、Claude 3.5 Sonnet、Gemini Pro Vision）。
                                    </p>
                                </div>
                            </div>

                            {/* Vision Model Config - Only show when image recognition is enabled */}
                            {settings.enableImageRecognition && (
                                <div className="ml-7 space-y-4 p-4 bg-[#0a0a0a] rounded-lg border border-gray-800">
                                    <p className="text-xs text-amber-500/80 -mt-1">
                                        💡 以下配置为可选，留空则使用上方的主配置
                                    </p>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            视觉 API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={settings.visionApiKey || ''}
                                            onChange={(e) => setSettings({ ...settings, visionApiKey: e.target.value || undefined })}
                                            placeholder="留空则使用主 API Key"
                                            className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            视觉 API Base URL
                                        </label>
                                        <input
                                            type="url"
                                            value={settings.visionBaseUrl || ''}
                                            onChange={(e) => setSettings({ ...settings, visionBaseUrl: e.target.value || undefined })}
                                            placeholder="留空则使用主 Base URL"
                                            className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            视觉模型名称
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.visionModel || ''}
                                            onChange={(e) => setSettings({ ...settings, visionModel: e.target.value || undefined })}
                                            placeholder={settings.model || 'gpt-4o'}
                                            className="w-full px-3 py-2 bg-[#141414] border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            <span className="text-amber-500/80">阿里云：qwen-vl-max 或 qwen-vl-plus</span>
                                            <br />
                                            <span className="text-gray-600">OpenAI：gpt-4o | Anthropic：claude-sonnet-4-20250514 | Google：gemini-pro-vision</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Comment Collection Toggle */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="commentCollection"
                                    checked={settings.enableCommentCollection || false}
                                    onChange={(e) => setSettings({ ...settings, enableCommentCollection: e.target.checked })}
                                    className="mt-1 w-4 h-4 rounded bg-[#0a0a0a] border-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <label htmlFor="commentCollection" className="text-sm font-medium text-gray-300 cursor-pointer">
                                        收集评论区内容
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        收藏时同时收集评论区内容。作者自己的补充内容（线程/回复）会整合到摘要中，其他用户的精彩评论会单独展示为"评论区观点"。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Summary Prompt - Collapsible */}
                    <div className="pt-4 border-t border-gray-800">
                        <button
                            onClick={() => setExpandSummaryPrompt(!expandSummaryPrompt)}
                            className="w-full flex items-center justify-between py-2 text-left group"
                        >
                            <div className="flex items-center gap-2">
                                {expandSummaryPrompt ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    自定义摘要提示词
                                </h2>
                            </div>
                            <span className="text-xs text-gray-600">
                                {settings.customSummaryPrompt ? '已自定义' : '使用默认'}
                            </span>
                        </button>
                        
                        {expandSummaryPrompt && (
                            <div className="mt-3 space-y-3">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => setSettings({ ...settings, customSummaryPrompt: defaultSummaryRules })}
                                        className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#242424] hover:text-white transition-colors border border-gray-800"
                                    >
                                        恢复默认
                                    </button>
                                </div>
                                <textarea
                                    value={settings.customSummaryPrompt ?? defaultSummaryRules}
                                    onChange={(e) => setSettings({ ...settings, customSummaryPrompt: e.target.value })}
                                    rows={12}
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono resize-y"
                                />
                                <p className="text-xs text-gray-500">
                                    自定义内容分析规则，用于 AI 摘要和分类。格式要求（JSON输出）会自动添加。
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Custom Creation Prompt - Collapsible */}
                    <div className="pt-4 border-t border-gray-800">
                        <button
                            onClick={() => setExpandCreationPrompt(!expandCreationPrompt)}
                            className="w-full flex items-center justify-between py-2 text-left group"
                        >
                            <div className="flex items-center gap-2">
                                {expandCreationPrompt ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                    自定义创作提示词
                                </h2>
                            </div>
                            <span className="text-xs text-gray-600">
                                {settings.customCreationPrompt ? '已自定义' : '使用默认'}
                            </span>
                        </button>
                        
                        {expandCreationPrompt && (
                            <div className="mt-3 space-y-3">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => setSettings({ ...settings, customCreationPrompt: defaultCreationRules })}
                                        className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-gray-400 rounded-lg hover:bg-[#242424] hover:text-white transition-colors border border-gray-800"
                                    >
                                        恢复默认
                                    </button>
                                </div>
                                <textarea
                                    value={settings.customCreationPrompt ?? defaultCreationRules}
                                    onChange={(e) => setSettings({ ...settings, customCreationPrompt: e.target.value })}
                                    rows={12}
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono resize-y"
                                />
                                <p className="text-xs text-gray-500">
                                    自定义推文创作规则，包括 Twitter 排版格式、风格要求等。
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Feishu Sync Configuration */}
                    <div className="pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Link2 className="w-5 h-5 text-blue-500" />
                                <h2 className="text-lg font-semibold text-white">飞书同步</h2>
                            </div>
                            <button
                                onClick={() => setShowFeishuGuide(!showFeishuGuide)}
                                className="text-xs text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                {showFeishuGuide ? '隐藏指引' : '配置指引'}
                            </button>
                        </div>

                        {/* Configuration Guide */}
                        {showFeishuGuide && (
                            <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-400 mb-2 text-sm">📖 配置步骤</h3>
                                <ol className="text-xs text-blue-300/80 space-y-2 list-decimal list-inside">
                                    <li>
                                        <span className="font-medium">创建飞书机器人</span>
                                        <ul className="ml-6 mt-1 space-y-1 text-blue-300/60">
                                            <li>• 访问 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">飞书开放平台</a></li>
                                            <li>• 创建企业自建应用</li>
                                            <li>• 获取 App ID 和 App Secret</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <span className="font-medium">配置权限</span>
                                        <ul className="ml-6 mt-1 space-y-1 text-blue-300/60">
                                            <li>• 在"权限管理"中添加以下权限:</li>
                                            <li>• docs:doc (文档读写)</li>
                                            <li>• sheets:spreadsheet (表格读写)</li>
                                        </ul>
                                    </li>
                                    <li>
                                        <span className="font-medium">创建目标文档</span>
                                        <ul className="ml-6 mt-1 space-y-1 text-blue-300/60">
                                            <li>• 在飞书中创建一个新文档或表格</li>
                                            <li>• 点击文档右上角"三个点" → "添加文档应用"</li>
                                            <li>• 搜索并添加你创建的机器人应用</li>
                                            <li>• 复制文档链接粘贴到下方</li>
                                        </ul>
                                    </li>
                                </ol>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* App ID */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    App ID
                                </label>
                                <input
                                    type="text"
                                    value={settings.feishu?.appId || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        feishu: { ...settings.feishu, appId: e.target.value }
                                    })}
                                    placeholder="cli_xxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            {/* App Secret */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    App Secret
                                </label>
                                <input
                                    type="password"
                                    value={settings.feishu?.appSecret || ''}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        feishu: { ...settings.feishu, appSecret: e.target.value }
                                    })}
                                    placeholder="xxxxxxxxxxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                            </div>

                            {/* Test Connection Button */}
                            <button
                                onClick={testFeishuConfig}
                                disabled={testingFeishu || !settings.feishu?.appId || !settings.feishu?.appSecret}
                                className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#242424] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-sm border border-gray-800"
                            >
                                {testingFeishu ? '测试中...' : '测试连接'}
                            </button>

                            {feishuTestResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${feishuTestResult.success
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {feishuTestResult.success ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    <span>{feishuTestResult.message}</span>
                                </div>
                            )}

                            {/* Document URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    飞书文档链接
                                </label>
                                <input
                                    type="url"
                                    value={feishuDocUrl}
                                    onChange={(e) => handleFeishuDocUrl(e.target.value)}
                                    placeholder="https://xxx.feishu.cn/docx/xxxxx"
                                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    支持新版文档 (docx)、旧版文档 (docs)、电子表格 (sheets) 和知识库 (wiki)，粘贴链接后请点击下方"保存设置"
                                </p>
                                {settings.feishu?.docToken && (
                                    <p className="text-xs text-green-500 mt-1">
                                        ✓ 已解析文档 Token: {settings.feishu.docToken} ({settings.feishu.docType})
                                    </p>
                                )}
                            </div>

                            {/* Auto Sync Toggle */}
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="autoSync"
                                    checked={settings.feishu?.autoSync || false}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        feishu: { ...settings.feishu, autoSync: e.target.checked }
                                    })}
                                    className="mt-1 w-4 h-4 rounded bg-[#0a0a0a] border-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <div className="flex-1">
                                    <label htmlFor="autoSync" className="text-sm font-medium text-gray-300 cursor-pointer">
                                        自动同步到飞书
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        开启后，每次收藏新内容时会自动同步到飞书文档
                                    </p>
                                </div>
                            </div>

                            {/* Manual Sync Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleManualSync}
                                    disabled={syncingFeishu || !settings.feishu?.appId || !settings.feishu?.appSecret || !settings.feishu?.docToken}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#242424] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors text-sm border border-gray-800"
                                >
                                    <Cloud className="w-4 h-4" />
                                    {syncingFeishu ? '同步中...' : '立即同步所有内容'}
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    点击手动同步所有已收藏的内容到飞书文档（需先保存设置）
                                </p>
                            </div>

                            {/* Manual Sync Result */}
                            {feishuSyncResult && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${feishuSyncResult.success
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                    }`}>
                                    {feishuSyncResult.success ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4" />
                                    )}
                                    <span>{feishuSyncResult.message}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Save className="w-4 h-4" />
                            保存设置
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-green-500 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                已保存
                            </span>
                        )}
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-400 mb-2 text-sm">💡 提示</h3>
                    <ul className="text-xs text-blue-300/80 space-y-1">
                        <li>• API Key 将安全地存储在本地，不会上传到任何服务器</li>
                        <li>• 支持任何兼容 OpenAI API 格式的服务</li>
                        <li>• 推荐使用 GPT-4o、Claude Sonnet 或 Gemini Pro 获得最佳效果</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
