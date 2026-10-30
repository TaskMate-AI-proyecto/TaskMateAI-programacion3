import { motion } from 'framer-motion'
import { Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Category, Task } from '../../types/api'

function pendingIn(category: Category, tasks: Task[]) {
  return tasks.filter((task) => task.categoryId === category.id && task.status !== 'COMPLETED').length
}

// Tile tipo app: color de la categoría, elevación al pasar el cursor y acceso a sus tareas.
function CategoryTile({ category, pending }: { category: Category; pending: number }) {
  return (
    <motion.li whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
      <Link
        className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-white/15 p-4 text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]"
        style={{ background: `linear-gradient(135deg, ${category.color}, #1e1b4b)` }}
        to="/tasks"
      >
        <Tags size={20} />
        <div>
          <p className="font-semibold">{category.name}</p>
          <p className="text-xs text-white/80">{pending} pendientes</p>
        </div>
      </Link>
    </motion.li>
  )
}

interface CategoryTilesProps {
  categories: Category[]
  tasks: Task[]
  error: string | null
}

export function CategoryTiles({ categories, tasks, error }: CategoryTilesProps) {
  return (
    <section aria-labelledby="category-tiles-title" className="space-y-3">
      <h2 className="font-display text-2xl font-semibold text-slate-100" id="category-tiles-title">Categorías</h2>
      {error && <p className="text-sm text-coral" role="alert">{error}</p>}
      {categories.length === 0 ? (
        <p className="glass-card p-4 text-sm text-slate-400">Aún no tienes categorías. Créalas desde Tareas.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <CategoryTile category={category} key={category.id} pending={pendingIn(category, tasks)} />
          ))}
        </ul>
      )}
    </section>
  )
}
