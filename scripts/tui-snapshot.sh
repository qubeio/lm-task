#!/bin/bash

# tui-snapshot.sh
# Programmatic TUI snapshot tool using tmux + ImageMagick
# Usage: ./tui-snapshot.sh "command" [output-file] [wait-seconds]

set -e

# Parse arguments
TUI_COMMAND="${1:-task-master ui}"
OUTPUT_FILE="${2:-tui-snapshot.png}"
WAIT_SECONDS="${3:-10}"
SESSION_NAME="tui_snap_$$"  # Use PID to avoid conflicts

echo "📸 Capturing TUI snapshot..."
echo "Command: $TUI_COMMAND"
echo "Output: $OUTPUT_FILE"
echo "Wait time: ${WAIT_SECONDS}s"

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up tmux session..."
    tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
    rm -f /tmp/tmux-capture-$$.txt 2>/dev/null || true
}
trap cleanup EXIT

# Check dependencies
if ! command -v tmux &> /dev/null; then
    echo "❌ Error: tmux is required but not installed"
    echo "Install with: brew install tmux"
    exit 1
fi

# Start tmux session in detached mode
echo "🚀 Starting tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -x 120 -y 30

# Send the TUI command to the session
echo "⚡ Running command: $TUI_COMMAND"
tmux send-keys -t "$SESSION_NAME" "$TUI_COMMAND" C-m

# Wait for TUI to load and stabilize
echo "⏳ Waiting ${WAIT_SECONDS}s for TUI to load..."
sleep "$WAIT_SECONDS"

# Capture the tmux pane content to a text file
echo "📷 Capturing tmux pane content..."
TEMP_FILE="/tmp/tmux-capture-$$.txt"
tmux capture-pane -t "$SESSION_NAME" -p > "$TEMP_FILE"

# Create an HTML file with the terminal content
HTML_FILE="/tmp/tmux-snapshot-$$.html"
cat > "$HTML_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background-color: #1e1e1e;
            color: #ffffff;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.2;
        }
        pre {
            white-space: pre;
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <pre>$(cat "$TEMP_FILE" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g')</pre>
</body>
</html>
EOF

# Convert HTML to PNG using different methods based on available tools
if command -v wkhtmltoimage &> /dev/null; then
    echo "🖼️  Converting to PNG using wkhtmltoimage..."
    wkhtmltoimage --width 1200 --height 800 "$HTML_FILE" "$OUTPUT_FILE"
elif command -v magick &> /dev/null; then
    echo "🖼️  Converting to PNG using ImageMagick..."
    # Create a simple text image
    magick -background black -fill white -font Monaco -pointsize 12 \
            -size 1200x800 caption:"$(cat "$TEMP_FILE")" "$OUTPUT_FILE"
elif command -v convert &> /dev/null; then
    echo "🖼️  Converting to PNG using ImageMagick (legacy)..."
    # Create a simple text image
    convert -background black -fill white -font Monaco -pointsize 12 \
            -size 1200x800 caption:"$(cat "$TEMP_FILE")" "$OUTPUT_FILE"
else
    echo "⚠️  No image conversion tool found. Saving as text file instead."
    cp "$TEMP_FILE" "${OUTPUT_FILE%.png}.txt"
    echo "📄 Text output saved: ${OUTPUT_FILE%.png}.txt"
    echo "💡 To convert to image, install: brew install imagemagick"
    cleanup
    exit 0
fi

# Clean up temp files
rm -f "$HTML_FILE" "$TEMP_FILE"

# Verify the screenshot was created
if [[ -f "$OUTPUT_FILE" ]]; then
    echo "✅ Screenshot saved: $OUTPUT_FILE"
    echo "📏 File size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
else
    echo "❌ Failed to create screenshot"
    exit 1
fi

echo "🎉 TUI snapshot complete!" 