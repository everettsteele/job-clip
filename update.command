#!/bin/bash

# Snag — pull latest from GitHub
# Double-click this file to update. Then reload the extension in chrome://extensions.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_URL="https://raw.githubusercontent.com/everettsteele/job-clip/main"

FILES=("manifest.json" "content.js" "background.js" "popup.html" "popup.js" "options.html" "options.js")

echo ""
echo "⚡ Snag updater"
echo "Pulling latest files from GitHub..."
echo ""

cd "$SCRIPT_DIR"

for FILE in "${FILES[@]}"; do
  curl -s -o "$FILE" "$BASE_URL/$FILE"
  echo "  ✓ $FILE"
done

echo ""
echo "Done. Go to chrome://extensions and click the refresh icon on Snag."
echo ""
read -p "Press Enter to close..."
