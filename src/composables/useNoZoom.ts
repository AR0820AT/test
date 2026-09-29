/**
 * 禁止双击放大与双指缩放
 * iOS Safari 会无视 viewport 里的 user-scalable=no，只能用事件兜底
 */
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_DISTANCE = 40

export function installNoZoom(): () => void {
  let lastTime = 0
  let lastX = 0
  let lastY = 0

  function onTouchStart(event: TouchEvent): void {
    // 双指：直接挡掉，避免捏合缩放
    if (event.touches.length > 1) {
      event.preventDefault()
      return
    }
    const touch = event.touches[0]
    if (!touch) return
    const now = Date.now()
    const near = Math.abs(touch.clientX - lastX) < DOUBLE_TAP_DISTANCE && Math.abs(touch.clientY - lastY) < DOUBLE_TAP_DISTANCE
    // 同一位置连续点两下：挡掉第二次，浏览器就不会放大
    if (now - lastTime < DOUBLE_TAP_MS && near) event.preventDefault()
    lastTime = now
    lastX = touch.clientX
    lastY = touch.clientY
  }

  /** iOS 的手势事件（gesturestart 等） */
  function onGesture(event: Event): void {
    event.preventDefault()
  }

  /** 按住 Ctrl 的滚轮缩放 */
  function onWheel(event: WheelEvent): void {
    if (event.ctrlKey) event.preventDefault()
  }

  /** Ctrl/Cmd + 加减号 的快捷键缩放 */
  function onKeyDown(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return
    if (['+', '-', '=', '0'].includes(event.key)) event.preventDefault()
  }

  const block = { passive: false } as AddEventListenerOptions
  document.addEventListener('touchstart', onTouchStart, block)
  document.addEventListener('gesturestart', onGesture, block)
  document.addEventListener('gesturechange', onGesture, block)
  document.addEventListener('gestureend', onGesture, block)
  window.addEventListener('wheel', onWheel, block)
  window.addEventListener('keydown', onKeyDown)

  return function uninstall(): void {
    document.removeEventListener('touchstart', onTouchStart, block)
    document.removeEventListener('gesturestart', onGesture, block)
    document.removeEventListener('gesturechange', onGesture, block)
    document.removeEventListener('gestureend', onGesture, block)
    window.removeEventListener('wheel', onWheel, block)
    window.removeEventListener('keydown', onKeyDown)
  }
}
