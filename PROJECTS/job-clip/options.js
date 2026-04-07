document.addEventListener('DOMContentLoaded', async () => {
  const { notionToken, notionPageId } = await chrome.storage.sync.get(['notionToken', 'notionPageId']);
  if (notionToken) document.getElementById('token').value = notionToken;
  if (notionPageId) document.getElementById('pageId').value = notionPageId;
});

document.getElementById('save').addEventListener('click', async () => {
  const token = document.getElementById('token').value.trim();
  const pageId = document.getElementById('pageId').value.trim().replace(/-/g, '');
  const statusEl = document.getElementById('status');

  if (!token || !pageId) {
    statusEl.textContent = 'Both fields are required.';
    statusEl.className = 'status err';
    statusEl.style.display = 'block';
    return;
  }

  // Normalize page ID to UUID format with dashes
  const normalized = pageId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');

  await chrome.storage.sync.set({ notionToken: token, notionPageId: normalized });

  statusEl.textContent = 'Saved.';
  statusEl.className = 'status ok';
  statusEl.style.display = 'block';
});
