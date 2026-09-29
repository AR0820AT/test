/**
 * 把思源宋体（Noto Serif SC）按 Google Fonts 的 unicode-range 分片下载到本地
 * 一个 1.5MB 的大文件在手机上要下好几秒，切片后浏览器只下载用得到的那几片（约 100~300KB）
 *
 * 用法：node scripts/fetch-zh-font.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500&display=swap'
const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public/fonts/zh')

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
    const res = await fetch(face.url, { headers: { 'User-Agent': UA } })
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(path.join(outDir, `p${index}.woff2`), buf)
    total += buf.length
  }
}
await Promise.all(Array.from({ length: 6 }, worker))

const out = [
  '/* 自动生成，别手改：node scripts/fetch-zh-font.mjs */',
  '/* 思源宋体（Noto Serif SC）按 unicode-range 切成若干片，浏览器只下载用得到的那几片 */',
  '',
  ...faces.map(
    (face, index) =>
      `@font-face {\n  font-family: 'Noto Serif SC';\n  font-style: normal;\n  font-weight: 500;\n  font-display: swap;\n  src: url('./zh/p${index}.woff2') format('woff2');\n  unicode-range: ${face.range};\n}`,
  ),
  '',
].join('\n')

await writeFile(path.join(root, 'public/fonts/zh.css'), out)
console.log(`下载 ${faces.length} 片，共 ${(total / 1024 / 1024).toFixed(2)} MB`)
