import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

interface IconFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
}

export function IconField({ label, icon: Icon, className = '', ...inputProps }: IconFieldProps) {
  return (
    <label className="block text-sm font-medium">{label}
      <div className="relative mt-1.5">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/45" size={17} />
        <input {...inputProps} className={`w-full rounded-md border border-ink/20 bg-white py-2.5 pl-10 pr-3 outline-none focus:border-ink ${className}`} />
      </div>
    </label>
  )
}
