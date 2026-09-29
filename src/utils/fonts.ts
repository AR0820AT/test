/**
 * 中文字体兜底
 * 思源宋体走的是外网 CDN 的分片字体，手机（尤其移动网络）经常只加载出英文那一半，
 * 中文就退回系统默认字体。这里检测一下：没加载出来就换备用 CDN 再拉一次。
 */

const SAMPLE = '中文字体检测'
const FAMILY = '"Noto Serif SC"'
const SPEC = `500 16px ${FAMILY}`

/** 备用源：主源（jsDelivr）没成功时依次尝试 */
const FALLBACKS = [
  'https://npm.elemecdn.com/@fontsource/noto-serif-sc/500.css',
  'https://fastly.jsdelivr.net/npm/@fontsource/noto-serif-sc/500.css',
  'https://unpkg.com/@fontsource/noto-serif-sc/500.css',
]

function inject(href: string): Promise<void> {
  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    // 成功失败都往下走，换个源再试就行
    link.onload = () => resolve()
    link.onerror = () => resolve()
    document.head.appendChild(link)
  })
}

async function chineseReady(): Promise<boolean> {
  if (!document.fonts) return false
  try {
    await document.fonts.load(SPEC, SAMPLE)
    return document.fonts.check(SPEC, SAMPLE)
  } catch {
    return false
  }
}

async function run(): Promise<void> {
  if (await chineseReady()) return
  for (const href of FALLBACKS) {
    await inject(href)
    if (await chineseReady()) return
  }
  // 全都失败：交给 CSS 的回落链（系统宋体），并打个标记方便排查
  document.documentElement.dataset.zhFont = 'fallback'
}

/** 页面加载完成后再检测，避免主样式表还没生效就误判 */
export function ensureChineseFont(): void {
  const start = (): void => {
    window.setTimeout(() => void run(), 1200)
  }
  if (document.readyState === 'complete') start()
  else window.addEventListener('load', start, { once: true })
}
