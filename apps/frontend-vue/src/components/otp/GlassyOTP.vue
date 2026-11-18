<script setup lang="ts">
import { ref, watch, type ComponentPublicInstance, type Directive, type DirectiveBinding } from 'vue'
import { AnimatePresence, motion } from 'motion-v'
import { Check } from 'lucide-vue-next'
import {
  clearDigit,
  codeOf,
  emptyDigits,
  isComplete,
  nextIndex,
  onlyDigits,
  otpLength,
  pasteDigits,
  previousIndex,
  writeDigit,
  type OtpStatus,
} from './otpInput'

// Mismo diseño que GlassyOTP de React: las tarjetas de verificación y las casillas comparten la base de cristal.
const props = defineProps<{ status: OtpStatus }>()

const emit = defineEmits<{
  change: [code: string]
  complete: [code: string]
  'success-done': []
}>()

const cardClass = 'grid h-14 w-11 place-items-center rounded-2xl border border-glass/20 bg-glass/10 backdrop-blur-xl'
const inputClass = `${cardClass} text-center font-display text-2xl font-semibold text-slate-100 outline-none transition focus:border-glass/40 focus:shadow-[0_0_20px_-4px_rgb(var(--glass-rgb)/0.45)]`
const successClass = 'grid h-14 w-14 place-items-center rounded-full border border-mint/40 bg-mint/20 text-emerald-700 dark:text-emerald-300'
// Objetos estables fuera de la plantilla: motion-v no reinicia la animación en cada render.
const spinCard = { rotate: 360, y: [0, -20, 0] }
const spinTransition = (index: number) => ({ duration: 1.6, ease: 'easeInOut' as const, repeat: Infinity, delay: index * 0.1 })
const successSpring = { type: 'spring' as const, stiffness: 260, damping: 18 }
const shake = [0, -12, 12, -8, 8, 0]
const arrowMoves: Record<string, (index: number) => number> = { ArrowLeft: previousIndex, ArrowRight: nextIndex }

const digits = ref<string[]>(emptyDigits())
const inputs = ref<(HTMLInputElement | null)[]>([])

// Tras un error el código se vacía para volver a intentarlo.
watch(
  () => props.status,
  (status) => {
    if (status === 'error') digits.value = emptyDigits()
  },
)

// Enfoca la primera casilla cada vez que se monta: funciona al volver de "verificando" o tras un error.
const vAutofocus: Directive<HTMLElement, boolean> = {
  mounted: (el: HTMLElement, binding: DirectiveBinding<boolean>) => {
    if (binding.value) el.focus()
  },
}

function setInput(index: number, el: Element | ComponentPublicInstance | null) {
  inputs.value[index] = el instanceof HTMLInputElement ? el : null
}

function focusInput(index: number) {
  inputs.value[index]?.focus()
}

function update(next: string[]) {
  const code = codeOf(next)
  digits.value = next
  emit('change', code)
  if (isComplete(next)) emit('complete', code)
}

function inputValue(event: Event) {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

function handleInput(index: number, event: Event) {
  const next = writeDigit(digits.value, index, inputValue(event))
  update(next)
  if (next[index]) focusInput(nextIndex(index))
}

function handleBackspace(index: number, event: KeyboardEvent) {
  if (digits.value[index] !== '' || index === 0) return

  event.preventDefault()
  update(clearDigit(digits.value, index - 1))
  focusInput(previousIndex(index))
}

function handleKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') handleBackspace(index, event)

  const move = arrowMoves[event.key]
  if (move) focusInput(move(index))
}

function handlePaste(index: number, event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') ?? ''
  update(pasteDigits(digits.value, index, text))
  focusInput(Math.min(index + onlyDigits(text).length, otpLength - 1))
}
</script>

<template>
  <div class="flex min-h-14 items-center justify-center">
    <AnimatePresence mode="wait">
      <motion.div
        v-if="status === 'verifying'"
        key="verifying"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :initial="{ opacity: 0 }"
        class="flex gap-2"
      >
        <motion.div
          v-for="index in otpLength"
          :key="index"
          :animate="spinCard"
          :class="cardClass"
          :transition="spinTransition(index - 1)"
        />
      </motion.div>

      <motion.div
        v-else-if="status === 'success'"
        key="success"
        :animate="{ scale: 1 }"
        :class="successClass"
        :exit="{ opacity: 0 }"
        :initial="{ scale: 0 }"
        :on-animation-complete="() => emit('success-done')"
        :transition="successSpring"
      >
        <Check :size="28" />
      </motion.div>

      <motion.div
        v-else
        :key="status === 'error' ? 'error' : 'idle'"
        :animate="{ opacity: 1, x: status === 'error' ? shake : 0 }"
        :exit="{ opacity: 0 }"
        :initial="{ opacity: 0 }"
        :transition="{ duration: 0.5 }"
        aria-label="Código de verificación"
        class="flex gap-2"
        role="group"
      >
        <input
          v-for="(digit, index) in digits"
          :key="index"
          v-autofocus="index === 0"
          :aria-label="`Dígito ${index + 1} del código`"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'"
          :class="inputClass"
          :ref="(el) => setInput(index, el)"
          :value="digit"
          inputmode="numeric"
          type="text"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste(index, $event)"
        />
      </motion.div>
    </AnimatePresence>
  </div>
</template>
