import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { installNoZoom } from './composables/useNoZoom'
import { ensureChineseFont } from './utils/fonts'
import './styles/tokens.css'
import './styles/base.css'

createApp(App).use(createPinia()).mount('#app')

// 中文字体在手机上经常加载不出来，加载失败就换 CDN 再试一次
ensureChineseFont()

// 禁止双击放大与双指缩放，避免聊天界面被撑变形
installNoZoom()

// 生产环境注册 Service Worker，实现离线与「添加到主屏幕」
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href)
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[card-chat] Service Worker 注册失败', error)
    })
  })
}
