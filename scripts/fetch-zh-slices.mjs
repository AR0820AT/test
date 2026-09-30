/**
 * 把 Noto Serif SC（= 思源宋体）500 字重的静态实例分片下载到本地
 * iOS Safari 不认 CFF2（可变字体表），只吃得下这种静态 CFF 分片，所以不能用 VF 那版
 *
 * 用法：node scripts/fetch-zh-slices.mjs
 * 产出：public/fonts/zh/pN.woff2 + src/data/zhSlices.ts（给启动时按顺序加载用）
 */
import { existsSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500&display=swap'
const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public/fonts/zh')
const manifest = path.join(root, 'src/data/zhSlices.ts')

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text()
const blocks = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
if (!blocks.length) throw new Error('没解析到 @font-face，Google Fonts 返回格式可能变了')

const faces = blocks.map((block) => {
  const url = block.match(/url\((https:\/\/[^)]+)\)/)?.[1]
  const range = block.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim()
  if (!url || !range) throw new Error('解析 @font-face 失败：' + block.slice(0, 120))
  return { url, range }
})

await mkdir(outDir, { recursive: true })

let total = 0
const queue = [...faces.entries()]
async function worker() {
  for (;;) {
    const next = queue.shift()
    if (!next) return
    const [index, face] = next
    const file = path.join(outDir, `p${index}.woff2`)
    if (existsSync(file)) {
      total += statSync(file).size
      continue
    }
    const res = await fetch(face.url, { headers: { 'User-Agent': UA } })
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(file, buf)
    total += buf.length
  }
}
await Promise.all(Array.from({ length: 6 }, worker))

const list = faces.map((face, index) => ({ file: `p${index}.woff2`, range: face.range }))
const out = [
  '// 自动生成：node scripts/fetch-zh-slices.mjs',
  '// Noto Serif SC（思源宋体）500 字重的静态 CFF 分片，iOS Safari 只认这种（不认 CFF2 可变表）',
  '',
  'export interface FontSlice {',
  '  file: string',
  '  range: string',
  '}',
  '',
  `export const ZH_SLICES: FontSlice[] = ${JSON.stringify(list, null, 2)}`,
  '',
].join('\n')

await writeFile(manifest, out)
console.log(`下载 ${faces.length} 片，共 ${(total / 1024 / 1024).toFixed(2)} MB`)
