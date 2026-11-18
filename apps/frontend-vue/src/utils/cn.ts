// Une clases CSS ignorando las vacías o falsas (sin dependencias: Vue usa :class para lo complejo).
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
