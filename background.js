// background.js - Service Worker for Chrome V3

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'copyScholarInfo',
    title: 'Copy Scholar Info',
    contexts: ['page'],
    documentUrlPatterns: ['https://scholar.google.com/citations*']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copyScholarInfo') {
    extractAndCopy(tab.id);
  }
});

/**
 * Extract information and copy to clipboard
 * @param {number} tabId Tab ID
 */
async function extractAndCopy(tabId) {
  try {
    // Try to inject content script first (if not already injected)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      // Wait a bit for content script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (injectError) {
      // If already injected, this error can be ignored
      console.log('Content script may already exist:', injectError);
    }

    // Send message to content script to extract and copy, with retry mechanism
    let response = null;
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        response = await chrome.tabs.sendMessage(tabId, {
          action: 'extractAndCopy'
        });
        break; // Exit loop on success
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    if (response && response.success) {
      // Notify user (via badge)
      chrome.action.setBadgeText({
        text: '✓',
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabId
      });
      
      // Clear badge after 2 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({
          text: '',
          tabId: tabId
        });
      }, 2000);
    } else {
      throw new Error(lastError?.message || response?.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('Copy failed:', error);
    
    // Show error status
    chrome.action.setBadgeText({
      text: '✗',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#F44336',
      tabId: tabId
    });
    
    setTimeout(() => {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }, 2000);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pageReady') {
    // Page is ready, can perform operations
    sendResponse({ success: true });
    return true;
  }
});

