export function Badge({ tone, children }: { tone: string; children: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>
}
