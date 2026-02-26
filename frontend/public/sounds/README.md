# Notification Sounds

Place your notification sound file here.

## Supported Formats
- `.mp3` (recommended for best compatibility)
- `.wav` (good quality, larger file size)
- `.ogg` (good compression, web-friendly)

## File Names
Name your files one of the following:

**For new order notifications:**
- `notification.mp3` (recommended)
- `notification.wav`
- `notification.ogg`

**For order confirmation notifications (delivery agents):**
- `confirm.mp3` (recommended)
- `confirm.wav`
- `confirm.ogg`

## Recommended Sound
- Short duration (1-3 seconds)
- Pleasant but attention-grabbing
- Not too loud or jarring
- Common notification sounds work well

## Free Sound Resources
You can find free notification sounds at:
- https://freesound.org (search for "notification" or "alert")
- https://mixkit.co/free-sound-effects/notification/
- https://notificationsounds.com/

## Examples
If you have sound files, place them in this directory:
```
frontend/public/sounds/notification.mp3  (for new orders)
frontend/public/sounds/confirm.mp3      (for order confirmations)
```

The system will automatically detect and play:
- `notification.mp3` when new orders arrive (admin notifications)
- `confirm.mp3` when orders are confirmed by confirmatrice (delivery agent notifications)
