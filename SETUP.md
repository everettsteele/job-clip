# Job Clip — Setup

## Install the Extension

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `job-clip` folder
6. Job Clip appears in your Chrome toolbar (pin it for easy access)

No build step. No npm install. Load the folder directly.

## Configure Notion

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **New integration** → name it **Job Clip** → select your workspace → **Save**
3. Copy the **Internal Integration Token** (starts with `secret_`)
4. Open the **Application Queue** page in Notion
5. Click **Share** (top right) → search **Job Clip** → **Invite**
6. Click the Job Clip icon in Chrome → **Settings**
7. Paste the token in the first field
8. Click **Use default** to auto-fill the Application Queue page ID (or paste it manually from the Notion URL)
9. Click **Save**

## Usage

Browse any LinkedIn job listing. A **Clip Job** button appears next to the Apply button. Click it. The job details are saved instantly as a new page in your Notion Application Queue with status Queued.

Click the extension icon at any time to see your clip count and jump directly to the queue.

## Troubleshooting

**Button not appearing:** LinkedIn occasionally changes their DOM. Try refreshing the page. If it persists, open an issue.

**Clip failed / Not configured:** Click the extension icon, go to Settings, verify your Notion token and page ID are saved.

**Notion returns an error:** Make sure you've shared the Application Queue page with the Job Clip integration (Step 5 above).
