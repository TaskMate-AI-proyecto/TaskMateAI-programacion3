// Convierte la respuesta de la IA en bloques legibles: párrafos y listas, sin Markdown crudo.
export type AiBlock = { kind: 'paragraph'; text: string } | { kind: 'list'; ordered: boolean; items: string[] }

export interface AiSegment {
  text: string
  bold: boolean
}

const listItemPattern = /^\s*(?:([-*•])|(\d+[.)]))\s+(.*)$/
const headingPattern = /^\s{0,3}#{1,6}\s+/

function lastBlock(blocks: AiBlock[]) {
  return blocks[blocks.length - 1]
}

function appendToLastItem(blocks: AiBlock[], text: string) {
  const last = lastBlock(blocks)
  if (last?.kind === 'list' && last.items.length > 0) last.items[last.items.length - 1] += ` ${text}`
}

function addListItem(blocks: AiBlock[], ordered: boolean, text: string) {
  const last = lastBlock(blocks)
  if (last?.kind === 'list' && last.ordered === ordered) last.items.push(text)
  else blocks.push({ kind: 'list', ordered, items: [text] })
}

function isListContinuation(blocks: AiBlock[], line: string) {
  return /^\s+\S/.test(line) && lastBlock(blocks)?.kind === 'list'
}

interface ParseState {
  blocks: AiBlock[]
  paragraph: string[]
}

function flushParagraph(state: ParseState) {
  if (state.paragraph.length > 0) state.blocks.push({ kind: 'paragraph', text: state.paragraph.join(' ') })
  state.paragraph = []
}

function addHeading(state: ParseState, line: string) {
  flushParagraph(state)
  state.blocks.push({ kind: 'paragraph', text: line.replace(headingPattern, '').trim() })
}

// Clasifica cada línea: vacía (cierra el párrafo), encabezado, ítem de lista, continuación o texto.
function addLine(state: ParseState, line: string) {
  const item = listItemPattern.exec(line)

  if (line.trim() === '') flushParagraph(state)
  else if (headingPattern.test(line)) addHeading(state, line)
  else if (item) {
    flushParagraph(state)
    addListItem(state.blocks, Boolean(item[2]), item[3].trim())
  } else if (isListContinuation(state.blocks, line)) appendToLastItem(state.blocks, line.trim())
  else state.paragraph.push(line.trim())
}

// Acumula líneas de un párrafo hasta una línea en blanco, un encabezado o una lista.
export function parseAiText(raw: string): AiBlock[] {
  const state: ParseState = { blocks: [], paragraph: [] }

  for (const line of raw.replace(/\r\n?/g, '\n').split('\n')) addLine(state, line)

  flushParagraph(state)
  return state.blocks
}

// Separa el texto en tramos normales y en negrita: los `**` desaparecen y nunca se muestran.
export function inlineSegments(text: string): AiSegment[] {
  return text
    .split('**')
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text !== '')
}
