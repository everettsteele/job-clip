document.addEventListener('DOMContentLoaded', async () => {
  const { trackerUrl, apiKey } = await chrome.storage.sync.get(['trackerUrl', 'apiKey']);
  if (trackerUrl) document.getElementById('trackerUrl').value = trackerUrl;
  if (apiKey) document.getElementById('apiKey').value = apiKey;
});

document.getElementById('save').addEventListener('click', async () => {
  const trackerUrl = document.getElementById('trackerUrl').value.trim().replace(/\/+$/, '');
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusEl = document.getElementById('status');

  if (!trackerUrl || !apiKey) {
    statusEl.textContent = 'Both fields are required.';
    statusEl.className = 'status err';
    statusEl.style.display = 'block';
    return;
  }

  await chrome.storage.sync.set({ trackerUrl, apiKey });

  statusEl.textContent = 'Saved.';
  statusEl.className = 'status ok';
  statusEl.style.display = 'block';
});

document.getElementById('test').addEventListener('click', async () => {
  const trackerUrl = document.getElementById('trackerUrl').value.trim().replace(/\/+$/, '');
  const apiKey = document.getElementById('apiKey').value.trim();
  const statusEl = document.getElementById('status');

  if (!trackerUrl || !apiKey) {
    statusEl.textContent = 'Fill in both fields first.';
    statusEl.className = 'status err';
    statusEl.style.display = 'block';
    return;
  }

  statusEl.textContent = 'Testing...';
  statusEl.className = 'status';
  statusEl.style.display = 'block';

  try {
    const res = await fetch(trackerUrl + '/api/applications', {
      headers: { 'x-api-key': apiKey }
    });
    if (res.ok) {
      statusEl.textContent = 'Connected successfully.';
      statusEl.className = 'status ok';
    } else if (res.status === 401) {
      statusEl.textContent = 'Authentication failed. Check your API key.';
      statusEl.className = 'status err';
    } else {
      statusEl.textContent = 'Server responded with HTTP ' + res.status;
      statusEl.className = 'status err';
    }
  } catch (e) {
    statusEl.textContent = 'Connection failed: ' + e.message;
    statusEl.className = 'status err';
  }
  statusEl.style.display = 'block';
});
