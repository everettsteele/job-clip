chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLIP_JOB') {
    clipJob(message.data).then(sendResponse);
    return true;
  }
});

async function clipJob(job) {
  try {
    const { notionToken, notionPageId } = await chrome.storage.sync.get(['notionToken', 'notionPageId']);

    if (!notionToken || !notionPageId) {
      return { success: false, error: 'Not configured. Open extension options.' };
    }

    const title = `${job.company} \u2014 ${job.title}`;
    const dateStr = new Date(job.clippedAt).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });

    const body = {
      parent: { page_id: notionPageId },
      properties: {
        title: { title: [{ text: { content: title } }] }
      },
      children: [
        block('callout', { rich_text: [text('Status: Queued')], icon: { emoji: '\uD83D\uDCCB' }, color: 'gray_background' }),
        block('heading_2', { rich_text: [text('Job Details')] }),
        bullet(`Company: ${job.company}`),
        bullet(`Role: ${job.title}`),
        ...(job.salary ? [bullet(`Salary: ${job.salary}`)] : []),
        {
          object: 'block', type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              text('Apply: '),
              { type: 'text', text: { content: job.url, link: { url: job.url } }, annotations: { color: 'blue', underline: true } }
            ]
          }
        },
        bullet(`Clipped: ${dateStr}`),
        block('divider', {}),
        block('heading_2', { rich_text: [text('Job Description')] }),
        block('paragraph', { rich_text: [text(job.description || 'No description captured.')] }),
        block('divider', {}),
        block('heading_2', { rich_text: [text('Application Package')] }),
        block('paragraph', { rich_text: [{ type: 'text', text: { content: 'Tailored resume and cover letter will be added here.' }, annotations: { italic: true, color: 'gray' } }] })
      ]
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.message || 'Notion API error' };
    }

    // Increment badge count
    const { clipCount = 0 } = await chrome.storage.local.get('clipCount');
    const newCount = clipCount + 1;
    await chrome.storage.local.set({ clipCount: newCount });
    chrome.action.setBadgeText({ text: String(newCount) });
    chrome.action.setBadgeBackgroundColor({ color: '#0a66c2' });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function block(type, props) {
  return { object: 'block', type, [type]: props };
}

function text(content) {
  return { type: 'text', text: { content } };
}

function bullet(content) {
  return block('bulleted_list_item', { rich_text: [text(content)] });
}
