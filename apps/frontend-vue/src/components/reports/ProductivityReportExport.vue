<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import { useProductivityReport } from '../../composables/useProductivityReport'
import ProductivityReportModal from './ProductivityReportModal.vue'

// Botón glassy "Exportar Reporte PDF" con su modal de vista previa.
const { isOpen, status, previewUrl, errorMessage, open, close, retry } = useProductivityReport()
</script>

<template>
  <button class="inline-flex items-center gap-2 rounded-xl border border-glass/20 bg-glass/10 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-xl transition hover:bg-glass/20 hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.7)]" type="button" @click="open">
    <FileText aria-hidden :size="16" />
    Exportar Reporte PDF
  </button>
  <ProductivityReportModal
    v-if="isOpen"
    :error-message="errorMessage"
    :preview-url="previewUrl"
    :status="status"
    @close="close"
    @retry="retry"
  />
</template>
