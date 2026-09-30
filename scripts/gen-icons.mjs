/**
 * 生成 PWA 需要的 PNG 图标（不依赖任何第三方库）
 * 用法：npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')

/* ---------------- PNG 编码 ---------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let c = -1
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const stride = size * 4 + 1
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * stride
    raw[rowStart] = 0
    for (let i = 0; i < size * 4; i += 1) raw[rowStart + 1 + i] = rgba[y * size * 4 + i]
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // 位深
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------------- 绘制 ---------------- */

/* 纯渐变底色：左上白 → 右下蓝（vivid 蓝 #2f6fd0），中间加一档浅蓝让过渡更匀 */
const GRADIENT = [
  { at: 0, color: [255, 255, 255] },
  { at: 0.55, color: [175, 206, 244] },
  { at: 1, color: [47, 111, 208] },
]

/** 按位置取渐变色 */
function gradientAt(t) {
  const clamped = Math.min(Math.max(t, 0), 1)
  for (let i = 1; i < GRADIENT.length; i += 1) {
    const prev = GRADIENT[i - 1]
    const next = GRADIENT[i]
    if (clamped <= next.at) {
      const ratio = (clamped - prev.at) / (next.at - prev.at)
      return prev.color.map((from, c) => Math.round(from + (next.color[c] - from) * ratio))
    }
  }
  return GRADIENT[GRADIENT.length - 1].color
}

function paint(px, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  const [r, g, b, a = 255] = color
  const sa = a / 255
  const da = px[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa === 0) return
  px[i] = Math.round((r * sa + px[i] * da * (1 - sa)) / oa)
  px[i + 1] = Math.round((g * sa + px[i + 1] * da * (1 - sa)) / oa)
  px[i + 2] = Math.round((b * sa + px[i + 2] * da * (1 - sa)) / oa)
  px[i + 3] = Math.round(oa * 255)
}

function fillRoundRect(px, size, x0, y0, x1, y1, radius, colorAt) {
  const left = Math.round(x0)
  const top = Math.round(y0)
  const right = Math.round(x1)
  const bottom = Math.round(y1)
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const cx = Math.min(Math.max(x, left + radius), right - 1 - radius)
      const cy = Math.min(Math.max(y, top + radius), bottom - 1 - radius)
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) {
        paint(px, size, x, y, typeof colorAt === 'function' ? colorAt(x, y) : colorAt)
      }
    }
  }
}

/**
 * 画整张图标：从左上角到右下角的渐变铺满整块，不带任何图案
 * @param {number} size 输出边长
 * @param {{ maskable?: boolean }} options
 */
function drawIcon(size, options = {}) {
  const maskable = Boolean(options.maskable)
  const px = new Uint8Array(size * size * 4)

  // 只有背景：左上白 → 右下蓝；maskable 不留圆角，保证任意裁切都铺满
  const radius = maskable ? 0 : (42 / 192) * size
  fillRoundRect(px, size, 0, 0, size, size, radius, (x, y) => {
    const t = (x / size + y / size) / 2
    return [...gradientAt(t), 255]
  })

  return px
}

/* ---------------- 输出 ---------------- */

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
]

for (const target of targets) {
  const pixels = drawIcon(target.size, { maskable: target.maskable })
  writeFileSync(resolve(OUT_DIR, target.name), encodePng(target.size, pixels))
  console.log(`[icons] ${target.name} (${target.size}x${target.size})`)
}
