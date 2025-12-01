import { getTenantAccessToken, syncToFeishu } from '../lib/feishu';
import type { FeishuSyncMessage } from '../lib/feishu';
import { storage } from '../lib/storage';
import type { InspirationMessage, Tweet, InspirationItem, Settings } from '../lib/types';
import { embedding } from '../lib/embedding';
import { vectorDB } from '../lib/vectorDB';

// Embedding 相关消息类型
interface EmbeddingMessage {
    type: 'EMBED_TWEET' | 'EMBED_INSPIRATION' | 'SEMANTIC_SEARCH' | 'TEST_EMBEDDING' | 'GET_VECTOR_STATS' | 'DELETE_VECTOR';
    tweet?: Tweet;
    inspiration?: InspirationItem;
    settings?: Settings;
    query?: string;
    topK?: number;
    searchType?: 'tweet' | 'inspiration';
    itemId?: string;
}

console.log('Background service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId) {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: FeishuSyncMessage | InspirationMessage, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.type === 'OPEN_SIDE_PANEL') {
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId });
        }
        sendResponse({ success: true });
    }

    // ==================== 灵感模式消息处理 ====================

    // 获取灵感模式状态
    if (message.type === 'GET_INSPIRATION_MODE') {
        storage.getInspirationMode()
            .then((enabled) => sendResponse({ enabled }))
            .catch((error) => sendResponse({ enabled: false, error: error.message }));
        return true;
    }

    // 设置灵感模式状态
    if (message.type === 'INSPIRATION_MODE_CHANGED') {
        const inspirationMsg = message as InspirationMessage;
        const enabled = inspirationMsg.enabled ?? false;
        storage.setInspirationMode(enabled)
            .then(async () => {
                // 广播给所有标签页
                const tabs = await chrome.tabs.query({});
                for (const tab of tabs) {
                    if (tab.id) {
                        try {
                            await chrome.tabs.sendMessage(tab.id, {
                                type: 'INSPIRATION_MODE_CHANGED',
                                enabled,
                            });
                        } catch {
                            // 忽略没有 content script 的标签页
                        }
                    }
                }
                sendResponse({ success: true });
            })
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // 获取灵感采集的内容
    if (message.type === 'GET_INSPIRATION_ITEMS') {
        storage.getInspirationItems()
            .then((items) => sendResponse({ items }))
            .catch((error) => sendResponse({ items: [], error: error.message }));
        return true;
    }

    // 保存灵感采集的内容
    if (message.type === 'INSPIRATION_ITEM_CAPTURED') {
        const inspirationMsg = message as InspirationMessage;
        if (inspirationMsg.item) {
            storage.addInspirationItem(inspirationMsg.item)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
        } else {
            sendResponse({ success: false, error: 'Missing item' });
        }
        return true;
    }

    // 清空灵感采集的内容
    if (message.type === 'INSPIRATION_ITEMS_CLEAR') {
        storage.clearInspirationItems()
            .then(() => sendResponse({ success: true }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // 删除单条灵感内容
    if ((message as InspirationMessage).type === 'INSPIRATION_ITEM_REMOVE') {
        const inspirationMsg = message as InspirationMessage;
        if (inspirationMsg.itemId) {
            storage.removeInspirationItem(inspirationMsg.itemId)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
        } else {
            sendResponse({ success: false, error: 'Missing itemId' });
        }
        return true;
    }

    // 处理飞书连接测试
    if (message.type === 'FEISHU_TEST_CONNECTION') {
        if (message.appId && message.appSecret) {
            getTenantAccessToken(message.appId, message.appSecret)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : '连接失败'
                    });
                });
        } else {
            sendResponse({ success: false, error: '缺少 App ID 或 App Secret' });
        }
        return true; // 保持消息通道开启以便异步响应
    }

    // 处理飞书同步（支持两种消息类型）
    if (message.type === 'FEISHU_SYNC' || message.type === 'SYNC_TO_FEISHU') {
        if (message.settings && message.tweets) {
            console.log('[Background] 收到飞书同步请求，内容数量:', message.tweets.length);
            syncToFeishu(message.settings, message.tweets)
                .then(() => {
                    console.log('[Background] 飞书同步成功');
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('[Background] 飞书同步失败:', error);
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : '同步失败'
                    });
                });
        } else {
            console.error('[Background] 飞书同步参数不完整');
            sendResponse({ success: false, error: '缺少必要参数' });
        }
        return true;
    }

    // ==================== Embedding 消息处理 ====================
    const embeddingMsg = message as unknown as EmbeddingMessage;

    // 为 Tweet 生成 embedding
    if (embeddingMsg.type === 'EMBED_TWEET') {
        if (embeddingMsg.tweet && embeddingMsg.settings) {
            console.log('[Background] 为 Tweet 生成 embedding:', embeddingMsg.tweet.id);
            embedding.embedTweet(embeddingMsg.tweet, embeddingMsg.settings)
                .then(() => sendResponse({ success: true }))
                .catch((error) => {
                    console.error('[Background] Tweet embedding 失败:', error);
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: '缺少 tweet 或 settings' });
        }
        return true;
    }

    // 为 Inspiration 生成 embedding
    if (embeddingMsg.type === 'EMBED_INSPIRATION') {
        if (embeddingMsg.inspiration && embeddingMsg.settings) {
            console.log('[Background] 为 Inspiration 生成 embedding:', embeddingMsg.inspiration.id);
            embedding.embedInspiration(embeddingMsg.inspiration, embeddingMsg.settings)
                .then(() => sendResponse({ success: true }))
                .catch((error) => {
                    console.error('[Background] Inspiration embedding 失败:', error);
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: '缺少 inspiration 或 settings' });
        }
        return true;
    }

    // 语义搜索
    if (embeddingMsg.type === 'SEMANTIC_SEARCH') {
        if (embeddingMsg.query && embeddingMsg.settings) {
            console.log('[Background] 执行语义搜索:', embeddingMsg.query);
            embedding.semanticSearch(embeddingMsg.query, embeddingMsg.settings, {
                topK: embeddingMsg.topK || 10,
                type: embeddingMsg.searchType
            })
                .then((results) => sendResponse({ success: true, results }))
                .catch((error) => {
                    console.error('[Background] 语义搜索失败:', error);
                    sendResponse({ success: false, error: error.message, results: [] });
                });
        } else {
            sendResponse({ success: false, error: '缺少 query 或 settings', results: [] });
        }
        return true;
    }

    // 测试 Embedding API 连接
    if (embeddingMsg.type === 'TEST_EMBEDDING') {
        if (embeddingMsg.settings) {
            console.log('[Background] 测试 Embedding API 连接');
            embedding.testEmbeddingConnection(embeddingMsg.settings)
                .then((result) => sendResponse(result))
                .catch((error) => sendResponse({ success: false, message: error.message }));
        } else {
            sendResponse({ success: false, message: '缺少 settings' });
        }
        return true;
    }

    // 获取向量统计
    if (embeddingMsg.type === 'GET_VECTOR_STATS') {
        vectorDB.getVectorStats()
            .then((stats) => sendResponse({ success: true, stats }))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // 删除向量
    if (embeddingMsg.type === 'DELETE_VECTOR') {
        if (embeddingMsg.itemId) {
            vectorDB.deleteVector(embeddingMsg.itemId)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
        } else {
            sendResponse({ success: false, error: '缺少 itemId' });
        }
        return true;
    }

    return true;
});
