<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '@/stores/useProfileStore'
import type { Role } from '@/types'

const profile = useProfileStore()

const myName = computed({
  get: () => profile.side('me').nickname,
  set: (value: string) => profile.setNickname('me', value),
})

const themName = computed({
  get: () => profile.side('them').nickname,
  set: (value: string) => profile.setNickname('them', value),
})

function reset(role: Role): void {
  profile.setNickname(role, role === 'me' ? '我' : '小卡')
}
</script>

<template>
  <div class="panel">
    <section class="section">
      <div class="sec-title">我</div>
      <div class="sec-body">
        <div class="head">
          <input v-model="myName" class="input" placeholder="昵称" maxlength="16" />
          <button class="btn" @click="reset('me')">重置</button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="sec-title">对方（负责抽字卡的那位）</div>
      <div class="sec-body">
        <div class="head">
          <input v-model="themName" class="input" placeholder="昵称" maxlength="16" />
          <button class="btn" @click="reset('them')">重置</button>
        </div>
      </div>
    </section>

    <p class="muted">不显示头像，昵称会显示在每条消息的气泡上方，也会出现在引用气泡里。</p>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input {
  flex: 1;
  min-width: 0;
}
</style>
