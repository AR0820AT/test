import { defineStore } from 'pinia'
import type { Profile } from '@/types'
import { usePersisted } from '@/storage/persist'

interface ProfileState {
  me: Profile
  them: Profile
}

function defaults(): ProfileState {
  return {
    me: { nickname: '我' },
    them: { nickname: '小卡' },
  }
}

export const useProfileStore = defineStore('profile', () => {
  const state = usePersisted<ProfileState>('profile', defaults)

  // 旧版本存过头像字段，现在不用了：清掉，避免出现在备份文件里
  for (const key of ['me', 'them'] as const) {
    const legacy = state.value[key] as Profile & { avatarId?: string | null }
    if ('avatarId' in legacy) delete legacy.avatarId
  }

  /** 获取某一侧的资料对象 */
  function side(role: 'me' | 'them'): Profile {
    return role === 'me' ? state.value.me : state.value.them
  }

  function nameOf(role: 'me' | 'them'): string {
    return side(role).nickname || (role === 'me' ? '我' : '对方')
  }

  function setNickname(role: 'me' | 'them', nickname: string): void {
    side(role).nickname = nickname
  }

  return { state, side, nameOf, setNickname }
})
