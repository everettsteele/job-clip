# Initial Build — Job Clip Chrome Extension

Source: Notion page `33b4cf98-04bf-81e0-ad8d-f1482d521d0e`

Chrome extension that adds a "Clip Job" button to LinkedIn job listings. One click captures job title, company, salary, URL, and description, then creates a subpage in the user's Notion Application Queue.

## Stack
- Chrome Extension (Manifest V3)
- Notion API for page creation
- Content script with MutationObserver for LinkedIn SPA navigation

## Files Created
- manifest.json, background.js, content.js
- popup.html, popup.js
- options.html, options.js
- generate-icons.js + icons/
- SETUP.md, README.md
