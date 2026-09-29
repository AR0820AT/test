/**
 * 图片处理：把用户选择的图片压缩后再入库
 * 目的：手机照片动辄 3~5MB，直接塞进索引数据库很快撑爆配额
 */

interface BitmapLike {
  width: number
  height: number
  close?: () => void
}

async function loadBitmap(file: File): Promise<BitmapLike> {
  if (typeof createImageBitmap === 'function') {
    try {
      // from-image：按 EXIF 自动旋转，避免手机竖拍照片躺倒
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* 部分浏览器不支持该选项，走下面的兜底 */
    }
  }
  return new Promise<BitmapLike>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const tryEncode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

  return (async () => {
    const webp = await tryEncode('image/webp')
    if (webp) return webp
    const jpeg = await tryEncode('image/jpeg')
    if (jpeg) return jpeg
    return await tryEncode('image/png') as Blob
  })()
}

/**
 * 压缩图片
 * @param maxSize 长边最大像素
 * @param quality 编码质量 0~1
 */
export async function compressImage(file: File, maxSize = 512, quality = 0.85): Promise<Blob> {
  const bitmap = await loadBitmap(file)
  const longest = Math.max(bitmap.width, bitmap.height) || 1
  const scale = Math.min(1, maxSize / longest)
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建绘图上下文')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height)
  bitmap.close?.()

  return canvasToBlob(canvas, quality)
}
