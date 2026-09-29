<script setup lang="ts">
const EMOJIS = [
  '😀','😄','😁','😂','🤣','😊','😍','😘','🥰','😘','😉','😎','🤔','😐','😑','😴',
  '😭','😅','🥲','😳','🙃','😱','😤','😡','🥺','😔','😩','😰','🤗','🤭','🤫','😶',
  '👍','👎','👌','🙏','✌️','🤝','👏','💪','🫶','❤️','💔','✨','🔥','🎉','🎁','🌸',
  '🌙','☀️','⭐','🌈','☕','🍰','🍜','🍚','🍺','🐱','🐶','🐼','🐰','🦊','🍀','💤',
]

const emit = defineEmits<{ pick: [value: string] }>()
</script>

<template>
  <div class="emoji-panel no-scrollbar">
    <button v-for="(emoji, index) in EMOJIS" :key="index" class="emoji" @click="emit('pick', emoji)">
      {{ emoji }}
    </button>
  </div>
</template>

<style scoped>
.emoji-panel {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
  padding: 8px 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  max-height: min(220px, 32vh);
}

.emoji {
  aspect-ratio: 1;
  font-size: 24px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  transition: background 0.16s ease, transform 0.16s ease;
}

.emoji:active {
  background: var(--accent-soft);
  transform: scale(1.15);
}
</style>
