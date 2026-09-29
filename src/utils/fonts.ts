/**
 * 字体兜底
 * 有些手机浏览器会把 CSS 里的 @font-face 整条丢掉（比如不认某些写法），
 * 中文就退回系统默认字体了。这里再用 FontFace API 直接注册一遍自托管的字体，
 * 双保险；已经加载过的浏览器只是多读一次缓存，不会有额外开销
 */

interface Face {
  family: string
  weight: string
  file: string
}

const FACES: Face[] = [
  { family: 'Noto Serif SC', weight: '500', file: 'noto-serif-sc-500.woff2' },
  { family: 'Cormorant Garamond', weight: '500', file: 'cormorant-garamond-500.woff2' },
  { family: 'Pirata One', weight: '400', file: 'pirata-one-400.woff2' },
]

/** 按部署路径拼字体地址（GitHub Pages 放在子目录下也能取到） */
function urlOf(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}fonts/${file}`, window.location.href).href
}

export function ensureFonts(): void {
  if (typeof FontFace === 'undefined' || !document.fonts) return
  FACES.forEach((face) => {
    const font = new FontFace(face.family, `url("${urlOf(face.file)}")`, {
      weight: face.weight,
      display: 'swap',
    })
    font
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch((error) => console.warn('[card-chat] 字体加载失败：', face.family, error))
  })
}

/** 中文到底用上思源宋体没有：拿 canvas 量一下字宽，跟系统 serif 一样宽就是没用上 */
export function chineseFontApplied(): boolean {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return false
  const sample = '中文字体检测'
  ctx.font = '500 48px serif'
  const base = ctx.measureText(sample).width
  ctx.font = `500 48px "Noto Serif SC", serif`
  return Math.abs(ctx.measureText(sample).width - base) > 0.5
}
