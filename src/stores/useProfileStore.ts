import { defineStore } from 'pinia'
import type { Profile } from '@/types'
import { usePersisted } from '@/storage/persist'
import { deleteAsset } from '@/storage/assets'

interface ProfileState {
  me: Profile
  them: Profile
}

function defaults(): ProfileState {
  return {
    me: { nickname: '我', avatarId: null },
    them: { nickname: '小卡', avatarId: null },
  }
}

export const useProfileStore = defineStore('profile', () => {
  const state = usePersisted<ProfileState>('profile', defaults)

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

  /** 设置头像：旧头像资源一并删除，避免空间浪费 */
  async function setAvatar(role: 'me' | 'them', assetId: string | null): Promise<void> {
    const previous = side(role).avatarId
    if (previous === assetId) return
    side(role).avatarId = assetId
    if (previous) {
      await deleteAsset(previous).catch(() => undefined)
    }
  }

  return { state, side, nameOf, setNickname, setAvatar }
})
