chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SNAG_JOB') {
    snagJob(message.data).then(sendResponse);
    return true;
  }
});

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    // LinkedIn job URLs: extract job ID from path or currentJobId param
    if (u.hostname.includes('linkedin.com')) {
      const jobId = u.searchParams.get('currentJobId');
      if (jobId) return 'linkedin-job-' + jobId;
      const viewMatch = u.pathname.match(/\/jobs\/view\/(\d+)/);
      if (viewMatch) return 'linkedin-job-' + viewMatch[1];
    }
    // Strip query params and fragments for other sites
    return u.origin + u.pathname;
  } catch (e) {
    return url;
  }
}

async function snagJob(job) {
  try {
    const { trackerUrl, apiKey } = await chrome.storage.sync.get(['trackerUrl', 'apiKey']);

    if (!trackerUrl || !apiKey) {
      return { success: false, error: 'Not configured. Open extension settings.' };
    }

    // Duplicate detection
    const normalized = normalizeUrl(job.source_url);
    const { snaggedUrls = [] } = await chrome.storage.local.get('snaggedUrls');
    if (snaggedUrls.includes(normalized)) {
      return { success: false, error: 'Already snagged.' };
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

    // Track snagged URL (keep last 500 to avoid bloat)
    snaggedUrls.push(normalized);
    if (snaggedUrls.length > 500) snaggedUrls.splice(0, snaggedUrls.length - 500);
    await chrome.storage.local.set({ snaggedUrls });

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
