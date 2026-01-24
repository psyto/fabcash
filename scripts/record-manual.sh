#!/bin/bash

# Simple Demo Recording Script
# Records simulator screen - you control the app manually

SIMULATOR_NAME="iPhone 16 Pro"
BUNDLE_ID="com.fabcash.app"
OUTPUT_DIR="./demo-videos"
VIDEO_FILE="$OUTPUT_DIR/fabcash-demo-$(date +%Y%m%d-%H%M%S).mp4"
DURATION=${1:-60}  # Default 60 seconds, or pass as argument

mkdir -p "$OUTPUT_DIR"

echo "=== Fabcash Demo Recorder ==="
echo ""
echo "Duration: ${DURATION} seconds"
echo "Output: $VIDEO_FILE"
echo ""

# Launch app
echo "Launching app..."
xcrun simctl terminate "$SIMULATOR_NAME" "$BUNDLE_ID" 2>/dev/null || true
sleep 1
xcrun simctl launch "$SIMULATOR_NAME" "$BUNDLE_ID"
sleep 2

echo ""
echo "Recording starts in 3 seconds..."
echo "Interact with the app to create your demo!"
echo ""
sleep 3

# Start recording
echo ">>> RECORDING STARTED <<<"
xcrun simctl io "$SIMULATOR_NAME" recordVideo --codec h264 "$VIDEO_FILE" &
RECORD_PID=$!

# Wait for duration
sleep $DURATION

# Stop recording
echo ""
echo ">>> RECORDING STOPPED <<<"
kill $RECORD_PID 2>/dev/null || true
wait $RECORD_PID 2>/dev/null || true

echo ""
echo "Video saved: $VIDEO_FILE"
echo ""
echo "To convert to GIF (optional):"
echo "  ffmpeg -i $VIDEO_FILE -vf 'fps=15,scale=320:-1' ${VIDEO_FILE%.mp4}.gif"
