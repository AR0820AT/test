/**
 * 字体兜底
 * 手机浏览器有时会丢掉 CSS 里的 @font-face，中文就退回系统默认字体了。
 * 这里再用 FontFace API 把自托管的字体注册一遍（双保险），
 * 顺便主动触发一次中文字体的下载，并提供状态查询
 */

interface Face {
  family: string
  weight: string
  file: string
}

const FACES: Face[] = [
  { family: 'Noto Serif SC', weight: '500', file: 'SourceHanSerifSC-VF.otf.woff2' },
  { family: 'Cormorant Garamond', weight: '500', file: 'cormorant-garamond-500.woff2' },
  { family: 'Pirata One', weight: '500', file: 'pirata-one-400.woff2' },
]

const ZH_SAMPLE = '中文字体'

/** 按部署路径拼字体地址（GitHub Pages 放在子目录下也能取到） */
function urlOf(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}fonts/${file}`, window.location.href).href
}

export async function ensureFonts(): Promise<void> {
  if (typeof FontFace !== 'undefined' && document.fonts) {
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
  // Safari 只会等真正用到汉字时才去下分片，这里主动拉一次，省得首屏先闪一下系统字体
  if (document.fonts?.load) {
    try {
      await document.fonts.load(`500 16px "Noto Serif SC"`, ZH_SAMPLE)
    } catch (error) {
      console.warn('[card-chat] 中文字体加载失败', error)
    }
  }
}

export type FontStatus = 'loaded' | 'loading' | 'missing'

/** 中文字体到底用上了没有：直接问 document.fonts，比猜靠谱 */
export async function chineseFontStatus(): Promise<FontStatus> {
  if (!document.fonts) return 'missing'
  await ensureFonts()
  await document.fonts.ready
  const faces = Array.from(document.fonts).filter(
    (face) => face.family.replace(/['"]/g, '') === 'Noto Serif SC',
  )
  if (!faces.length) return 'missing'
  return faces.some((face) => face.status === 'loaded') ? 'loaded' : 'loading'
}
