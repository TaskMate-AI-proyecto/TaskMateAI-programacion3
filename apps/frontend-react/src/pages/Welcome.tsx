import { useState } from 'react'
import { Activity, Loader2 } from 'lucide-react'

type PingState =
  | { status: 'idle' }
  | { status: 'pinging' }
  | { status: 'success'; latency: number }

export function Welcome() {
  const [ping, setPing] = useState<PingState>({ status: 'idle' })

  const handlePing = async () => {
    setPing({ status: 'pinging' })
    const start = performance.now()
    // Simula una petición HTTP (Axios/Fetch) con una latencia variable.
    await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 600))
    setPing({ status: 'success', latency: Math.round(performance.now() - start) })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-16 text-ink">
      {/* Gradientes de fondo: limpios y sutiles. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-mint/20 blur-[130px]" />
        <div className="absolute bottom-[-18%] right-[6%] h-[440px] w-[440px] rounded-full bg-coral/20 blur-[130px]" />
      </div>

      <section className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {/* Badge animado */}
        <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-4 py-1.5 text-xs font-semibold text-ink/70 shadow-sm backdrop-blur">
          <span className="relative grid h-2 w-2 place-items-center">
            <span className="absolute inline-flex h-2 w-2 animate-pulse-ring rounded-full bg-mint" />
            <span className="inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          CodeGraph + 21st.dev Active
        </span>

        {/* Hero */}
        <h1
          className="mt-8 animate-fade-up font-display text-6xl font-semibold leading-[1.05] tracking-tight"
          style={{ animationDelay: '80ms' }}
        >
          Interfaz Base
        </h1>
        <p
          className="mt-5 max-w-md animate-fade-up text-base leading-7 text-ink/60"
          style={{ animationDelay: '160ms' }}
        >
          Base de interfaz premium para TaskMate — tipografía nítida, gradientes limpios y
          microinteracciones sutiles.
        </p>

        {/* Card interactiva */}
        <div
          className="mt-12 w-full animate-fade-up rounded-2xl border border-ink/10 bg-white/80 p-8 text-left shadow-[0_24px_60px_-20px_rgba(20,33,61,0.28)] backdrop-blur"
          style={{ animationDelay: '240ms' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Conexión HTTP</p>
              <p className="mt-1 text-xs text-ink/50">Simula una petición al backend</p>
            </div>
            <StatusPill ping={ping} />
          </div>

          <button
            type="button"
            onClick={handlePing}
            disabled={ping.status === 'pinging'}
            className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-lg active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            {ping.status === 'pinging' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando ping…
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 transition-transform group-hover:scale-110" /> Simular ping HTTP
              </>
            )}
          </button>

          {ping.status === 'success' && (
            <p className="mt-4 text-center text-sm text-ink/60">
              Respuesta recibida · <span className="font-semibold text-mint">{ping.latency} ms</span>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

function StatusPill({ ping }: { ping: PingState }) {
  if (ping.status === 'success') return <span className="status-ok">200 OK</span>
  if (ping.status === 'pinging') return <span className="status-wait">Conectando…</span>
  return (
    <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/50">En espera</span>
  )
}
