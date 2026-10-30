import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface IconFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon: LucideIcon
}

export function IconField({ label, icon: Icon, className, ...inputProps }: IconFieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-300">{label}
      <div className="relative mt-1.5">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
        <input
          {...inputProps}
          className={cn(
            'w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25)]',
            className,
          )}
        />
      </div>
    </label>
  )
}
