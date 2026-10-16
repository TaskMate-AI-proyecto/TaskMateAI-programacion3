export type AuthMode = 'login' | 'register'
export type OtpStep = 'email' | 'code'

interface StepCopy {
  title: string
  subtitle: string
}

export const codeStepCopy: StepCopy = {
  title: 'Revisa tu correo.',
  subtitle: 'Ingresa el código temporal para continuar.',
}

export const authCopy: Record<AuthMode, { eyebrow: string; email: StepCopy }> = {
  login: {
    eyebrow: 'Acceso seguro',
    email: { title: 'Bienvenido de nuevo.', subtitle: 'Usa tu correo y te enviaremos un código de acceso.' },
  },
  register: {
    eyebrow: 'Crear cuenta',
    email: { title: 'Crea tu espacio.', subtitle: 'Regístrate con tu nombre y correo para comenzar.' },
  },
}

export const switchCopy: Record<AuthMode, { question: string; label: string; to: string }> = {
  login: { question: '¿Es tu primera vez?', label: 'Regístrate', to: '/register' },
  register: { question: '¿Ya tienes una cuenta?', label: 'Inicia sesión', to: '/login' },
}
