import { storage } from '../lib/storage';
import { summarizeTweet, recognizeImage } from '../lib/ai';
import { generateId } from '../lib/utils';
import { Tweet } from '../lib/types';

console.log('松鼠收藏夹: Content script loaded');

let readingMode = false;
let currentTweet: Element | null = null;
let floatingBtnElement: HTMLElement | null = null; // 悬浮按钮元素引用

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
        publishTweetToTwitter(message.content);
        sendResponse({ success: true });
    }

    // 切换悬浮按钮显示/隐藏
    if (message.type === 'TOGGLE_FLOATING_BUTTON') {
        const show = message.show;
        if (floatingBtnElement) {
            floatingBtnElement.style.display = show ? 'flex' : 'none';
        }
        console.log('悬浮按钮显示状态:', show ? '显示' : '隐藏');
        sendResponse({ success: true });
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
    const logoUrl = chrome.runtime.getURL('icons/logo.png');
    floatingBtn.innerHTML = `
    <img src="${logoUrl}" width="40" height="40" style="border-radius: 10px; display: block;">
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
            collectCurrentTweet();
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
    floatingBtnElement = floatingBtn; // 保存引用
    console.log('Floating button created');
}

// Track current tweet on hover
function trackCurrentTweet() {
    document.addEventListener('mouseover', (e) => {
        const target = e.target as HTMLElement;
        const tweetElement = target.closest('article[data-testid="tweet"]');
        if (tweetElement) {
            currentTweet = tweetElement;
            // 移除高亮效果，不再显示蓝色框线
            // highlightTweet(tweetElement as HTMLElement);
        }
    });
}

async function collectCurrentTweet() {
    if (!currentTweet) {
        showNotification('请先将鼠标悬停在要收藏的推文上');
        return;
    }

    try {
        await collectTweet(currentTweet);
        showNotification('✓ 已收藏！');
    } catch (error) {
        console.error('Failed to collect tweet:', error);
        showNotification('✗ 收藏失败');
    }
}

async function collectTweet(tweetElement: Element) {
    try {
        // Extract tweet data
        const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
        const content = textElement?.textContent || '';

        if (!content) {
            throw new Error('无法提取推文内容');
        }

        const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
        const authorName = authorElement?.querySelector('span')?.textContent || 'Unknown';

        // 改进 handle 提取：从用户链接中获取，更可靠
        let authorHandle = 'unknown';
        const userLink = tweetElement.querySelector('a[href^="/"][role="link"]');
        if (userLink) {
            const href = userLink.getAttribute('href') || '';
            const handleMatch = href.match(/^\/([^/]+)$/);
            if (handleMatch) {
                authorHandle = handleMatch[1];
            }
        }
        // 备用方案：查找包含 @ 的文本
        if (authorHandle === 'unknown') {
            const allSpans = authorElement?.querySelectorAll('span') || [];
            for (const span of allSpans) {
                const text = span.textContent || '';
                if (text.startsWith('@')) {
                    authorHandle = text.replace('@', '');
                    break;
                }
            }
        }
        console.log('提取到的 authorHandle:', authorHandle);

        // Extract stats
        const likeButton = tweetElement.querySelector('[data-testid="like"]');
        const retweetButton = tweetElement.querySelector('[data-testid="retweet"]');
        const replyButton = tweetElement.querySelector('[data-testid="reply"]');

        const getCount = (button: Element | null) => {
            if (!button) return 0;
            const text = button.getAttribute('aria-label') || '0';
            const match = text.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        };

        // Extract media (过滤掉头像、emoji 等非内容图片)
        const mediaElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com"]');
        const media = Array.from(mediaElements)
            .map(img => (img as HTMLImageElement).src)
            .filter(src => {
                // 过滤掉头像图片
                if (src.includes('profile_images')) return false;
                // 过滤掉 emoji 图片
                if (src.includes('emoji')) return false;
                // 过滤掉缩略图（太小的图片）
                if (src.includes('_normal') || src.includes('_mini')) return false;
                // 只保留媒体图片（通常包含 media 或 tweet_video_thumb）
                return src.includes('/media/') || src.includes('tweet_video_thumb') || src.includes('ext_tw_video_thumb');
            });

        // Extract tweet URL
        const tweetId = extractTweetId(tweetElement);
        const tweetUrl = `https://twitter.com/${authorHandle}/status/${tweetId}`;

        // 获取设置
        const settings = await storage.getSettings();

        // 收集评论区内容（如果启用）
        let commentData: CommentData | null = null;
        console.log('评论区收集设置:', settings?.enableCommentCollection ? '已开启' : '未开启');
        if (settings?.enableCommentCollection) {
            console.log('开始收集评论区内容...');
            commentData = collectComments(tweetElement, authorHandle);
            console.log('评论区收集完成:', {
                authorThread: commentData.authorThread.slice(0, 50),
                commentsCount: commentData.otherComments.length
            });
        }

        const tweet: Tweet = {
            id: generateId(),
            tweetId,
            tweetUrl,
            author: authorName,
            authorHandle,
            content,
            platform: 'twitter',
            keywords: [],
            collectTime: Date.now(),
            media,
            stats: {
                likes: getCount(likeButton),
                retweets: getCount(retweetButton),
                replies: getCount(replyButton),
            },
            // 评论区内容
            authorThread: commentData?.authorThread || undefined,
            commentHighlights: commentData?.otherComments.length ? commentData.otherComments.join('\n') : undefined,
        };

        console.log('Collecting tweet:', tweet);

        // Save tweet
        await storage.saveTweet(tweet);

        // Get AI summary in background
        if (settings && settings.apiKey) {
            try {
                let contentToAnalyze = content;

                // 如果有作者的线程内容，整合进去
                if (commentData?.authorThread) {
                    contentToAnalyze = `${content}\n\n【作者补充内容】\n${commentData.authorThread}`;
                }

                // 如果启用了图片识别且有图片，先识别图片内容
                if (settings.enableImageRecognition && media.length > 0) {
                    console.log('图片识别已启用，开始识别图片内容...');
                    try {
                        const imageTexts = await Promise.all(
                            media.slice(0, 3).map(url => recognizeImage(settings, url))
                        );
                        const recognizedText = imageTexts.filter(t => t).join('\n\n');
                        if (recognizedText) {
                            contentToAnalyze = `${contentToAnalyze}\n\n【图片内容】\n${recognizedText}`;
                            console.log('图片识别完成，识别出文字:', recognizedText.slice(0, 100));
                        }
                    } catch (error) {
                        console.error('图片识别失败:', error);
                        // 识别失败也继续处理原始内容
                    }
                }

                // 如果有其他用户的评论，添加到分析内容中
                if (commentData?.otherComments.length) {
                    contentToAnalyze = `${contentToAnalyze}\n\n【评论区观点】\n${commentData.otherComments.join('\n')}`;
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
        console.error('Failed to collect tweet:', error);
        throw error;
    }
}

function extractTweetId(tweetElement: Element): string {
    const link = tweetElement.querySelector('a[href*="/status/"]');
    if (link) {
        const match = link.getAttribute('href')?.match(/\/status\/(\d+)/);
        return match ? match[1] : generateId();
    }
    return generateId();
}

// 收集评论区内容
interface CommentData {
    authorThread: string; // 作者自己的内容（线程/回复）
    otherComments: string[]; // 其他用户的评论
}

function collectComments(mainTweetElement: Element, authorHandle: string): CommentData {
    const result: CommentData = {
        authorThread: '',
        otherComments: []
    };

    // 获取页面上所有的推文（回复）
    const allTweets = document.querySelectorAll('article[data-testid="tweet"]');
    const authorThreadParts: string[] = [];
    const otherCommentsSet = new Set<string>(); // 用 Set 去重

    allTweets.forEach((tweet) => {
        // 跳过主推文本身
        if (tweet === mainTweetElement) return;

        // 提取这条推文的作者 - 改进提取逻辑
        let tweetHandle = '';
        const userLink = tweet.querySelector('a[href^="/"][role="link"]');
        if (userLink) {
            const href = userLink.getAttribute('href') || '';
            const handleMatch = href.match(/^\/([^/]+)$/);
            if (handleMatch) {
                tweetHandle = handleMatch[1];
            }
        }
        // 备用方案：查找包含 @ 的文本
        if (!tweetHandle) {
            const tweetAuthorElement = tweet.querySelector('[data-testid="User-Name"]');
            const allSpans = tweetAuthorElement?.querySelectorAll('span') || [];
            for (const span of allSpans) {
                const text = span.textContent || '';
                if (text.startsWith('@')) {
                    tweetHandle = text.replace('@', '');
                    break;
                }
            }
        }

        // 提取推文内容
        const textElement = tweet.querySelector('[data-testid="tweetText"]');
        const content = textElement?.textContent?.trim() || '';

        if (!content) return;

        // 判断是否是原作者的内容
        if (tweetHandle && tweetHandle.toLowerCase() === authorHandle.toLowerCase()) {
            // 作者自己的线程/回复
            authorThreadParts.push(content);
        } else if (tweetHandle) {
            // 其他用户的评论（只取前 100 字，去重）
            const shortComment = content.length > 100 ? content.slice(0, 100) + '...' : content;
            const commentWithAuthor = `@${tweetHandle}: ${shortComment}`;
            otherCommentsSet.add(commentWithAuthor);
        }
    });

    result.authorThread = authorThreadParts.join('\n\n');
    result.otherComments = Array.from(otherCommentsSet).slice(0, 10); // 最多取 10 条评论

    return result;
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

// Publish tweet function
async function publishTweetToTwitter(content: string) {
    try {
        // Find compose button or text areas
        const composeButton = document.querySelector('[data-testid="SideNav_NewTweet_Button"]') as HTMLElement;

        if (composeButton) {
            composeButton.click();
            // Wait for compose box to appear
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Find the compose text area - Twitter 使用 contenteditable div
        const textArea = document.querySelector('[data-testid="tweetTextarea_0"]') as HTMLElement;

        if (!textArea) {
            throw new Error('无法找到发推文本框，请确保已打开 Twitter/X 页面');
        }

        // 方法1: 使用剪贴板 API 写入内容，然后模拟粘贴
        try {
            await navigator.clipboard.writeText(content);
            textArea.focus();
            
            // 模拟 Ctrl+V / Cmd+V 粘贴
            const pasteEvent = new KeyboardEvent('keydown', {
                key: 'v',
                code: 'KeyV',
                ctrlKey: true,
                metaKey: true,
                bubbles: true
            });
            textArea.dispatchEvent(pasteEvent);
            
            // 等待一下再检查
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 如果键盘事件没生效，尝试 ClipboardEvent
            if (!textArea.textContent || textArea.textContent.length < content.length / 2) {
                const dataTransfer = new DataTransfer();
                dataTransfer.setData('text/plain', content);
                const clipboardEvent = new ClipboardEvent('paste', {
                    clipboardData: dataTransfer,
                    bubbles: true,
                    cancelable: true
                });
                textArea.dispatchEvent(clipboardEvent);
            }
        } catch (clipboardError) {
            console.log('剪贴板方法失败，尝试其他方法:', clipboardError);
        }

        // 方法2: 如果上面方法都失败，使用 InputEvent
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!textArea.textContent || textArea.textContent.length < content.length / 2) {
            textArea.focus();
            
            // 使用 InputEvent 逐行插入
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line) {
                    const inputEvent = new InputEvent('beforeinput', {
                        inputType: 'insertText',
                        data: line,
                        bubbles: true,
                        cancelable: true
                    });
                    textArea.dispatchEvent(inputEvent);
                }
                
                // 插入换行（除了最后一行）
                if (i < lines.length - 1) {
                    const enterEvent = new InputEvent('beforeinput', {
                        inputType: 'insertParagraph',
                        bubbles: true,
                        cancelable: true
                    });
                    textArea.dispatchEvent(enterEvent);
                }
            }
        }

        // 方法3: 最后的备选方案 - 直接设置内容并触发 input 事件
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!textArea.textContent || textArea.textContent.length < content.length / 2) {
            // 找到编辑器内部的可编辑元素
            const editor = textArea.querySelector('[contenteditable="true"]') || textArea;
            
            // 将内容转换为 HTML（保留换行）
            const htmlContent = content
                .split('\n')
                .map(line => `<span data-text="true">${line || '<br>'}</span>`)
                .join('<br>');
            
            editor.innerHTML = htmlContent;
            
            // 触发 input 事件让 Twitter 知道内容变化
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        showNotification('✓ 内容已填入，请检查后点击发布');
    } catch (error) {
        console.error('Failed to publish tweet:', error);
        showNotification('✗ 发布失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
}

// Initialize
async function init() {
    console.log('Initializing 松鼠收藏夹...');
    
    // 检查悬浮按钮设置
    const settings = await storage.getSettings();
    const showButton = settings?.showFloatingButton !== false; // 默认显示
    
    createFloatingButton();
    trackCurrentTweet();
    
    // 根据设置显示/隐藏悬浮按钮
    if (floatingBtnElement && !showButton) {
        floatingBtnElement.style.display = 'none';
        console.log('悬浮按钮已根据设置隐藏');
    }
    
    console.log('松鼠收藏夹 initialized!');
}

// Wait for page to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
