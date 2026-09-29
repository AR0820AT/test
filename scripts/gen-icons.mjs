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

/* 暗红 → 黑 的渐变底色，与界面主色调一致 */
const RED_A = [150, 32, 44]
const RED_B = [12, 8, 9]
const WHITE = [255, 255, 255]
const ACCENT = [176, 40, 54]

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

function fillTriangle(px, size, ax, ay, bx, by, cx, cy, color) {
  const minX = Math.floor(Math.min(ax, bx, cx))
  const maxX = Math.ceil(Math.max(ax, bx, cx))
  const minY = Math.floor(Math.min(ay, by, cy))
  const maxY = Math.ceil(Math.max(ay, by, cy))
  const area = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
  if (area === 0) return
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const wa = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / area
      const wb = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / area
      const wc = 1 - wa - wb
      if (wa >= -0.001 && wb >= -0.001 && wc >= -0.001) paint(px, size, x, y, color)
    }
  }
}

function fillCircle(px, size, cx, cy, radius, color) {
  const left = Math.floor(cx - radius)
  const right = Math.ceil(cx + radius)
  const top = Math.floor(cy - radius)
  const bottom = Math.ceil(cy + radius)
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= radius * radius) paint(px, size, x, y, color)
    }
  }
}

/**
 * 图标内容以 192x192 为设计稿，按比例缩放到目标尺寸
 * @param {number} size 输出边长
 * @param {{ maskable?: boolean }} options
 */
function drawIcon(size, options = {}) {
  const maskable = Boolean(options.maskable)
  const px = new Uint8Array(size * size * 4)

  // 背景：左上到右下渐变；maskable 不留圆角，保证任意裁切都铺满
  const radius = maskable ? 0 : (42 / 192) * size
  fillRoundRect(px, size, 0, 0, size, size, radius, (x, y) => {
    const t = (x / size + y / size) / 2
    return [
      Math.round(RED_A[0] + (RED_B[0] - RED_A[0]) * t),
      Math.round(RED_A[1] + (RED_B[1] - RED_A[1]) * t),
      Math.round(RED_A[2] + (RED_B[2] - RED_A[2]) * t),
      255,
    ]
  })

  const scale = ((maskable ? 0.68 : 0.86) * size) / 192
  const offset = (size - 192 * scale) / 2
  const px192 = (value) => offset + value * scale

  // 白色气泡本体
  fillRoundRect(
    px,
    size,
    px192(44),
    px192(44),
    px192(148),
    px192(116),
    (18 / 192) * size,
    WHITE,
  )
  // 气泡尾巴
  fillTriangle(
    px,
    size,
    px192(62),
    px192(106),
    px192(62),
    px192(138),
    px192(94),
    px192(106),
    WHITE,
  )
  // 三个输入点
  ;[70, 96, 122].forEach((cx) => {
    fillCircle(px, size, px192(cx), px192(80), (8 / 192) * size, ACCENT)
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
