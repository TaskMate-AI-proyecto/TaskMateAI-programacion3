-- Base propia del backend Python: no comparte tablas con el esquema de Prisma del backend Node.
-- Postgres ejecuta este script solo al crear el volumen. En un volumen ya existente:
-- docker exec taskmate_db psql -U postgres -c 'CREATE DATABASE taskmate_python;'
CREATE DATABASE taskmate_python;
