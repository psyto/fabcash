#!/bin/bash

# Demo Video Recording Script for Fabcash
# Records iOS Simulator screen with AppleScript-based UI automation
# No external dependencies required

set -e

# Configuration
SIMULATOR_NAME="iPhone 16 Pro"
BUNDLE_ID="com.fabcash.app"
OUTPUT_DIR="./demo-videos"
VIDEO_FILE="$OUTPUT_DIR/fabcash-demo-$(date +%Y%m%d-%H%M%S).mp4"

# Helper functions
log() {
  echo "[$(date +%H:%M:%S)] $1"
}

# Click at position relative to Simulator window using AppleScript
click() {
  local x=$1
  local y=$2
  local desc=$3
  log "Click: $desc ($x, $y)"
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.3
    tell application "System Events"
      tell process "Simulator"
        set frontWin to window 1
        set {winX, winY} to position of frontWin
        set {winW, winH} to size of frontWin
        -- Calculate click position (window position + offset + toolbar ~50px)
        set clickX to winX + $x
        set clickY to winY + $y + 50
      end tell
      -- Move mouse and click
      do shell script "osascript -e 'tell application \"System Events\" to click at {" & clickX & ", " & clickY & "}'"
    end tell
EOF
  sleep 0.5
}

# Alternative click using mouse position
click_at() {
  local x=$1
  local y=$2
  local desc=$3
  log "Click: $desc"

  # Get simulator window position and click
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.2
    tell application "System Events"
      tell process "Simulator"
        set frontWin to window 1
        set {wx, wy} to position of frontWin
        -- Account for window chrome (~50px toolbar)
        set targetX to wx + $x
        set targetY to wy + $y + 50
      end tell
      -- Use mouse click action
      click at {targetX, targetY}
    end tell
EOF
  sleep 0.6
}

# Swipe down gesture
swipe_down() {
  log "Swipe down (pull to refresh)"
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.2
    tell application "System Events"
      tell process "Simulator"
        set frontWin to window 1
        set {wx, wy} to position of frontWin
        set startX to wx + 196
        set startY to wy + 200 + 50
        set endY to wy + 500 + 50
      end tell
      -- Drag gesture
      click at {startX, startY}
      delay 0.1
      key down shift
      click at {startX, endY}
      key up shift
    end tell
EOF
  sleep 1.5
}

# Type text into focused field
type_text() {
  local text=$1
  local desc=$2
  log "Type: $desc"
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.2
    tell application "System Events"
      keystroke "$text"
    end tell
EOF
  sleep 0.5
}

wait_sec() {
  local sec=$1
  log "Waiting ${sec}s..."
  sleep $sec
}

# Scroll up gesture (swipe from bottom to top to reveal content at bottom)
scroll_up() {
  log "Scroll up"
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.2
    tell application "System Events"
      tell process "Simulator"
        set frontWin to window 1
        set {wx, wy} to position of frontWin
        set startX to wx + 196
        set startY to wy + 600 + 50
        set endY to wy + 300 + 50
      end tell
      -- Drag from bottom to top
      click at {startX, startY}
      delay 0.1
      key down shift
      click at {startX, endY}
      key up shift
    end tell
EOF
  sleep 1
}

# Scroll down gesture (swipe from top to bottom area to scroll content down)
scroll_down() {
  log "Scroll down to reveal bottom content"
  osascript <<EOF
    tell application "Simulator" to activate
    delay 0.2
    tell application "System Events"
      tell process "Simulator"
        set frontWin to window 1
        set {wx, wy} to position of frontWin
        set startX to wx + 196
        set startY to wy + 400 + 50
        set endY to wy + 200 + 50
      end tell
      -- Drag from middle to top (scrolls content up, reveals bottom)
      click at {startX, startY}
      delay 0.1
      key down shift
      click at {startX, endY}
      key up shift
    end tell
EOF
  sleep 1
}

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Check if simulator is booted
if ! xcrun simctl list devices | grep -q "$SIMULATOR_NAME.*Booted"; then
  log "Booting simulator: $SIMULATOR_NAME"
  xcrun simctl boot "$SIMULATOR_NAME" 2>/dev/null || true
  sleep 3
fi

# Bring Simulator to front
open -a Simulator
sleep 2

# Launch the app
log "Launching Fabcash app..."
xcrun simctl terminate "$SIMULATOR_NAME" "$BUNDLE_ID" 2>/dev/null || true
sleep 1
xcrun simctl launch "$SIMULATOR_NAME" "$BUNDLE_ID"
sleep 3

# Start recording
log "Starting video recording: $VIDEO_FILE"
xcrun simctl io "$SIMULATOR_NAME" recordVideo --codec h264 "$VIDEO_FILE" &
RECORD_PID=$!
sleep 1

# Trap to stop recording on script exit
cleanup() {
  log "Stopping recording..."
  kill -INT $RECORD_PID 2>/dev/null || true
  sleep 2
  wait $RECORD_PID 2>/dev/null || true
  log "Video saved: $VIDEO_FILE"
}
trap cleanup EXIT INT TERM

# ============================================
# DEMO SCRIPT - Automated UI Flow
# Coordinates are relative to simulator window content
# ============================================

log "=== Starting Demo Flow ==="

# Scene 1: Home Screen Overview
wait_sec 2
log "Scene 1: Home screen with balances"
wait_sec 3

# Tap address to copy
click_at 196 140 "Copy address"
wait_sec 2

# Scene 2: Shield SOL
log "Scene 2: Shield SOL flow"
click_at 196 400 "Shield SOL button"
wait_sec 2

# Confirm shield (tap confirm button in modal)
click_at 250 540 "Confirm shield"
wait_sec 2

# Scene 3: Send Flow - tap Send tab at bottom
log "Scene 3: Send payment flow"
click_at 196 810 "Send tab"
wait_sec 2

# First enter recipient (required for validation)
click_at 150 130 "Recipient input"
wait_sec 0.5
type_text "11111111111111111111111111111111" "System Program address"
wait_sec 0.5

# Dismiss keyboard by tapping Return key
log "Dismissing keyboard"
osascript -e 'tell application "System Events" to key code 36'
wait_sec 0.8

# Tap amount input field (below recipient, around y=280)
log "Entering amount"
click_at 100 280 "Amount input"
wait_sec 0.8

# Type amount character by character for reliability
log "Typing 0.01"
osascript <<EOF
tell application "Simulator" to activate
delay 0.2
tell application "System Events"
  keystroke "0"
  delay 0.15
  keystroke "."
  delay 0.15
  keystroke "0"
  delay 0.15
  keystroke "1"
end tell
EOF
wait_sec 0.8

# Dismiss keyboard
osascript -e 'tell application "System Events" to key code 36'
wait_sec 0.8

# Select Shielded privacy mode (3rd of 4 buttons in row)
# User suggested y=520 for privacy mode
log "Selecting privacy mode (Shielded)"
click_at 310 520 "Shielded mode"
wait_sec 2

# Click Continue button - try y=650
log "Clicking Continue"
click_at 196 650 "Continue button"
wait_sec 3

# Show confirmation screen
log "Scene 3b: Payment confirmation page"
wait_sec 3

# Go back to Home tab
click_at 65 810 "Home tab"
wait_sec 2

# Scene 4: Receive Flow - tap Receive tab at bottom
log "Scene 4: Receive payment flow"
click_at 328 810 "Receive tab"
wait_sec 2

# Tap address card to copy (y=450)
click_at 196 450 "Tap to copy address"
wait_sec 2

# Show QR code screen
log "Scene 4b: QR code displayed"
wait_sec 3

# Tap address to copy
click_at 196 480 "Copy address"
wait_sec 1

# Go back to Home tab
click_at 65 810 "Home tab"
wait_sec 2

# Final home screen shot
log "Scene 5: Final home screen"
wait_sec 3

log "=== Demo Flow Complete ==="
