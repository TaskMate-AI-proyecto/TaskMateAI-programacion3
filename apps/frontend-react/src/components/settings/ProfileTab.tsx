import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../hooks/useSettings'
import { avatarInitials, maxDisplayNameLength } from '../../settings/settings'

// Perfil: avatar con iniciales, nombre de usuario guardado en el navegador y correo de la cuenta (sólo lectura).
export function ProfileTab() {
  const { settings, update } = useSettings()
  const { user } = useAuth()
  const email = user?.email ?? ''

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-xl font-semibold text-white">
          {avatarInitials(settings.displayName, email)}
        </span>
        <div>
          <p className="font-semibold text-slate-100">{settings.displayName || 'Sin nombre'}</p>
          <p className="text-sm text-slate-400">{email || 'Espacio personal'}</p>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="settings-label" htmlFor="settings-name">Nombre de usuario</label>
        <input className="settings-field" id="settings-name" maxLength={maxDisplayNameLength} onChange={(event) => update({ displayName: event.target.value })} placeholder="Cómo quieres que te llamemos" type="text" value={settings.displayName} />
        <p className="settings-hint">{settings.displayName.length}/{maxDisplayNameLength} · Se guarda en este navegador.</p>
      </div>

      <div className="flex flex-col">
        <label className="settings-label" htmlFor="settings-email">Correo electrónico</label>
        <input className="settings-field cursor-not-allowed opacity-70" id="settings-email" readOnly type="email" value={email} />
        <p className="settings-hint">El correo lo gestiona tu cuenta.</p>
      </div>
    </section>
  )
}
