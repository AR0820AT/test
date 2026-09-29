/**
 * 语音输入：直接用浏览器自带的语音识别（Web Speech API），零依赖
 * 支持情况：Chrome / Edge / 安卓 Chrome / iOS Safari 14.5+ 可以，Firefox 不支持
 * 不支持时 supported === false，界面上就不显示麦克风按钮
 * 注意：必须在 HTTPS（或 localhost）下、并且由用户点击触发
 */

import { ref } from 'vue'

/** 只声明用到的那一小部分，避免为了类型去装第三方类型包 */
interface SpeechAlternative {
  transcript: string
}
interface SpeechResultLike {
  isFinal: boolean
  [index: number]: SpeechAlternative
}
interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResultLike> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

/** 识别语言：中文普通话 */
const LANG = 'zh-CN'

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export interface SpeechHandlers {
  /** 一段话说完（定稿）后回调，用来追加到草稿里 */
  onFinal(text: string): void
  /** 出错时给一句人话，交给 toast 显示 */
  onError(message: string): void
}

export function useSpeechInput() {
  /** 浏览器能不能用语音识别 */
  const supported = Boolean(getCtor())
  /** 正在听 */
  const listening = ref(false)
  /** 还没定稿的中间结果，实时显示在输入框里 */
  const interim = ref('')

  let recognition: RecognitionLike | null = null
  /** 用户没主动点停就一直听着（Safari 会自己掐断一段，需要续上） */
  let keepGoing = false
  let handleFinal: (text: string) => void = () => {}
  let handleError: (message: string) => void = () => {}

  function build(): RecognitionLike | null {
    const Ctor = getCtor()
    if (!Ctor) return null
    const rec = new Ctor()
    rec.lang = LANG
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (event) => {
      let pending = ''
      let settled = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ''
        if (result.isFinal) settled += text
        else pending += text
      }
      interim.value = pending.trim()
      if (settled.trim()) handleFinal(settled.trim())
    }

    rec.onerror = (event) => {
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          handleError('麦克风被拒绝了，去浏览器/系统设置里打开')
          stop()
          break
        case 'audio-capture':
          handleError('没找到麦克风')
          stop()
          break
        case 'network':
          handleError('语音识别要联网，这次没连上')
          stop()
          break
        default:
          // no-speech / aborted 之类的不算错，让 onend 决定继续还是结束
          break
      }
    }

    rec.onend = () => {
      // 还在听：重新开一段，接着说（Safari 每段会自动结束）
      if (keepGoing) {
        try {
          recognition?.start()
        } catch {
          keepGoing = false
          listening.value = false
        }
        return
      }
      listening.value = false
      interim.value = ''
    }

    return rec
  }

  function start(handlers: SpeechHandlers): void {
    if (!supported) return
    handleFinal = handlers.onFinal
    handleError = handlers.onError
    if (!recognition) recognition = build()
    if (!recognition) return
    keepGoing = true
    interim.value = ''
    try {
      recognition.start()
      listening.value = true
    } catch {
      // 已经开始了（重复点击）就忽略
      keepGoing = false
    }
  }

  function stop(): void {
    keepGoing = false
    listening.value = false
    interim.value = ''
    recognition?.stop()
  }

  return { supported, listening, interim, start, stop }
}
