// Fondo ambiental estático: manchas difuminadas tras los paneles de cristal. No se anima,
// así que no depende de prefers-reduced-motion.
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-[-10%] h-[480px] w-[480px] rounded-full bg-indigo-600/25 blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[-5%] h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[140px]" />
      <div className="absolute left-1/3 top-1/2 h-[320px] w-[320px] rounded-full bg-sky-500/10 blur-[120px]" />
    </div>
  )
}
