/**
 * 字体加载：用 fetch 流式下载，带字节级进度，全部就绪后再放行界面
 *
 * 中文用 Noto Serif SC（思源宋体）的静态 glyf 分片 —— iOS Safari 不认 CFF2（可变字体表），
 * 19MB 的 VF 会被它直接静默跳过、退回系统字体，所以这里统一加载这种静态分片
 */

import { ZH_SLICES } from '@/data/zhSlices'

interface Face {
  family: string
  weight: string
  file: string
  unicodeRange?: string
}

/**
 * 英文字体只覆盖拉丁字符：WebKit 若认为「前面的字体族匹配这个汉字」却发现没有字形，
 * 会直接退回系统字体，而不是继续往后找 Noto Serif SC。限定范围后，汉字只会命中中文字体
 */
const LATIN_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'

/** 中文：每片覆盖一段 unicode-range；英文正文 / 标题：单文件 + 拉丁范围 */
const FACES: Face[] = [
  ...ZH_SLICES.map((slice) => ({
    family: 'Noto Serif SC',
    weight: '500',
    file: `zh/${slice.file}`,
    unicodeRange: slice.range,
  })),
  {
    family: 'Cormorant Garamond',
    weight: '500',
    file: 'cormorant-garamond-500.woff2',
    unicodeRange: LATIN_RANGE,
  },
  {
    family: 'Pirata One',
    weight: '500',
    file: 'pirata-one-400.woff2',
    unicodeRange: LATIN_RANGE,
  },
]

const CONCURRENCY = 6

/** 按部署路径拼字体地址（GitHub Pages 放在子目录下也能取到） */
function urlOf(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}fonts/${file}`, window.location.href).href
}

/** 取字体文件大小（HEAD），拿不到就返回 0 */
async function headBytes(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return Number(res.headers.get('content-length') || 0)
  } catch {
    return 0
  }
}

/** 流式下载一个字体面，边下边回调已下载字节数；下完注册进 document.fonts */
async function fetchFace(url: string, face: Face, onBytes: (delta: number) => void): Promise<void> {
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
  const font = new FontFace(face.family, buf, {
    weight: face.weight,
    display: 'swap',
    ...(face.unicodeRange ? { unicodeRange: face.unicodeRange } : {}),
  })
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
    const urls = FACES.map((face) => urlOf(face.file))
    const sizes = await Promise.all(urls.map(headBytes))
    const total = sizes.reduce((sum, size) => sum + size, 0)
    let loaded = 0
    onProgress?.(0)

    let cursor = 0
    async function worker(): Promise<void> {
      for (;;) {
        const index = cursor++
        if (index >= FACES.length) return
        await fetchFace(urls[index], FACES[index], (delta) => {
          loaded += delta
          if (total > 0) onProgress?.(Math.min(99, Math.round((loaded / total) * 100)))
        })
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, FACES.length) }, worker))
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
