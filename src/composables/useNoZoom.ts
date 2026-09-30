/**
 * 禁止双指捏合缩放与手势缩放
 *
 * 注意：这里绝不能对「单指 touchstart」调用 preventDefault —— 一旦阻止，浏览器就不会再补发
 * click，快速连点同一个键（比如密码里的重复数字）时，第二次之后的点击会被整个吞掉，
 * 表现为「点了几下但只输入了一两位」。防双击放大交给 CSS 的 touch-action: manipulation
 * （base.css 的 body 上已设置，会沿祖先链对子元素生效）
 */
export function installNoZoom(): () => void {
  function onTouchStart(event: TouchEvent): void {
    // 只挡多指：捏合缩放
    if (event.touches.length > 1) event.preventDefault()
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
