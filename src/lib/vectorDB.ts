/**
 * IndexedDB 向量存储层
 * 用于存储和检索 embedding 向量，支持语义搜索
 */

import type { VectorRecord } from './types';

const DB_NAME = 'SquirrelVectorDB';
const DB_VERSION = 1;
const STORE_NAME = 'vectors';

let dbInstance: IDBDatabase | null = null;

/**
 * 打开/初始化数据库
 */
async function openDB(): Promise<IDBDatabase> {
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('[VectorDB] 打开数据库失败:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            console.log('[VectorDB] 数据库已打开');
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // 创建向量存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                console.log('[VectorDB] 创建向量存储表');
            }
        };
    });
}

/**
 * 保存向量记录
 */
export async function saveVector(record: VectorRecord): Promise<void> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(record);

        request.onerror = () => {
            console.error('[VectorDB] 保存向量失败:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            console.log('[VectorDB] 向量已保存:', record.id);
            resolve();
        };
    });
}

/**
 * 获取向量记录
 */
export async function getVector(id: string): Promise<VectorRecord | null> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
    });
}

/**
 * 获取所有向量记录
 */
export async function getAllVectors(): Promise<VectorRecord[]> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * 按类型获取向量记录
 */
export async function getVectorsByType(type: 'tweet' | 'inspiration'): Promise<VectorRecord[]> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('type');
        const request = index.getAll(type);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

/**
 * 删除向量记录
 */
export async function deleteVector(id: string): Promise<void> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('[VectorDB] 向量已删除:', id);
            resolve();
        };
    });
}

/**
 * 清空所有向量
 */
export async function clearAllVectors(): Promise<void> {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('[VectorDB] 所有向量已清空');
            resolve();
        };
    });
}

/**
 * 计算余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        console.warn('[VectorDB] 向量维度不匹配:', a.length, 'vs', b.length);
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 语义搜索 - 返回相似度最高的 K 条记录
 */
export async function searchSimilar(
    queryVector: number[],
    topK: number = 10,
    type?: 'tweet' | 'inspiration'
): Promise<Array<{ record: VectorRecord; similarity: number }>> {
    const vectors = type ? await getVectorsByType(type) : await getAllVectors();
    
    if (vectors.length === 0) {
        return [];
    }

    // 计算所有记录的相似度
    const results = vectors.map(record => ({
        record,
        similarity: cosineSimilarity(queryVector, record.vector)
    }));

    // 按相似度降序排序，取 Top-K
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK);
}

/**
 * 获取向量数量统计
 */
export async function getVectorStats(): Promise<{ total: number; tweets: number; inspirations: number }> {
    const all = await getAllVectors();
    const tweets = all.filter(v => v.type === 'tweet').length;
    const inspirations = all.filter(v => v.type === 'inspiration').length;
    
    return {
        total: all.length,
        tweets,
        inspirations
    };
}

// 导出 vectorDB 对象
export const vectorDB = {
    saveVector,
    getVector,
    getAllVectors,
    getVectorsByType,
    deleteVector,
    clearAllVectors,
    cosineSimilarity,
    searchSimilar,
    getVectorStats
};

