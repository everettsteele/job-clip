chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'CLIP_JOB') {
    clipJob(message.data).then(sendResponse);
    return true;
  }
});

async function clipJob(job) {
  try {
    const { notionToken, notionPageId } = await chrome.storage.sync.get(['notionToken', 'notionPageId']);

    if (!notionToken || !notionPageId) {
      return { success: false, error: 'Not configured. Open Snag settings.' };
    }

    // Deduplicate by URL — normalize to strip tracking params
    const cleanUrl = normalizeUrl(job.url);
    const { snaggedUrls = [] } = await chrome.storage.local.get('snaggedUrls');
    if (snaggedUrls.includes(cleanUrl)) {
      return { success: false, error: 'Already queued.' };
    }

    const pageTitle = job.company + ' \u2014 ' + job.title;
    const dateStr = new Date(job.clippedAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });

    const children = [
      callout('\uD83D\uDCCB Status: Queued \u2014 Awaiting package build'),
      heading2('Job Details'),
      bullet('Company: ' + job.company),
      bullet('Role: ' + job.title)
    ];

    if (job.salary) children.push(bullet('Salary: ' + job.salary));

    children.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Apply: ' } },
          { type: 'text', text: { content: job.url, link: { url: job.url } }, annotations: { color: 'blue', underline: true } }
        ]
      }
    });

    children.push(bullet('Snagged: ' + dateStr));
    children.push(divider());
    children.push(heading2('Job Description'));
    children.push(para(job.description || 'No description captured.'));
    children.push(divider());
    children.push(heading2('Application Package'));
    children.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: 'Tailored resume and cover letter will be added here.' },
          annotations: { italic: true, color: 'gray' }
        }]
      }
    });

    const body = {
      parent: { page_id: notionPageId },
      properties: {
        title: { title: [{ type: 'text', text: { content: pageTitle } }] }
      },
      children: children
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + notionToken,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || 'Notion API error ' + res.status };
    }

    // Save URL to dedupe cache
    snaggedUrls.push(cleanUrl);
    const { clipCount = 0 } = await chrome.storage.local.get('clipCount');
    const newCount = clipCount + 1;
    await chrome.storage.local.set({ clipCount: newCount, snaggedUrls });
    chrome.action.setBadgeText({ text: String(newCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#0a66c2' });

    return { success: true };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Strip LinkedIn tracking params — keep only the job ID
function normalizeUrl(url) {
  try {
    var u = new URL(url);
    // For search-results pages, the job ID is in currentJobId param
    var jobId = u.searchParams.get('currentJobId');
    if (jobId) return 'linkedin-job-' + jobId;
    // For /jobs/view/ pages, extract the ID from the path
    var viewMatch = u.pathname.match(/\/jobs\/view\/(\d+)/);
    if (viewMatch) return 'linkedin-job-' + viewMatch[1];
    // Fallback: use full URL
    return url;
  } catch (e) {
    return url;
  }
}

function heading2(content) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content } }] } };
}
function bullet(content) {
  return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content } }] } };
}
function para(content) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content } }] } };
}
function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}
function callout(content) {
  return {
    object: 'block', type: 'callout',
    callout: { rich_text: [{ type: 'text', text: { content } }], icon: { emoji: '\uD83D\uDCCB' }, color: 'gray_background' }
  };
}
