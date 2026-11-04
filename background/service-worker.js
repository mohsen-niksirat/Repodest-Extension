'use strict';
/* ============================================================
   Repodest for GitHub — background service worker (MV3)
   Toolbar click / Alt+R → toggle the sidebar in the active tab.
   If the content script is not injected yet (page was open
   before install), inject it via activeTab + scripting, then
   toggle. No broad host permissions required.
   ============================================================ */
const CONTENT_FILES = [
  'lib/core.js',
  'lib/i18n.js',
  'lib/api.js',
  'lib/digest.js',
  'content/sidebar.css.js',
  'content/content.js'
];

async function toggleInTab(tab) {
  if (!tab || tab.id == null) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'RP_TOGGLE' });
  } catch (e) {
    /* receiver missing → content script not injected; inject then toggle */
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: CONTENT_FILES });
      await chrome.tabs.sendMessage(tab.id, { type: 'RP_TOGGLE' });
    } catch (e2) {
      /* not a page we can touch (chrome://, web store, etc.) — ignore */
    }
  }
}

chrome.action.onClicked.addListener(toggleInTab);
