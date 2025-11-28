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
chrome.runtime.onMessage.addListener((message, sender) => {
    console.log('Message received:', message);

    if (message.type === 'OPEN_SIDE_PANEL') {
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId });
        }
    }

    return true;
});
