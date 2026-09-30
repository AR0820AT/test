/**
 * 字体加载：用 fetch 流式下载，带字节级进度，全部就绪后再放行界面
 * 中文字体是静态子集（约 2MB）。iOS Safari 对超大 / 可变字体文件支持不稳，统一走这里加载，
 * 不再放在 CSS 里 —— 这样下载进度可控，也不会出现「CSS 字体被浏览器静默跳过」的情况
 */

interface Face {
  family: string
  weight: string
  file: string
}

const FACES: Face[] = [
  { family: 'Noto Serif SC', weight: '500', file: 'SourceHanSerifSC-500.woff2' },
  { family: 'Cormorant Garamond', weight: '500', file: 'cormorant-garamond-500.woff2' },
  { family: 'Pirata One', weight: '500', file: 'pirata-one-400.woff2' },
]

/** 按部署路径拼字体地址（GitHub Pages 放在子目录下也能取到） */
function urlOf(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}fonts/${file}`, window.location.href).href
}

/** 取字体文件大小（HEAD），拿不到就返回 0，进度条退化为不确定 */
async function headBytes(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return Number(res.headers.get('content-length') || 0)
  } catch {
    return 0
  }
}

/** 流式下载一个字体文件，边下边回调已下载字节数；下完注册进 document.fonts */
async function fetchFont(face: Face, onBytes: (delta: number) => void): Promise<void> {
  const url = urlOf(face.file)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`字体下载失败：${face.file} (${res.status})`)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      received += value.length
      onBytes(value.length)
    }
  }
  const buf = new Uint8Array(received)
  let pos = 0
  for (const chunk of chunks) {
    buf.set(chunk, pos)
    pos += chunk.length
  }
  const font = new FontFace(face.family, buf, { weight: face.weight, display: 'swap' })
  await font.load()
  document.fonts.add(font)
}

/** 加载全部字体，可选地回报进度（0–100）。失败会在返回的 Promise 上 reject，由调用方兜底 */
export function loadFonts(onProgress?: (pct: number) => void): Promise<void> {
  if (typeof FontFace === 'undefined' || !document.fonts) {
    onProgress?.(100)
    return Promise.resolve()
  }
  return (async () => {
    const sizes = await Promise.all(FACES.map((face) => headBytes(urlOf(face.file))))
    const total = sizes.reduce((sum, size) => sum + size, 0)
    let loaded = 0
    onProgress?.(0)
    await Promise.all(
      FACES.map((face) =>
        fetchFont(face, (delta: number) => {
          loaded += delta
          if (total > 0) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)))
        }),
      ),
    )
    onProgress?.(100)
  })()
}

export type FontStatus = 'loaded' | 'loading' | 'missing'

/** 中文字体到底用上了没有：直接问 document.fonts */
export async function chineseFontStatus(): Promise<FontStatus> {
  if (!document.fonts) return 'missing'
  await document.fonts.ready
  const faces = Array.from(document.fonts).filter(
    (face) => face.family.replace(/['"]/g, '') === 'Noto Serif SC',
  )
  if (!faces.length) return 'missing'
  return faces.some((face) => face.status === 'loaded') ? 'loaded' : 'loading'
}
