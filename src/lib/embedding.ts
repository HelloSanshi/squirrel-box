/**
 * Embedding API 调用模块
 * 支持 OpenAI 兼容格式的 Embedding 服务
 */

import type { Settings, VectorRecord, Tweet, InspirationItem } from './types';
import { vectorDB } from './vectorDB';

/**
 * 调用 Embedding API 获取向量
 */
export async function getEmbedding(
    text: string,
    settings: Settings
): Promise<number[]> {
    // 使用 embedding 配置，如果没有则使用主配置
    const apiKey = settings.embeddingApiKey || settings.apiKey;
    const baseUrl = settings.embeddingBaseUrl || settings.baseUrl;
    const model = settings.embeddingModel || 'text-embedding-3-small';

    if (!apiKey) {
        throw new Error('未配置 API Key');
    }

    // 清理和截断文本（大多数模型限制 8192 tokens）
    const cleanedText = text.trim().slice(0, 8000);
    
    if (!cleanedText) {
        throw new Error('文本内容为空');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/embeddings`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            input: cleanedText,
            encoding_format: 'float'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Embedding] API 错误:', response.status, errorText);
        throw new Error(`Embedding API 错误: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data?.[0]?.embedding) {
        console.error('[Embedding] 响应格式错误:', data);
        throw new Error('Embedding 响应格式错误');
    }

    return data.data[0].embedding;
}

/**
 * 批量获取 Embedding（优化 API 调用）
 */
export async function getEmbeddings(
    texts: string[],
    settings: Settings
): Promise<number[][]> {
    const apiKey = settings.embeddingApiKey || settings.apiKey;
    const baseUrl = settings.embeddingBaseUrl || settings.baseUrl;
    const model = settings.embeddingModel || 'text-embedding-3-small';

    if (!apiKey) {
        throw new Error('未配置 API Key');
    }

    const cleanedTexts = texts.map(t => t.trim().slice(0, 8000)).filter(t => t);
    
    if (cleanedTexts.length === 0) {
        return [];
    }

    const url = `${baseUrl.replace(/\/$/, '')}/embeddings`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            input: cleanedTexts,
            encoding_format: 'float'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding API 错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return data.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * 从 Tweet 生成用于 embedding 的文本
 */
function getTweetText(tweet: Tweet): string {
    const parts = [
        tweet.content,
        tweet.summary,
        tweet.authorThread,
        tweet.commentHighlights
    ].filter(Boolean);
    
    return parts.join('\n\n');
}

/**
 * 从 InspirationItem 生成用于 embedding 的文本
 */
function getInspirationText(item: InspirationItem): string {
    const parts = [
        item.title,
        item.content,
        item.summary,
        item.authorThread,
        item.commentHighlights
    ].filter(Boolean);
    
    return parts.join('\n\n');
}

/**
 * 为 Tweet 生成并保存 embedding
 */
export async function embedTweet(tweet: Tweet, settings: Settings): Promise<void> {
    if (!settings.enableSemanticSearch) {
        return;
    }

    try {
        const text = getTweetText(tweet);
        if (!text.trim()) {
            console.log('[Embedding] Tweet 内容为空，跳过:', tweet.id);
            return;
        }

        const vector = await getEmbedding(text, settings);
        
        const record: VectorRecord = {
            id: tweet.id,
            type: 'tweet',
            content: text,
            vector,
            createdAt: Date.now()
        };

        await vectorDB.saveVector(record);
        console.log('[Embedding] Tweet 向量已保存:', tweet.id);
    } catch (error) {
        console.error('[Embedding] 生成 Tweet embedding 失败:', error);
        // 不抛出错误，避免影响收藏流程
    }
}

/**
 * 为 InspirationItem 生成并保存 embedding
 */
export async function embedInspiration(item: InspirationItem, settings: Settings): Promise<void> {
    if (!settings.enableSemanticSearch) {
        return;
    }

    try {
        const text = getInspirationText(item);
        if (!text.trim()) {
            console.log('[Embedding] Inspiration 内容为空，跳过:', item.id);
            return;
        }

        const vector = await getEmbedding(text, settings);
        
        const record: VectorRecord = {
            id: item.id,
            type: 'inspiration',
            content: text,
            vector,
            createdAt: Date.now()
        };

        await vectorDB.saveVector(record);
        console.log('[Embedding] Inspiration 向量已保存:', item.id);
    } catch (error) {
        console.error('[Embedding] 生成 Inspiration embedding 失败:', error);
    }
}

/**
 * 语义搜索
 */
export async function semanticSearch(
    query: string,
    settings: Settings,
    options?: {
        topK?: number;
        type?: 'tweet' | 'inspiration';
    }
): Promise<Array<{ id: string; type: string; content: string; similarity: number }>> {
    if (!settings.enableSemanticSearch) {
        return [];
    }

    const { topK = 10, type } = options || {};

    try {
        const queryVector = await getEmbedding(query, settings);
        const results = await vectorDB.searchSimilar(queryVector, topK, type);

        return results.map(({ record, similarity }) => ({
            id: record.id,
            type: record.type,
            content: record.content,
            similarity
        }));
    } catch (error) {
        console.error('[Embedding] 语义搜索失败:', error);
        throw error;
    }
}

/**
 * 测试 Embedding API 连接
 */
export async function testEmbeddingConnection(settings: Settings): Promise<{ success: boolean; message: string; dimensions?: number }> {
    try {
        const testText = 'Hello, this is a test for embedding API connection.';
        const vector = await getEmbedding(testText, settings);
        
        return {
            success: true,
            message: `连接成功！向量维度: ${vector.length}`,
            dimensions: vector.length
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '连接失败'
        };
    }
}

/**
 * 删除 Tweet 对应的向量
 */
export async function deleteTweetVector(tweetId: string): Promise<void> {
    try {
        await vectorDB.deleteVector(tweetId);
    } catch (error) {
        console.error('[Embedding] 删除向量失败:', error);
    }
}

/**
 * 删除 Inspiration 对应的向量
 */
export async function deleteInspirationVector(itemId: string): Promise<void> {
    try {
        await vectorDB.deleteVector(itemId);
    } catch (error) {
        console.error('[Embedding] 删除向量失败:', error);
    }
}

// 导出
export const embedding = {
    getEmbedding,
    getEmbeddings,
    embedTweet,
    embedInspiration,
    semanticSearch,
    testEmbeddingConnection,
    deleteTweetVector,
    deleteInspirationVector
};

