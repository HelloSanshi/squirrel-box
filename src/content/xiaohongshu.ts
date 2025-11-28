import { storage } from '../lib/storage';
import { summarizeTweet, recognizeImage } from '../lib/ai';
import { generateId } from '../lib/utils';
import { Tweet } from '../lib/types';

console.log('松鼠收藏夹 (小红书): Content script loaded');

let readingMode = false;
let currentNote: Element | null = null;

// Load reading mode state
storage.getReadingMode().then((mode) => {
    readingMode = mode;
    console.log('Reading mode:', readingMode);
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'READING_MODE_CHANGED') {
        readingMode = message.enabled;
        console.log('Reading mode changed:', readingMode);
    }

    if (message.type === 'PUBLISH_TWEET') {
        // 小红书发布功能可以后续实现
        sendResponse({ success: false, message: '小红书发布功能开发中' });
    }

    return true;
});

// Create floating collect button
function createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('twitter-ai-floating-btn')) {
        return;
    }

    const floatingBtn = document.createElement('div');
    floatingBtn.id = 'twitter-ai-floating-btn';
    floatingBtn.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="22" fill="#FF6B35"/>
      <path d="M 75 65 Q 85 55 88 45 Q 90 38 88 32 Q 85 28 80 30 Q 75 33 72 40 Q 70 45 70 52 Q 68 58 70 65 Z" fill="#D2691E"/>
      <path d="M 77 62 Q 84 54 86 46 Q 87 40 85 35 Q 83 32 79 34 Q 75 37 73 43 Q 72 48 72 54 Q 71 59 72 62 Z" fill="#CD853F"/>
      <ellipse cx="50" cy="58" rx="20" ry="18" fill="#CD853F"/>
      <ellipse cx="38" cy="42" rx="14" ry="15" fill="#D2691E"/>
      <ellipse cx="35" cy="30" rx="4" ry="7" fill="#D2691E"/>
      <ellipse cx="35" cy="31" rx="2" ry="4" fill="#F4A460"/>
      <circle cx="32" cy="40" r="3" fill="#000"/>
      <circle cx="31" cy="39" r="1" fill="#FFF"/>
      <circle cx="26" cy="44" r="2" fill="#000"/>
      <ellipse cx="30" cy="48" rx="3" ry="2" fill="#F4A460" opacity="0.6"/>
      <ellipse cx="42" cy="65" rx="4" ry="10" fill="#CD853F" transform="rotate(20 42 65)"/>
      <ellipse cx="58" cy="70" rx="5" ry="8" fill="#D2691E"/>
      <ellipse cx="38" cy="60" rx="5" ry="6" fill="#8B6914"/>
      <ellipse cx="38" cy="56" rx="4" ry="2.5" fill="#654321"/>
      <path d="M 34 56 L 42 56 L 42 54 L 34 54 Z" fill="#654321"/>
      <path d="M 74 58 Q 78 52 80 46" stroke="#A0522D" stroke-width="1.5" fill="none" opacity="0.5"/>
      <path d="M 76 62 Q 80 56 82 50" stroke="#A0522D" stroke-width="1.5" fill="none" opacity="0.5"/>
    </svg>
  `;
    floatingBtn.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    transition: all 0.3s ease;
    user-select: none;
  `;

    // Draggable functionality
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    floatingBtn.onmousedown = (e) => {
        isDragging = true;
        floatingBtn.style.cursor = 'grabbing';
        floatingBtn.style.transition = 'none';

        const rect = floatingBtn.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialX = rect.left;
        initialY = rect.top;

        e.preventDefault();
    };

    document.onmousemove = (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newX = initialX + deltaX;
        const newY = initialY + deltaY;

        floatingBtn.style.left = `${newX}px`;
        floatingBtn.style.top = `${newY}px`;
        floatingBtn.style.right = 'auto';
        floatingBtn.style.bottom = 'auto';
    };

    document.onmouseup = (e) => {
        if (!isDragging) return;

        isDragging = false;
        floatingBtn.style.cursor = 'grab';
        floatingBtn.style.transition = 'all 0.3s ease';

        // Snap to nearest edge
        const rect = floatingBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const distanceToLeft = centerX;
        const distanceToRight = windowWidth - centerX;
        const distanceToTop = centerY;
        const distanceToBottom = windowHeight - centerY;

        const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

        const margin = 30;

        if (minDistance === distanceToLeft) {
            floatingBtn.style.left = `${margin}px`;
            floatingBtn.style.top = `${Math.max(margin, Math.min(rect.top, windowHeight - rect.height - margin))}px`;
        } else if (minDistance === distanceToRight) {
            floatingBtn.style.left = `${windowWidth - rect.width - margin}px`;
            floatingBtn.style.top = `${Math.max(margin, Math.min(rect.top, windowHeight - rect.height - margin))}px`;
        } else if (minDistance === distanceToTop) {
            floatingBtn.style.left = `${Math.max(margin, Math.min(rect.left, windowWidth - rect.width - margin))}px`;
            floatingBtn.style.top = `${margin}px`;
        } else {
            floatingBtn.style.left = `${Math.max(margin, Math.min(rect.left, windowWidth - rect.width - margin))}px`;
            floatingBtn.style.top = `${windowHeight - rect.height - margin}px`;
        }

        floatingBtn.style.right = 'auto';
        floatingBtn.style.bottom = 'auto';

        // Only trigger click if not dragged
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < 5) {
            collectCurrentNote();
        }
    };

    floatingBtn.onmouseover = () => {
        if (!isDragging) {
            floatingBtn.style.transform = 'scale(1.08) translateY(-2px)';
            floatingBtn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        }
    };

    floatingBtn.onmouseout = () => {
        if (!isDragging) {
            floatingBtn.style.transform = 'scale(1) translateY(0)';
            floatingBtn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        }
    };

    document.body.appendChild(floatingBtn);
    console.log('Floating button created');
}

// Track current note on hover
function trackCurrentNote() {
    document.addEventListener('mouseover', (e) => {
        const target = e.target as HTMLElement;
        // 小红书笔记的选择器可能需要根据实际页面结构调整
        const noteElement = target.closest('.note-item, [class*="note"], [class*="card"]');
        if (noteElement) {
            currentNote = noteElement;
        }
    });
}

async function collectCurrentNote() {
    if (!currentNote) {
        showNotification('请先将鼠标悬停在要收藏的笔记上');
        return;
    }

    try {
        await collectNote(currentNote);
        showNotification('✓ 已收藏！');
    } catch (error) {
        console.error('Failed to collect note:', error);
        showNotification('✗ 收藏失败');
    }
}

async function collectNote(noteElement: Element) {
    try {
        // 提取笔记数据 - 这些选择器需要根据小红书实际DOM结构调整
        const titleElement = noteElement.querySelector('.note-title, [class*="title"]');
        const contentElement = noteElement.querySelector('.note-content, [class*="desc"], [class*="content"]');
        const authorElement = noteElement.querySelector('.author-name, [class*="author"], [class*="name"]');

        const title = titleElement?.textContent?.trim() || '';
        const content = contentElement?.textContent?.trim() || '';
        const fullContent = title ? `${title}\n\n${content}` : content;

        if (!fullContent) {
            throw new Error('无法提取笔记内容');
        }

        const authorName = authorElement?.textContent?.trim() || 'Unknown';

        // 提取笔记URL
        const linkElement = noteElement.querySelector('a[href*="/explore/"]');
        const noteUrl = linkElement ? new URL(linkElement.getAttribute('href') || '', window.location.origin).href : window.location.href;

        // 提取图片
        const imageElements = noteElement.querySelectorAll('img[src]');
        const media = Array.from(imageElements)
            .map(img => (img as HTMLImageElement).src)
            .filter(src => src && !src.includes('avatar')); // 过滤掉头像图片

        const tweet: Tweet = {
            id: generateId(),
            tweetId: extractNoteId(noteUrl),
            tweetUrl: noteUrl,
            author: authorName,
            authorHandle: authorName.toLowerCase().replace(/\s+/g, '_'),
            content: fullContent,
            platform: 'xiaohongshu',
            keywords: [],
            collectTime: Date.now(),
            media,
            stats: {
                likes: 0,
                retweets: 0,
                replies: 0,
            },
        };

        console.log('Collecting note:', tweet);

        // Save note
        await storage.saveTweet(tweet);

        // Get AI summary in background
        const settings = await storage.getSettings();
        if (settings && settings.apiKey) {
            try {
                let contentToAnalyze = fullContent;

                // 如果启用了图片识别且有图片，先识别图片内容
                if (settings.enableImageRecognition && media.length > 0) {
                    console.log('图片识别已启用，开始识别图片内容...');
                    try {
                        const imageTexts = await Promise.all(
                            media.slice(0, 3).map(url => recognizeImage(settings, url))
                        );
                        const recognizedText = imageTexts.filter(t => t).join('\n\n');
                        if (recognizedText) {
                            contentToAnalyze = `${fullContent}\n\n【图片内容】\n${recognizedText}`;
                            console.log('图片识别完成，识别出文字:', recognizedText.slice(0, 100));
                        }
                    } catch (error) {
                        console.error('图片识别失败:', error);
                        // 识别失败也继续处理原始内容
                    }
                }

                const aiResult = await summarizeTweet(settings, contentToAnalyze);
                await storage.updateTweet(tweet.id, {
                    summary: aiResult.summary,
                    keywords: aiResult.keywords,
                    sentiment: aiResult.sentiment,
                    category: aiResult.category,
                });
                console.log('AI summary completed');
            } catch (error) {
                console.error('Failed to get AI summary:', error);
            }
        }
    } catch (error) {
        console.error('Failed to collect note:', error);
        throw error;
    }
}

function extractNoteId(url: string): string {
    const match = url.match(/\/explore\/([a-zA-Z0-9]+)/);
    return match ? match[1] : generateId();
}

function showNotification(message: string) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 80px;
    background: #1d9bf0;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(29, 155, 240, 0.3);
    z-index: 10001;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
function init() {
    console.log('Initializing Twitter AI Assistant for 小红书...');
    createFloatingButton();
    trackCurrentNote();
    console.log('Twitter AI Assistant for 小红书 initialized!');
}

// Wait for page to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
