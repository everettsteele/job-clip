document.addEventListener('DOMContentLoaded', async () => {
  const { snagCount = 0 } = await chrome.storage.local.get('snagCount');
  document.getElementById('count').textContent = snagCount;

  const { trackerUrl } = await chrome.storage.sync.get(['trackerUrl']);
  const openBtn = document.getElementById('openTracker');

  if (trackerUrl) {
    openBtn.href = trackerUrl;
  } else {
    openBtn.style.display = 'none';
    document.getElementById('notConfigured').style.display = 'block';
  }

  document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
