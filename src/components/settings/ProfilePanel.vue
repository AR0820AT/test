<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from '@/components/common/Avatar.vue'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUiStore } from '@/stores/useUiStore'
import { putAsset } from '@/storage/assets'
import { compressImage } from '@/utils/image'
import { uid } from '@/utils/id'
import type { Role } from '@/types'

const profile = useProfileStore()
const ui = useUiStore()

const myAvatarInput = ref<HTMLInputElement | null>(null)
const themAvatarInput = ref<HTMLInputElement | null>(null)

const myName = computed({
  get: () => profile.side('me').nickname,
  set: (value: string) => profile.setNickname('me', value),
})

const themName = computed({
  get: () => profile.side('them').nickname,
  set: (value: string) => profile.setNickname('them', value),
})

async function pickAvatar(role: Role, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const blob = await compressImage(file, 512, 0.9)
    const assetId = uid('av_')
    await putAsset(assetId, blob)
    await profile.setAvatar(role, assetId)
    ui.toast('头像已更新')
  } catch {
    ui.toast('这张图片读不出来，换一张试试')
  }
}

function clearAvatar(role: Role): void {
  if (!profile.side(role).avatarId) {
    ui.toast('当前已经是默认头像')
    return
  }
  void profile.setAvatar(role, null)
  ui.toast('已恢复默认头像')
}
</script>

<template>
  <div class="panel">
    <section class="section">
      <div class="sec-title">我</div>
      <div class="sec-body">
        <div class="head">
          <button class="avatar-wrap" aria-label="更换我的头像" @click="myAvatarInput?.click()">
            <Avatar role="me" :size="58" />
          </button>
          <div class="fields">
            <input v-model="myName" class="input" placeholder="昵称" maxlength="16" />
            <div class="ops">
              <button class="btn" @click="myAvatarInput?.click()">更换头像</button>
              <button class="btn danger" @click="clearAvatar('me')">移除</button>
            </div>
          </div>
        </div>
        <input ref="myAvatarInput" type="file" accept="image/*" hidden @change="pickAvatar('me', $event)" />
      </div>
    </section>

    <section class="section">
      <div class="sec-title">对方（负责抽字卡的那位）</div>
      <div class="sec-body">
        <div class="head">
          <button class="avatar-wrap" aria-label="更换对方头像" @click="themAvatarInput?.click()">
            <Avatar role="them" :size="58" />
          </button>
          <div class="fields">
            <input v-model="themName" class="input" placeholder="昵称" maxlength="16" />
            <div class="ops">
              <button class="btn" @click="themAvatarInput?.click()">更换头像</button>
              <button class="btn danger" @click="clearAvatar('them')">移除</button>
            </div>
          </div>
        </div>
        <input ref="themAvatarInput" type="file" accept="image/*" hidden @change="pickAvatar('them', $event)" />
      </div>
    </section>

    <p class="muted">
      点头像或「更换头像」都可以换图，图片会自动压缩后存在本机。昵称会显示在引用气泡里。
    </p>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  gap: 14px;
  align-items: center;
}

.avatar-wrap {
  flex: none;
  border-radius: 12%;
  overflow: hidden;
}

.fields {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ops {
  display: flex;
  gap: 8px;
}
</style>
