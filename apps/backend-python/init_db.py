#!/usr/bin/env python
"""Database initialization script."""

import sys

from src.database import init_db


def main() -> int:
    try:
        print("🔧 Inicializando base de datos...")
        init_db()
        print("✅ Base de datos inicializada exitosamente.")
        print("📊 Las siguientes tablas fueron creadas:")
        print("   - users")
        print("   - categories")
        print("   - tasks")
        return 0
    except Exception as e:
        print(f"❌ Error al inicializar la base de datos: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
