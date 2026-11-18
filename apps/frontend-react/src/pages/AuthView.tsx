import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Atmosphere } from '../components/layout/Atmosphere'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { OtpAuthForm } from '../components/OtpAuthForm'
import type { AuthMode } from '../components/otp/otpCopy'
import { cn } from '../utils/cn'

interface BladeRun {
  id: number
  direction: 'right' | 'left'
}

// Login y registro en la misma tarjeta: una hoja diagonal cruza el centro y cambia el panel visible detrás de ella.
export function AuthView({ initialSignup }: { initialSignup: boolean }) {
  const [isSignup, setIsSignup] = useState(initialSignup)
  const [run, setRun] = useState<BladeRun | null>(null)

  function toggleMode() {
    setRun((current) => ({ id: (current?.id ?? 0) + 1, direction: isSignup ? 'left' : 'right' }))
    setIsSignup((current) => !current)
  }

  const activeMode: AuthMode = isSignup ? 'register' : 'login'
  // El panel activo va primero en el DOM: es el que reciben el foco y los selectores de la página.
  const panelOrder: AuthMode[] = isSignup ? ['register', 'login'] : ['login', 'register']

  return (
    <main className="auth-page">
      <Atmosphere />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <Link className="font-display text-xl font-semibold tracking-wide text-slate-100" to="/dashboard">TaskMate</Link>
          <ThemeToggle />
        </div>
        <div className="glass-card animate-fade-up relative grid min-h-[550px] w-full overflow-hidden rounded-3xl p-8 shadow-[0_0_48px_-16px_rgba(99,102,241,0.45)] md:min-h-[600px] md:p-12">
        {panelOrder.map((mode) => (
          <OtpAuthForm isActive={mode === activeMode} key={mode} mode={mode} onSwitch={toggleMode} />
        ))}
        {run && (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-y-[-10%] left-0 z-10 hidden w-[70%] border border-white/20 bg-white/20 backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.08] sm:block',
              run.direction === 'right' ? 'animate-blade-right' : 'animate-blade-left',
            )}
            key={run.id}
            onAnimationEnd={() => setRun(null)}
          />
        )}
        </div>
      </div>
    </main>
  )
}
