<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Marcador de la sesión iniciada. La vista de tareas queda fuera de este alcance.
const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.clearSession()
  void router.replace('/login')
}
</script>

<template>
  <main class="auth-page">
    <section class="glass-card rounded-3xl p-8 text-center">
      <p class="eyebrow">Sesión iniciada</p>
      <h1 class="font-display text-3xl font-semibold text-slate-100">Hola, {{ auth.user?.email }}</h1>
      <button class="command-button mt-6 rounded-2xl" type="button" @click="logout">Cerrar sesión</button>
    </section>
  </main>
</template>
