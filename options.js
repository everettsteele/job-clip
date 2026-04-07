var DEFAULT_PAGE_ID = '33b4cf98-04bf-816a-aef9-e9aaca9f44a1';

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(['notionToken', 'notionPageId'], function(data) {
    if (data.notionToken) document.getElementById('token').value = data.notionToken;
    if (data.notionPageId) document.getElementById('pageId').value = data.notionPageId;
  });

  document.getElementById('prefill-btn').addEventListener('click', function() {
    document.getElementById('pageId').value = DEFAULT_PAGE_ID;
  });

  document.getElementById('save').addEventListener('click', function() {
    var token = document.getElementById('token').value.trim();
    var rawId = document.getElementById('pageId').value.trim().replace(/-/g, '');
    var statusEl = document.getElementById('status');

    if (!token) {
      statusEl.textContent = 'Notion API token is required.';
      statusEl.className = 'status err';
      statusEl.style.display = 'block';
      return;
    }
    if (!rawId || rawId.length !== 32) {
      statusEl.textContent = 'Page ID must be 32 characters (dashes are fine).';
      statusEl.className = 'status err';
      statusEl.style.display = 'block';
      return;
    }

    // Normalize to UUID format
    var pageId = rawId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

    chrome.storage.sync.set({ notionToken: token, notionPageId: pageId }, function() {
      statusEl.textContent = 'Settings saved.';
      statusEl.className = 'status ok';
      statusEl.style.display = 'block';
    });
  });
});
