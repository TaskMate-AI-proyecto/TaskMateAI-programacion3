// Ejecuta Python con el venv del proyecto si existe (así npm run build/lint/test no depende de activarlo).
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const isWindows = process.platform === 'win32'
const venvPython = path.join('venv', isWindows ? 'Scripts/python.exe' : 'bin/python')
const python = existsSync(venvPython) ? venvPython : isWindows ? 'python' : 'python3'
const result = spawnSync(python, process.argv.slice(2), { stdio: 'inherit' })

process.exit(result.status ?? 1)
