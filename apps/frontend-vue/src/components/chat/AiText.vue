<script setup lang="ts">
import { computed } from 'vue'
import { inlineSegments, parseAiText } from '../../utils/aiText'

// Respuesta de la IA con párrafos y listas bien espaciados; la negrita sale como <strong>, nunca como asteriscos.
const props = defineProps<{ text: string }>()

const blocks = computed(() => parseAiText(props.text))
</script>

<template>
  <div class="space-y-3 leading-relaxed">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.kind === 'paragraph'">
        <template v-for="(segment, segmentIndex) in inlineSegments(block.text)" :key="segmentIndex">
          <strong v-if="segment.bold" class="font-semibold text-slate-100">{{ segment.text }}</strong>
          <span v-else>{{ segment.text }}</span>
        </template>
      </p>

      <ol v-else-if="block.ordered" class="list-decimal space-y-1.5 pl-5">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <template v-for="(segment, segmentIndex) in inlineSegments(item)" :key="segmentIndex">
            <strong v-if="segment.bold" class="font-semibold text-slate-100">{{ segment.text }}</strong>
            <span v-else>{{ segment.text }}</span>
          </template>
        </li>
      </ol>

      <ul v-else class="list-disc space-y-1.5 pl-5">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <template v-for="(segment, segmentIndex) in inlineSegments(item)" :key="segmentIndex">
            <strong v-if="segment.bold" class="font-semibold text-slate-100">{{ segment.text }}</strong>
            <span v-else>{{ segment.text }}</span>
          </template>
        </li>
      </ul>
    </template>
  </div>
</template>
