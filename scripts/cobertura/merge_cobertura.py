"""Consolida los reportes Cobertura de cada app en un único coverage.xml en la raíz del repo.

Uso: python3 scripts/cobertura/merge_cobertura.py [--min 80]

Cada entrada es (app, ruta del XML, carpeta base de los archivos). Las rutas de los archivos
se reescriben relativas a la raíz del repositorio y se recalculan los totales a partir de las
líneas, así el porcentaje del reporte es el mismo que el de cada suite.
"""

from __future__ import annotations

import argparse
import fnmatch
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# (nombre del paquete, reporte de origen, carpeta a la que son relativos los nombres de archivo)
INPUTS = [
    ("apps/backend-python", ROOT / "apps/backend-python/coverage.xml", "apps/backend-python/src"),
    ("apps/backend-node", ROOT / "apps/backend-node/coverage/cobertura-coverage.xml", "apps/backend-node"),
    ("apps/frontend-react", ROOT / "apps/frontend-react/coverage/cobertura-coverage.xml", "apps/frontend-react"),
]

# Fuera del conteo: dependencias, entornos virtuales, salidas de build, reportes y lockfiles.
EXCLUDED_PARTS = {"node_modules", "venv", ".venv", "dist", "build", "coverage", "htmlcov", "__pycache__"}
EXCLUDED_PATTERNS = ["*.min.*", "*.lock", "package-lock.json", "*.pyc", "*.d.ts", "*.test.*", "*.spec.*"]


def is_excluded(path: str) -> bool:
    parts = set(Path(path).parts)
    if parts & EXCLUDED_PARTS:
        return True
    name = Path(path).name
    return any(fnmatch.fnmatch(name, pattern) for pattern in EXCLUDED_PATTERNS)


def line_counts(class_element: ET.Element) -> tuple[int, int]:
    lines = class_element.findall("./lines/line")
    covered = sum(1 for line in lines if int(line.get("hits", "0")) > 0)
    return len(lines), covered


def rate(covered: int, valid: int) -> str:
    return f"{(covered / valid) if valid else 1:.4f}"


def read_package(app: str, report: Path, base: str) -> tuple[ET.Element, int, int, int, int]:
    tree = ET.parse(report)
    root = tree.getroot()
    package = ET.Element("package", {"name": app})
    classes = ET.SubElement(package, "classes")
    lines_valid = lines_covered = 0

    for source_class in tree.iter("class"):
        raw_filename = source_class.get("filename", "")
        repo_path = f"{base}/{raw_filename}"

        if is_excluded(repo_path):
            continue

        valid, covered = line_counts(source_class)
        lines_valid += valid
        lines_covered += covered

        copy = ET.SubElement(classes, "class", dict(source_class.attrib))
        copy.set("filename", repo_path)
        copy.set("line-rate", rate(covered, valid))
        for child in source_class:
            copy.append(child)

    package.set("line-rate", rate(lines_covered, lines_valid))

    # Los totales de ramas vienen en la raíz de cada reporte (0 cuando la app no mide ramas).
    branches_valid = int(root.get("branches-valid", "0"))
    branches_covered = int(root.get("branches-covered", "0"))
    package.set("branch-rate", rate(branches_covered, branches_valid))
    return package, lines_valid, lines_covered, branches_valid, branches_covered


def build_report(min_percent: float) -> tuple[ET.ElementTree, float]:
    root = ET.Element(
        "coverage",
        {
            "version": "0.1",
            "timestamp": str(int(datetime.now(timezone.utc).timestamp() * 1000)),
        },
    )
    ET.SubElement(ET.SubElement(root, "sources"), "source").text = str(ROOT)
    packages_element = ET.SubElement(root, "packages")

    totals = {"lines_valid": 0, "lines_covered": 0, "branches_valid": 0, "branches_covered": 0}
    for app, report, base in INPUTS:
        if not report.exists():
            sys.exit(f"Falta el reporte de {app}: {report}. Ejecuta scripts/cobertura/run_all.sh primero.")

        package, lines_valid, lines_covered, branches_valid, branches_covered = read_package(app, report, base)
        packages_element.append(package)
        totals["lines_valid"] += lines_valid
        totals["lines_covered"] += lines_covered
        totals["branches_valid"] += branches_valid
        totals["branches_covered"] += branches_covered

    percent = 100 * totals["lines_covered"] / totals["lines_valid"] if totals["lines_valid"] else 100.0
    root.set("lines-valid", str(totals["lines_valid"]))
    root.set("lines-covered", str(totals["lines_covered"]))
    root.set("line-rate", rate(totals["lines_covered"], totals["lines_valid"]))
    root.set("branches-valid", str(totals["branches_valid"]))
    root.set("branches-covered", str(totals["branches_covered"]))
    root.set("branch-rate", rate(totals["branches_covered"], totals["branches_valid"]))
    root.set("complexity", "0")

    return ET.ElementTree(root), percent


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--min", type=float, default=80.0, help="Cobertura de líneas mínima exigida (por defecto 80).")
    args = parser.parse_args()

    tree, percent = build_report(args.min)
    ET.indent(tree, space="  ")
    output = ROOT / "coverage.xml"
    tree.write(output, encoding="utf-8", xml_declaration=True)

    print(f"Cobertura de líneas consolidada: {percent:.2f}% -> {output}")
    if percent < args.min:
        print(f"FALLA: la cobertura está por debajo del mínimo de {args.min:.0f}%.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
