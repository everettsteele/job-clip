chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SNAG_JOB') {
    snagJob(message.data).then(sendResponse);
    return true;
  }
});

async function snagJob(job) {
  try {
    const { trackerUrl, apiKey } = await chrome.storage.sync.get(['trackerUrl', 'apiKey']);

    if (!trackerUrl || !apiKey) {
      return { success: false, error: 'Not configured. Open extension settings.' };
    }

    const url = trackerUrl.replace(/\/+$/, '') + '/api/applications';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        company: job.company,
        role: job.role,
        source_url: job.source_url,
        notes: job.description ? 'Description: ' + job.description.substring(0, 500) : '',
        status: 'queued'
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: err.error || `HTTP ${res.status}` };
    }

    // Increment badge count
    const { snagCount = 0 } = await chrome.storage.local.get('snagCount');
    const newCount = snagCount + 1;
    await chrome.storage.local.set({ snagCount: newCount });
    chrome.action.setBadgeText({ text: String(newCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#1a1a1a' });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
