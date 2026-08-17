// =====================================================
// HireLens - Background Service Worker
// =====================================================

console.log("HireLens background service worker loaded");

// =====================================================
// INSTALL
// =====================================================

chrome.runtime.onInstalled.addListener(() => {
  console.log("HireLens installed");

  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});

// =====================================================
// TAB CHANGED
// =====================================================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Notify content script
    await chrome.tabs.sendMessage(activeInfo.tabId, {
      type: "TAB_CHANGED"
    });
  } catch (error) {
    // Internal Chrome pages may not have content scripts.
  }

  // Notify HireLens side panel
  chrome.runtime.sendMessage({
    type: "ACTIVE_TAB_CHANGED",
    tabId: activeInfo.tabId
  }).catch(() => {
    // Side panel may not currently be open.
  });
});