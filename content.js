// content.js - Extract information from Google Scholar pages

// Debug: Confirm content script is loaded
console.log('[Log this scholar] Content script loaded on:', window.location.href);

/**
 * Extract scholar information
 * @returns {Object} Object containing name, affiliation, cited_by, canonical, homepage, topics
 */
function extractScholarInfo() {
  const result = {
    name: '',
    affiliation: '',
    cited_by: '',
    canonical: '',
    homepage: '',
    topics: '',
    tags: '',
    memo: ''
  };

  console.log('[Log this scholar] Starting extraction...');

  try {
    // 1. Extract name
    // Priority: #gsc_prf_in → meta[og:title] → document.title (remove suffix)
    const nameElement = document.querySelector('#gsc_prf_in');
    if (nameElement) {
      result.name = nameElement.textContent.trim();
      console.log('[Log this scholar] Name found:', result.name);
    } else {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        result.name = ogTitle.getAttribute('content') || '';
        console.log('[Log this scholar] Name from og:title:', result.name);
      } else {
        // Extract from document.title, remove trailing " - Google Scholar"
        const title = document.title;
        const match = title.match(/^(.+?)\s*-\s*Google Scholar/);
        if (match) {
          result.name = match[1].trim();
        } else {
          result.name = title.trim();
        }
        console.log('[Log this scholar] Name from title:', result.name);
      }
    }

    // 2. Extract affiliation
    // #gsc_prf_i .gsc_prf_il (first)
    const affiliationElement = document.querySelector('#gsc_prf_i .gsc_prf_il');
    if (affiliationElement) {
      result.affiliation = affiliationElement.textContent.trim();
      console.log('[Log this scholar] Affiliation found:', result.affiliation);
    } else {
      console.log('[Log this scholar] Affiliation not found');
    }

    // 3. Extract total citations
    // Table: #gsc_rsb_st tbody tr with '.gsc_rsb_sc1' containing "Citations" (case-insensitive)
    // Read first item of '.gsc_rsb_std' column array (ALL)
    const citationsTable = document.querySelector('#gsc_rsb_st tbody');
    if (citationsTable) {
      const rows = citationsTable.querySelectorAll('tr');
      console.log('[Log this scholar] Found citations table with', rows.length, 'rows');
      for (const row of rows) {
        const labelCell = row.querySelector('.gsc_rsb_sc1');
        if (labelCell) {
          const labelText = labelCell.textContent.trim();
          // Case-insensitive match "Citations"
          if (labelText && /citations/i.test(labelText)) {
            const stdCells = row.querySelectorAll('.gsc_rsb_std');
            if (stdCells.length > 0) {
              // Take first item (ALL column)
              result.cited_by = stdCells[0].textContent.trim();
              console.log('[Log this scholar] Cited_by found:', result.cited_by);
              break;
            }
          }
        }
      }
    } else {
      console.log('[Log this scholar] Citations table not found');
    }
    
    // Fallback: regex in meta[name="description"] /cited by\s+([\d,]+)/i or extract consecutive numbers in any language
    if (!result.cited_by) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        const desc = metaDesc.getAttribute('content') || '';
        // Prioritize matching "cited by" pattern (case-insensitive)
        let match = desc.match(/cited\s+by\s+([\d,]+)/i);
        if (!match) {
          // Try matching similar patterns in other languages, or extract numbers directly
          match = desc.match(/([\d,]+)\s*citations?/i) ||
                  desc.match(/被引[：:]\s*([\d,]+)/i) ||
                  desc.match(/([\d,]+)/);
        }
        if (match) {
          result.cited_by = match[1].trim();
          console.log('[Log this scholar] Cited_by from meta:', result.cited_by);
        }
      }
    }

    // 4. Extract canonical URL
    // link[rel=canonical]
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      result.canonical = canonicalLink.getAttribute('href') || '';
      console.log('[Log this scholar] Canonical found:', result.canonical);
    }

    // 5. Extract homepage link
    // #gsc_prf_i a.gsc_prf_ila[href] collection → prioritize matching "Homepage" by text/aria → otherwise first
    const homepageLinks = document.querySelectorAll('#gsc_prf_i a.gsc_prf_ila[href]');
    console.log('[Log this scholar] Found', homepageLinks.length, 'homepage links');
    if (homepageLinks.length > 0) {
      let foundHomepage = false;
      // Prioritize matching links containing "Homepage"
      for (const link of homepageLinks) {
        const text = link.textContent.trim().toLowerCase();
        const ariaLabel = link.getAttribute('aria-label') || '';
        const href = link.getAttribute('href') || '';
        
        // Check if text or aria-label contains homepage-related keywords
        if (text.includes('homepage') || 
            ariaLabel.toLowerCase().includes('homepage')) {
          result.homepage = href;
          foundHomepage = true;
          console.log('[Log this scholar] Homepage found:', result.homepage);
          break;
        }
      }
      // If no match found, use the first one
      if (!foundHomepage && homepageLinks.length > 0) {
        result.homepage = homepageLinks[0].getAttribute('href') || '';
        console.log('[Log this scholar] Homepage (first link):', result.homepage);
      }
    }

    // 6. Extract research topics
    // #gsc_prf_int a.gsc_prf_inta text array, join with |
    const topicsElements = document.querySelectorAll('#gsc_prf_int a.gsc_prf_inta');
    console.log('[Log this scholar] Found', topicsElements.length, 'topics');
    const topics = [];
    if (topicsElements.length > 0) {
      topicsElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) {
          topics.push(text);
        }
      });
    }
    result.topics = topics.join('|');
    console.log('[Log this scholar] Topics:', result.topics);

    console.log('[Log this scholar] Extraction completed:', result);
  } catch (error) {
    console.error('[Log this scholar] Error extracting information:', error);
    // Graceful degradation: return empty strings but maintain format
  }

  return result;
}

/**
 * Escape CSV field (handle commas, quotes, and newlines)
 * @param {string} field Field value to escape
 * @returns {string} Escaped field value
 */
function escapeCSVField(field) {
  if (!field) return '';
  
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Format output as comma-separated single line text
 * @param {Object} info Extracted information object
 * @returns {string} Formatted text
 */
function formatOutput(info) {
  return [
    info.name || '',
    info.affiliation || '',
    info.cited_by || '',
    info.canonical || '',
    info.homepage || '',
    info.topics || '',
    info.tags || '',
    escapeCSVField(info.memo || '')
  ].join(',');
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Log this scholar] Received message:', request.action);
  
  if (request.action === 'extractScholarInfo') {
    try {
      const info = extractScholarInfo();
      const output = formatOutput(info);
      console.log('[Log this scholar] Sending response:', { success: true, data: output });
      sendResponse({ success: true, data: output, info: info });
    } catch (error) {
      console.error('[Log this scholar] Error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'extractAndCopy') {
    // Extract and copy to clipboard
    console.log('[Log this scholar] extractAndCopy requested');
    try {
      const info = extractScholarInfo();
      const output = formatOutput(info);
      console.log('[Log this scholar] Extracted data:', output);
      
      // Copy to clipboard
      navigator.clipboard.writeText(output).then(() => {
        console.log('[Log this scholar] Copied to clipboard successfully');
        sendResponse({ success: true, data: output });
      }).catch((error) => {
        console.error('[Log this scholar] Clipboard API failed, using fallback:', error);
        // Fallback: use document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = output;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          console.log('[Log this scholar] Copied using execCommand');
          sendResponse({ success: true, data: output });
        } catch (e) {
          document.body.removeChild(textArea);
          console.error('[Log this scholar] Copy failed:', e);
          sendResponse({ success: false, error: 'Copy failed: ' + e.message });
        }
      });
    } catch (error) {
      console.error('[Log this scholar] Extraction error:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open for async response
  }
  
  return false;
});

// Notify background script when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Log this scholar] DOMContentLoaded, sending pageReady');
    chrome.runtime.sendMessage({ action: 'pageReady' }).catch(() => {
      // Ignore error, background may not be ready yet
    });
  });
} else {
  console.log('[Log this scholar] Page already loaded, sending pageReady');
  chrome.runtime.sendMessage({ action: 'pageReady' }).catch(() => {
    // Ignore error, background may not be ready yet
  });
}
