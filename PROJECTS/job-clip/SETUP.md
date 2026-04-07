# Job Clip — Setup

## Install the extension

1. Clone this repo or download as a ZIP
2. Run `node generate-icons.js` once (requires `npm install canvas` first) to create icon files
3. Open Chrome and go to `chrome://extensions`
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked** and select this folder
6. The Job Clip icon appears in your Chrome toolbar

## Configure Notion

1. Go to [notion.com/my-integrations](https://notion.com/my-integrations)
2. Click **New integration**, name it "Job Clip", select your workspace, save
3. Copy the **Internal Integration Token** (starts with `secret_`)
4. Open your Application Queue page in Notion
5. Click **Share** at top right, search for "Job Clip", click **Invite**
6. Right-click the Job Clip extension icon in Chrome, choose **Options**
7. Paste the token and the Application Queue page ID (from the Notion page URL), save

## Usage

Browse any LinkedIn job listing. A **Clip Job** button appears next to the Apply button. Click it — the job title, company, salary, URL, and description are saved as a new page in your Notion Application Queue with status "Queued".

Open the extension popup to see your clip count and jump directly to the queue.
