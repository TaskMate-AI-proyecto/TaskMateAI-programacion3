#!/usr/bin/env bash
# Ejecuta las suites de los tres paquetes con cobertura y consolida ./coverage.xml en la raíz del repo.
#
#   backend-python  -> pytest + pytest-cov   -> apps/backend-python/coverage.xml
#   backend-node    -> vitest + v8 cobertura -> apps/backend-node/coverage/cobertura-coverage.xml
#   frontend-react  -> vitest + v8 cobertura -> apps/frontend-react/coverage/cobertura-coverage.xml
#
# Un fallo en cualquier suite detiene el script: no se consolida un reporte incompleto.
# El intérprete de Python se puede fijar con PYTHON=/ruta/al/python.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pick_python() {
  if [[ -n "${PYTHON:-}" ]]; then echo "$PYTHON"; return; fi
  for candidate in "$ROOT/apps/backend-python/venv/bin/python" "$HOME/.venvs/taskmate-backend/bin/python"; do
    if [[ -x "$candidate" ]]; then echo "$candidate"; return; fi
  done
  echo "python3"
}

PY="$(pick_python)"
echo "Python de las pruebas: $PY"

echo
echo "==> backend-python (pytest + pytest-cov)"
(
  cd "$ROOT/apps/backend-python"
  JWT_SECRET="${JWT_SECRET:-test-secret}" \
  GEMINI_API_KEY="${GEMINI_API_KEY:-test-key}" \
  DATABASE_URL="${DATABASE_URL:-sqlite:///./test.db}" \
    "$PY" -m pytest -p no:cacheprovider -q
)

echo
echo "==> backend-node (vitest + cobertura)"
(cd "$ROOT/apps/backend-node" && npx vitest run --coverage)

echo
echo "==> frontend-react (vitest + cobertura)"
(cd "$ROOT/apps/frontend-react" && npx vitest run --coverage)

echo
echo "==> consolidado"
python3 "$ROOT/scripts/cobertura/merge_cobertura.py" --min 80
