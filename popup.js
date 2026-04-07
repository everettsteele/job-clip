document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('clipCount', function(data) {
    document.getElementById('count').textContent = data.clipCount || 0;
  });

  chrome.storage.sync.get(['notionToken', 'notionPageId'], function(data) {
    if (!data.notionToken || !data.notionPageId) {
      document.getElementById('warning').style.display = 'block';
    }
  });

  document.getElementById('settings-btn').addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
});
