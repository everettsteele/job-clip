document.addEventListener('DOMContentLoaded', async () => {
  const { clipCount = 0 } = await chrome.storage.local.get('clipCount');
  document.getElementById('count').textContent = clipCount;

  document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
