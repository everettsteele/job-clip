# Snag &#x2014; Setup

## Install

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle, top right)
4. Click **Load unpacked** and select the `snag` (or `job-clip`) folder
5. Pin the Snag icon to your toolbar for easy access

No build step. No npm install. Load the folder directly.

## Configure Notion

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration** &rarr; name it **Snag** &rarr; select your workspace &rarr; **Save**
3. Copy the **Internal Integration Token** (starts with `secret_`)
4. Open the **Application Queue** page in Notion
5. Click **Share** (top right) &rarr; search **Snag** &rarr; **Invite**
6. Click the Snag icon in Chrome &rarr; **Settings**
7. Paste the token in the first field
8. Click **Use default** to auto-fill the Application Queue page ID, or paste it manually from the Notion URL
9. Click **Save Settings**

## Usage

Browse any LinkedIn job listing. A floating **&#x26A1; Snag** button appears in the bottom-right corner of your browser. Click it to send the job to your Notion Application Queue instantly.

The button shows &#x23F3; Snagging... while saving, then &#x2705; Snagged! on success. A toast confirms the company and role name.

Click the Snag icon in Chrome at any time to see your snag count and jump to the queue.

## Troubleshooting

**Button not appearing:** The extension matches all LinkedIn pages and injects on job view pages. Try refreshing. If you navigated directly to a job via a deep link, wait 1-2 seconds for the page to hydrate.

**Snag failed / Not configured:** Click the Snag icon &rarr; Settings. Verify token and page ID are saved.

**Notion returns an error:** Make sure you shared the Application Queue page with the Snag integration (Step 5 above).
