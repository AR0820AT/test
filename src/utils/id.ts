/** 生成短 id（不需要全局唯一，碰撞概率极低且无安全诉求） */
export function uid(prefix = ''): string {
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}${time}${rand}`
}
