import { cn } from '../../utils/cn'
import { inlineSegments, parseAiText, type AiBlock } from '../../utils/aiText'

// Tramos de texto: la negrita sale como <strong>, nunca como asteriscos.
function InlineText({ text }: { text: string }) {
  return (
    <>
      {inlineSegments(text).map((segment, index) =>
        segment.bold ? (
          <strong className="font-semibold text-slate-100" key={index}>{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

function BlockView({ block }: { block: AiBlock }) {
  if (block.kind === 'paragraph') return <p><InlineText text={block.text} /></p>

  const listClass = block.ordered ? 'list-decimal space-y-1.5 pl-5' : 'list-disc space-y-1.5 pl-5'
  const items = block.items.map((item, index) => (
    <li key={index}><InlineText text={item} /></li>
  ))

  return block.ordered ? <ol className={listClass}>{items}</ol> : <ul className={listClass}>{items}</ul>
}

// Respuesta de la IA con párrafos y listas bien espaciados.
export function AiText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-3 leading-relaxed', className)}>
      {parseAiText(text).map((block, index) => (
        <BlockView block={block} key={index} />
      ))}
    </div>
  )
}
